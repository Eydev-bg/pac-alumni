<?php

namespace Tests\Feature\Alumni;

use App\Enums\JobEmploymentType;
use App\Enums\JobSource;
use App\Enums\JobStatus;
use App\Models\Graduate;
use App\Models\JobPosting;
use App\Models\User;
use App\Services\StorageService;
use Database\Factories\AlumniProfileFactory;
use Database\Factories\JobPostingFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * Alumni-authored job postings: alumni are verified against the master
 * graduate list at registration, so their posts go live immediately —
 * but they may only manage their own, and only 3 active at a time.
 */
class AlumniJobPostingTest extends TestCase
{
    use RefreshDatabase;

    private function authAs(User $user): void
    {
        $this->withHeader('Authorization', 'Bearer ' . JWTAuth::fromUser($user));
    }

    /** Alumni user with a linked Graduate + AlumniProfile (for attribution). */
    private function makeAlumni(): User
    {
        $user = User::factory()->create();
        $graduate = Graduate::factory()->create(['user_id' => $user->id]);
        AlumniProfileFactory::new()->create([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ]);

        return $user;
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'company_name' => 'Acme Corp',
            'job_position' => 'Software Engineer',
            'location' => 'Cebu City',
            'employment_type' => JobEmploymentType::FULL_TIME->value,
            'description' => 'Build and maintain internal systems.',
            'application_link' => 'https://acme.test/apply',
        ], $overrides);
    }

    public function test_alumni_can_create_a_job_posting_that_goes_live_immediately(): void
    {
        $alumni = $this->makeAlumni();
        $this->authAs($alumni);

        $this->postJson('/api/alumni/careers/my-posts', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.company_name', 'Acme Corp')
            ->assertJsonPath('data.source', 'alumni');

        $this->assertDatabaseHas('job_postings', [
            'company_name' => 'Acme Corp',
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
            'posted_by' => $alumni->id,
            'status' => JobStatus::ACTIVE->value,
            'is_pinned' => false,
        ]);

        $this->assertNotNull(JobPosting::firstWhere('company_name', 'Acme Corp')->published_at);
    }

    public function test_alumni_cannot_set_status_or_pin_their_post(): void
    {
        $alumni = $this->makeAlumni();
        $this->authAs($alumni);

        $this->postJson('/api/alumni/careers/my-posts', $this->validPayload([
            'status' => JobStatus::DRAFT->value,
            'is_pinned' => true,
        ]))->assertCreated();

        $this->assertDatabaseHas('job_postings', [
            'company_name' => 'Acme Corp',
            'status' => JobStatus::ACTIVE->value,
            'is_pinned' => false,
        ]);
    }

    public function test_store_requires_application_link_or_company_email(): void
    {
        $this->authAs($this->makeAlumni());

        $this->postJson('/api/alumni/careers/my-posts', $this->validPayload(['application_link' => null]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['application_link', 'company_email']);
    }

    public function test_alumni_are_capped_at_three_active_posts(): void
    {
        $alumni = $this->makeAlumni();
        $this->authAs($alumni);

        JobPostingFactory::new()->active()->count(3)->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
        ]);

        $this->postJson('/api/alumni/careers/my-posts', $this->validPayload())
            ->assertStatus(422)
            ->assertJsonPath('message', 'You can have at most 3 active job postings at a time.');
    }

    /**
     * SECURITY: the `mimes:` rule validates the file's sniffed content, and
     * Laravel separately hard-blocks .php/.phar client extensions — but NOT
     * .html or .svg. So a real JPEG uploaded as "logo.html" passes validation,
     * and storing it under the client-supplied extension would put a file
     * served as text/html in a public upload directory (a JPEG can carry
     * markup in its comment segment — a classic polyglot XSS).
     *
     * The stored extension must therefore come from the sniffed type.
     */
    public function test_logo_extension_comes_from_content_not_filename(): void
    {
        Storage::fake(StorageService::diskName());
        $alumni = $this->makeAlumni();
        $this->authAs($alumni);

        // Multipart, not postJson() — a JSON body cannot carry a real upload.
        // A genuine UploadedFile is required too: UploadedFile::fake() derives
        // its MIME type from the *filename*, so it cannot express a polyglot.
        $this->post(
            '/api/alumni/careers/my-posts',
            $this->validPayload([
                'company_logo' => $this->realJpegNamed('logo.html'),
            ]),
            ['Accept' => 'application/json'],
        )->assertCreated();

        $storedPath = JobPosting::firstWhere('company_name', 'Acme Corp')
            ->getRawOriginal('company_logo');

        $this->assertNotNull($storedPath, 'The logo was not stored at all.');
        $this->assertStringEndsNotWith(
            '.html',
            $storedPath,
            'The logo kept its client-supplied extension — a JPEG is being served as text/html.',
        );
        $this->assertContains(
            pathinfo($storedPath, PATHINFO_EXTENSION),
            ['jpg', 'jpeg'],
            'The stored extension should come from the sniffed image type.',
        );
        Storage::disk(StorageService::diskName())->assertExists($storedPath);
    }

    /**
     * A real on-disk JPEG carrying an arbitrary filename — the shape of an
     * upload that passes content-based validation but whose name lies.
     */
    private function realJpegNamed(string $filename): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'polyglot');

        $image = imagecreatetruecolor(40, 40);
        imagejpeg($image, $path);
        imagedestroy($image);

        // $test = true so Symfony skips the is_uploaded_file() check.
        return new UploadedFile($path, $filename, 'image/jpeg', null, true);
    }

    public function test_my_posts_returns_only_the_authenticated_alumnis_posts(): void
    {
        $alumni = $this->makeAlumni();
        $other = $this->makeAlumni();

        JobPostingFactory::new()->active()->count(2)->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
        ]);
        JobPostingFactory::new()->active()->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $other->id,
        ]);
        JobPostingFactory::new()->active()->create(); // admin-posted

        $this->authAs($alumni);

        $this->getJson('/api/alumni/careers/my-posts')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_alumni_cannot_update_or_delete_someone_elses_post(): void
    {
        $alumni = $this->makeAlumni();
        $other = $this->makeAlumni();

        $job = JobPostingFactory::new()->active()->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $other->id,
        ]);

        $this->authAs($alumni);

        $this->putJson("/api/alumni/careers/my-posts/{$job->id}", ['job_position' => 'Hijacked'])
            ->assertStatus(403);

        $this->deleteJson("/api/alumni/careers/my-posts/{$job->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('job_postings', ['id' => $job->id, 'deleted_at' => null]);
    }

    public function test_alumni_cannot_manage_admin_posted_jobs(): void
    {
        $alumni = $this->makeAlumni();
        $job = JobPostingFactory::new()->active()->create(); // source defaults to admin

        $this->authAs($alumni);

        $this->putJson("/api/alumni/careers/my-posts/{$job->id}", ['job_position' => 'Hijacked'])
            ->assertStatus(403);
    }

    public function test_alumni_can_update_and_delete_their_own_post(): void
    {
        $alumni = $this->makeAlumni();
        $job = JobPostingFactory::new()->active()->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
        ]);

        $this->authAs($alumni);

        $this->putJson("/api/alumni/careers/my-posts/{$job->id}", [
            'job_position' => 'Senior Engineer',
        ])
            ->assertOk()
            ->assertJsonPath('data.job_position', 'Senior Engineer');

        $this->deleteJson("/api/alumni/careers/my-posts/{$job->id}")->assertOk();

        $this->assertSoftDeleted('job_postings', ['id' => $job->id]);
    }

    public function test_career_center_auto_expires_alumni_posts_older_than_60_days(): void
    {
        $alumni = $this->makeAlumni();

        // Alumni post, no deadline, published 61 days ago — hidden.
        JobPostingFactory::new()->active()->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
            'application_deadline' => null,
            'published_at' => now()->subDays(61),
        ]);

        // Same but 59 days ago — still visible.
        JobPostingFactory::new()->active()->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
            'application_deadline' => null,
            'published_at' => now()->subDays(59),
        ]);

        // Admin post with no deadline, published long ago — never auto-expires.
        JobPostingFactory::new()->active()->create([
            'application_deadline' => null,
            'published_at' => now()->subDays(400),
        ]);

        $this->authAs($alumni);

        $this->getJson('/api/alumni/job-postings')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_career_center_exposes_poster_attribution(): void
    {
        $alumni = $this->makeAlumni();
        $job = JobPostingFactory::new()->active()->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
        ]);

        $this->authAs($alumni);

        $this->getJson("/api/alumni/job-postings/{$job->id}")
            ->assertOk()
            ->assertJsonPath('data.source', 'alumni')
            ->assertJsonPath(
                'data.posted_by_alumni_name',
                trim($alumni->first_name . ' ' . $alumni->last_name),
            )
            ->assertJsonPath('data.is_mine', true);
    }

    public function test_admin_posted_jobs_carry_no_attribution(): void
    {
        $job = JobPostingFactory::new()->active()->create();

        $this->authAs($this->makeAlumni());

        $this->getJson("/api/alumni/job-postings/{$job->id}")
            ->assertOk()
            ->assertJsonPath('data.source', 'admin')
            ->assertJsonPath('data.posted_by_alumni_name', null)
            ->assertJsonPath('data.is_mine', false);
    }
}
