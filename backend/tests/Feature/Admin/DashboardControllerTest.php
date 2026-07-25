<?php

namespace Tests\Feature\Admin;

use App\Enums\EmploymentStatus;
use App\Enums\EmploymentType;
use App\Models\AlumniProfile;
use App\Models\Graduate;
use App\Models\User;
use App\Services\Admin\DashboardCacheService;
use Database\Factories\AlumniProfileFactory;
use Database\Factories\BoardExamRecordFactory;
use Database\Factories\CourseFactory;
use Database\Factories\EmploymentRecordFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * Regression coverage for the admin dashboard aggregation endpoint.
 *
 * Guards two production-readiness fixes:
 *   C-001 — the dashboard is served from a short-TTL cache that must be
 *           invalidated by alumni/admin writes (behaviour proven here).
 *   C-002 — soft-deleted graduates must be excluded from every count, so the
 *           numerators (board passers, employment) stay consistent with the
 *           Graduate::count() denominators.
 */
class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Start every test from a cold dashboard cache.
        Cache::flush();
    }

    // ─── Auth helpers ────────────────────────────────────────
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

    private function actingAsAlumni(User $user): void
    {
        $this->authAs($user);
    }

    /**
     * Build a User + Graduate + AlumniProfile trio, linked together.
     */
    private function createAlumniProfile(array $profileAttrs = [], array $gradAttrs = []): AlumniProfile
    {
        $user = User::factory()->create();
        $graduate = Graduate::factory()->create(array_merge(['user_id' => $user->id], $gradAttrs));

        return AlumniProfileFactory::new()->create(array_merge([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ], $profileAttrs));
    }

    // ─── Tests ───────────────────────────────────────────────

    public function test_dashboard_returns_correct_structure(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'stats' => [
                        'total_graduates',
                        'registered_alumni',
                        'board_passers',
                        'board_not_yet_taken',
                        'board_program_total',
                        'board_passing_rate',
                        'employment_rate',
                        'employed_count',
                        'employment_total_profiles',
                    ],
                    'graduates_per_year',
                    'employment_type_breakdown',
                ],
            ]);
    }

    public function test_dashboard_requires_admin_role(): void
    {
        // Unauthenticated → 401 (assert before setting any auth header).
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();

        // Authenticated as a non-admin (alumni) → 403.
        $this->actingAsAlumni(User::factory()->create());
        $this->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_dashboard_stats_count_graduates_correctly(): void
    {
        Graduate::factory()->count(3)->create();               // college (default)
        Graduate::factory()->count(2)->elementary()->create(); // elementary

        $this->actingAsAdmin();

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.total_graduates', 5)
            ->assertJsonPath('data.stats.total_college_graduates', 3);
    }

    /** C-002 regression guard. */
    public function test_soft_deleted_graduates_excluded_from_total(): void
    {
        $graduates = Graduate::factory()->count(3)->create();
        $graduates->first()->delete(); // soft delete

        $this->actingAsAdmin();

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.total_graduates', 2);
    }

    /** C-002 regression guard — exercises excludeTrashedGraduates() for board passers. */
    public function test_board_passers_exclude_soft_deleted_graduates(): void
    {
        $course = CourseFactory::new()->boardProgram()->create();
        $g1 = Graduate::factory()->forCourse($course)->create();
        $g2 = Graduate::factory()->forCourse($course)->create();

        BoardExamRecordFactory::new()->passed()->create(['graduate_id' => $g1->id]);
        BoardExamRecordFactory::new()->passed()->create(['graduate_id' => $g2->id]);

        $g1->delete(); // soft delete — its passed record must drop out of the count

        $this->actingAsAdmin();

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.board_passers', 1);
    }

    /** C-002 regression guard — employment numerators skip trashed graduates. */
    public function test_employment_counts_exclude_soft_deleted_graduates(): void
    {
        $p1 = $this->createAlumniProfile(['employment_status' => EmploymentStatus::EMPLOYED]);
        $this->createAlumniProfile(['employment_status' => EmploymentStatus::EMPLOYED]);

        $p1->graduate->delete(); // soft delete one employed graduate

        $this->actingAsAdmin();

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.employed_count', 1)
            ->assertJsonPath('data.stats.employment_total_profiles', 1);
    }

    public function test_employment_type_breakdown_excludes_soft_deleted(): void
    {
        $g1 = Graduate::factory()->create();
        $g2 = Graduate::factory()->create();

        EmploymentRecordFactory::new()->type(EmploymentType::LOCAL)->create(['graduate_id' => $g1->id]);
        EmploymentRecordFactory::new()->type(EmploymentType::INTERNATIONAL)->create(['graduate_id' => $g2->id]);

        $g1->delete(); // soft delete — the LOCAL record must be excluded

        $this->actingAsAdmin();

        $breakdown = collect(
            $this->getJson('/api/admin/dashboard')->assertOk()->json('data.employment_type_breakdown')
        );

        $this->assertSame(1, $breakdown->sum('count'));
        $this->assertSame(0, $breakdown->firstWhere('type', EmploymentType::LOCAL->label())['count']);
        $this->assertSame(1, $breakdown->firstWhere('type', EmploymentType::INTERNATIONAL->label())['count']);
    }

    /** C-001 behaviour test — the payload is cached until explicitly flushed. */
    public function test_dashboard_response_is_cached(): void
    {
        $this->actingAsAdmin();
        Graduate::factory()->count(2)->create();

        $first = $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->json('data.stats.total_graduates');
        $this->assertSame(2, $first);

        // Insert a graduate directly via the factory (no service → no cache flush).
        Graduate::factory()->create();

        $second = $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->json('data.stats.total_graduates');
        $this->assertSame(2, $second, 'Cached response should not reflect the new graduate.');

        // Explicit flush → the next read recomputes and sees all 3.
        app(DashboardCacheService::class)->flush();

        $third = $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->json('data.stats.total_graduates');
        $this->assertSame(3, $third);
    }

    public function test_board_not_yet_taken_calculation(): void
    {
        $course = CourseFactory::new()->boardProgram()->create();
        $grads = Graduate::factory()->count(3)->forCourse($course)->create();

        BoardExamRecordFactory::new()->passed()->create(['graduate_id' => $grads[0]->id]);

        $this->actingAsAdmin();

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.board_program_total', 3)
            ->assertJsonPath('data.stats.board_passers', 1)
            ->assertJsonPath('data.stats.board_not_yet_taken', 2);
    }
}
