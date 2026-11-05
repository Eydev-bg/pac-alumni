<?php

namespace Tests\Feature\Admin;

use App\Jobs\ProcessGraduateImport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Guards the upload validation on POST /api/admin/graduates/import.
 *
 * Regression: small CSVs (header + 1–2 rows) sniff as text/plain, which the
 * old 'mimes' rule mapped to "txt" and rejected.
 */
class ImportGraduatesRequestTest extends TestCase
{
    use RefreshDatabase;

    private const URI = '/api/admin/graduates/import';

    private const HEADER = "first_name,middle_name,last_name,suffix,graduation_year,alumni_id,course_code\r\n";

    private const ROW = "Juan,,Dela Cruz,,2024,,BSIT\r\n";

    /** Smallest valid 1x1 PNG — finfo reports image/png. */
    private const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
        Storage::fake(config('filesystems.uploads_disk'));
    }

    private function authAs(User $user): void
    {
        $this->withHeader('Authorization', 'Bearer ' . JWTAuth::fromUser($user));
    }

    /**
     * Build a real UploadedFile over a temp file. UploadedFile::fake() is NOT
     * used: its getMimeType() is guessed from the file name rather than sniffed
     * from the bytes, which would hide both the original text/plain bug and
     * the PNG-renamed-to-.csv content check.
     */
    private function makeUpload(string $name, string $bytes): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'imp');
        file_put_contents($path, $bytes);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function upload(string $name, string $bytes)
    {
        return $this->post(self::URI, [
            'file' => $this->makeUpload($name, $bytes),
            'education_level' => 'college',
        ], ['Accept' => 'application/json']);
    }

    public function test_csv_with_header_and_one_row_is_accepted(): void
    {
        $this->authAs(User::factory()->admin()->create());

        $this->upload('graduates.csv', self::HEADER . self::ROW)->assertSuccessful();

        Queue::assertPushed(ProcessGraduateImport::class);
    }

    public function test_csv_with_bom_and_one_row_is_accepted(): void
    {
        $this->authAs(User::factory()->admin()->create());

        $this->upload('graduates.csv', "\xEF\xBB\xBF" . self::HEADER . self::ROW)->assertSuccessful();

        Queue::assertPushed(ProcessGraduateImport::class);
    }

    public function test_csv_with_five_rows_is_accepted(): void
    {
        $this->authAs(User::factory()->admin()->create());

        $this->upload('graduates.csv', self::HEADER . str_repeat(self::ROW, 5))->assertSuccessful();

        Queue::assertPushed(ProcessGraduateImport::class);
    }

    public function test_txt_extension_is_rejected(): void
    {
        $this->authAs(User::factory()->admin()->create());

        $this->upload('graduates.txt', self::HEADER . self::ROW)
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');

        Queue::assertNothingPushed();
    }

    public function test_png_renamed_to_csv_is_rejected_by_content_sniff(): void
    {
        $this->authAs(User::factory()->admin()->create());

        $this->upload('graduates.csv', base64_decode(self::PNG_BASE64))
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');

        Queue::assertNothingPushed();
    }

    public function test_non_admin_is_forbidden(): void
    {
        $this->authAs(User::factory()->create());

        $this->upload('graduates.csv', self::HEADER . self::ROW)->assertForbidden();

        Queue::assertNothingPushed();
    }
}
