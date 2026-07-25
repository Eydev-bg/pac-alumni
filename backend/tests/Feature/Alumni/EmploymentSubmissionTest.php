<?php

namespace Tests\Feature\Alumni;

use App\Models\EmploymentRecord;
use App\Models\Graduate;
use App\Models\User;
use Database\Factories\AlumniProfileFactory;
use Database\Factories\EmploymentRecordFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * Regression coverage for the alumni employment write path.
 *
 * Guards C-001: an employment submission must invalidate the admin dashboard
 * cache so the aggregate employment metrics surface immediately.
 */
class EmploymentSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function authAs(User $user): void
    {
        $token = JWTAuth::fromUser($user);
        $this->withHeader('Authorization', "Bearer {$token}");
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->authAs($admin);

        return $admin;
    }

    /**
     * Create an alumni user with a linked Graduate + AlumniProfile and
     * authenticate as them. Returns [user, graduate, profile].
     */
    private function makeAlumni(): array
    {
        $user = User::factory()->create();
        $graduate = Graduate::factory()->create(['user_id' => $user->id]);
        $profile = AlumniProfileFactory::new()->create([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ]);

        $this->authAs($user);

        return [$user, $graduate, $profile];
    }

    private function employedPayload(array $overrides = []): array
    {
        return array_merge([
            'employment_status' => 'employed',
            'company_name' => 'Acme Corp',
            'job_title' => 'Software Engineer',
            'industry' => 'Information Technology',
            'employment_type' => 'local',
        ], $overrides);
    }

    // ─── Tests ───────────────────────────────────────────────

    public function test_alumni_can_submit_employed_status(): void
    {
        [, $graduate, $profile] = $this->makeAlumni();

        $this->postJson('/api/alumni/employment', $this->employedPayload())
            ->assertCreated()
            ->assertJsonPath('data.employment_status', 'employed')
            ->assertJsonPath('data.record.company_name', 'Acme Corp')
            ->assertJsonPath('data.record.job_title', 'Software Engineer');

        $this->assertDatabaseHas('alumni_profiles', [
            'id' => $profile->id,
            'employment_status' => 'employed',
        ]);
        $this->assertDatabaseHas('employment_records', [
            'graduate_id' => $graduate->id,
            'company_name' => 'Acme Corp',
            'is_current' => 1,
        ]);
    }

    public function test_alumni_can_submit_unemployed_status(): void
    {
        [, $graduate, $profile] = $this->makeAlumni();
        $old = EmploymentRecordFactory::new()->create([
            'graduate_id' => $graduate->id,
            'is_current' => true,
        ]);

        $this->postJson('/api/alumni/employment', ['employment_status' => 'unemployed'])
            ->assertCreated()
            ->assertJsonPath('data.employment_status', 'unemployed');

        $this->assertDatabaseHas('alumni_profiles', [
            'id' => $profile->id,
            'employment_status' => 'unemployed',
        ]);
        $this->assertDatabaseHas('employment_records', [
            'id' => $old->id,
            'is_current' => 0,
        ]);
    }

    /** C-001 regression guard. */
    public function test_employment_submission_flushes_dashboard_cache(): void
    {
        $admin = User::factory()->admin()->create();
        $alumni = User::factory()->create();
        $graduate = Graduate::factory()->create(['user_id' => $alumni->id]);
        AlumniProfileFactory::new()->create([
            'user_id' => $alumni->id,
            'graduate_id' => $graduate->id,
        ]);

        // Pre-warm the dashboard cache — no employed alumni yet.
        $this->authAs($admin);
        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.employed_count', 0);

        // Alumni submits employment.
        $this->authAs($alumni);
        $this->postJson('/api/alumni/employment', $this->employedPayload())
            ->assertCreated();

        // Dashboard reflects the new submission → cache was invalidated.
        $this->authAs($admin);
        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.employed_count', 1);
    }

    public function test_employment_submission_requires_alumni_role(): void
    {
        // Unauthenticated → 401 (assert before any auth header).
        $this->postJson('/api/alumni/employment', $this->employedPayload())
            ->assertUnauthorized();

        // Admin lacks the alumni role → 403.
        $this->actingAsAdmin();
        $this->postJson('/api/alumni/employment', $this->employedPayload())
            ->assertForbidden();
    }

    public function test_employment_submission_validates_required_fields(): void
    {
        $this->makeAlumni();

        $this->postJson('/api/alumni/employment', ['employment_status' => 'employed'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['company_name', 'job_title', 'industry', 'employment_type']);
    }

    public function test_previous_employment_record_marked_not_current(): void
    {
        [, $graduate] = $this->makeAlumni();
        $old = EmploymentRecordFactory::new()->create([
            'graduate_id' => $graduate->id,
            'is_current' => true,
            'end_date' => null,
        ]);

        $newId = $this->postJson('/api/alumni/employment', $this->employedPayload())
            ->assertCreated()
            ->json('data.record.id');

        $this->assertDatabaseHas('employment_records', ['id' => $old->id, 'is_current' => 0]);
        $this->assertNotNull(EmploymentRecord::find($old->id)->end_date);
        $this->assertDatabaseHas('employment_records', ['id' => $newId, 'is_current' => 1]);
    }

    public function test_employment_get_returns_data(): void
    {
        $this->makeAlumni();

        $this->getJson('/api/alumni/employment')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'current_status' => ['employment_status', 'employment_label'],
                    'current_job',
                    'records',
                    'industries',
                ],
            ]);
    }
}
