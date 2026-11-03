<?php

namespace Tests\Feature\Admin;

use App\Enums\ImportStatus;
use App\Models\Course;
use App\Models\Graduate;
use App\Models\ImportBatch;
use App\Models\User;
use App\Services\Admin\GraduateImportService;
use Database\Factories\CourseFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Guards against CSV encoding corruption on graduate import (e.g. "Niñofranco"
 * saved by Excel as Windows-1252 being stored as "Ni�ofranco").
 */
class GraduateImportEncodingTest extends TestCase
{
    use RefreshDatabase;

    private const HEADER = "first_name,middle_name,last_name,suffix,graduation_year,alumni_id,course_code\r\n";

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(config('filesystems.uploads_disk'));
        $this->course = CourseFactory::new()->create(['code' => 'BSIT']);
    }

    /**
     * Mirror GraduateImportService::queue(): store the raw bytes on the uploads
     * disk, create a PROCESSING batch, then run process() synchronously.
     */
    private function runImport(string $bytes): ImportBatch
    {
        $storedPath = 'imports/test-' . uniqid() . '.csv';
        Storage::disk(config('filesystems.uploads_disk'))->put($storedPath, $bytes);

        $batch = ImportBatch::create([
            'uploaded_by' => User::factory()->admin()->create()->id,
            'file_name' => 'graduates.csv',
            'education_level' => 'college',
            'status' => ImportStatus::PROCESSING,
        ]);

        app(GraduateImportService::class)->process($batch, $storedPath);

        return $batch->fresh();
    }

    private function assertImportedFirstName(ImportBatch $batch, string $expected): void
    {
        $this->assertSame(ImportStatus::COMPLETED, $batch->status, json_encode($batch->error_details));
        $this->assertSame(1, $batch->imported_count, json_encode($batch->error_details));

        $graduate = Graduate::where('last_name', 'Dela Cruz')->firstOrFail();
        $this->assertSame($expected, $graduate->first_name);
        $this->assertSame($this->course->id, $graduate->course_id);
    }

    public function test_windows_1252_csv_is_converted_to_utf8(): void
    {
        // 0xF1 is "ñ" in Windows-1252 — what Excel "CSV (Comma delimited)" writes.
        $bytes = self::HEADER . "Ni\xF1ofranco,,Dela Cruz,,2024,,BSIT\r\n";
        $this->assertFalse(mb_check_encoding($bytes, 'UTF-8'));

        $this->assertImportedFirstName($this->runImport($bytes), 'Niñofranco');
    }

    public function test_utf8_csv_without_bom_is_stored_correctly(): void
    {
        $bytes = self::HEADER . "Niñofranco,,Dela Cruz,,2024,,BSIT\r\n";

        $this->assertImportedFirstName($this->runImport($bytes), 'Niñofranco');
    }

    public function test_utf8_csv_with_bom_recognises_first_header(): void
    {
        $bytes = "\xEF\xBB\xBF" . self::HEADER . "Niñofranco,,Dela Cruz,,2024,,BSIT\r\n";

        $this->assertImportedFirstName($this->runImport($bytes), 'Niñofranco');
    }

    public function test_plain_ascii_csv_still_imports(): void
    {
        $bytes = self::HEADER . "Juan,Santos,Dela Cruz,Jr.,2024,,BSIT\r\n";

        $batch = $this->runImport($bytes);

        $this->assertImportedFirstName($batch, 'Juan');
        $graduate = Graduate::where('last_name', 'Dela Cruz')->firstOrFail();
        $this->assertSame('Santos', $graduate->middle_name);
        $this->assertSame('Jr.', $graduate->suffix);
    }
}
