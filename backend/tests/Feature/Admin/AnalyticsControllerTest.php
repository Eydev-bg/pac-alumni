<?php

namespace Tests\Feature\Admin;

use App\Enums\EmploymentType;
use App\Models\Department;
use App\Models\Graduate;
use App\Models\User;
use Database\Factories\AlumniProfileFactory;
use Database\Factories\BoardExamRecordFactory;
use Database\Factories\CourseFactory;
use Database\Factories\EmploymentRecordFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * Regression coverage for the admin analytics endpoints.
 *
 * Guards the H-006 fix (constant-query college-by-department aggregation) by
 * asserting the counts stay correct, plus the overall shape of each level's
 * analytics payload.
 */
class AnalyticsControllerTest extends TestCase
{
    use RefreshDatabase;

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

    // ─── Tests ───────────────────────────────────────────────

    public function test_overview_returns_correct_structure(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/analytics/overview')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'elementary' => ['total_graduates'],
                    'jhs' => ['total_graduates'],
                    'shs' => ['total_graduates'],
                    'college' => ['total_graduates'],
                ],
            ]);
    }

    public function test_college_analytics_returns_graduate_counts(): void
    {
        $dept = Department::factory()->create();
        $course = CourseFactory::new()->create(['department_id' => $dept->id]);
        Graduate::factory()->count(3)->forCourse($course)->create();

        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/analytics/college')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total_graduates', 'by_year', 'by_department']])
            ->assertJsonPath('data.total_graduates', 3);

        $deptRow = collect($response->json('data.by_department'))->firstWhere('id', $dept->id);
        $this->assertNotNull($deptRow, 'The seeded department should appear in by_department.');
        $this->assertSame(3, $deptRow['count']);
    }

    public function test_college_analytics_filters_by_year_range(): void
    {
        $course = CourseFactory::new()->create();
        Graduate::factory()->forCourse($course)->create(['graduation_year' => 2020]);
        Graduate::factory()->forCourse($course)->create(['graduation_year' => 2022]);
        Graduate::factory()->forCourse($course)->create(['graduation_year' => 2024]);

        $this->actingAsAdmin();

        $this->getJson('/api/admin/analytics/college?year_from=2021&year_to=2023')
            ->assertOk()
            ->assertJsonPath('data.total_graduates', 1);
    }

    public function test_board_exam_analytics_returns_data(): void
    {
        $dept = Department::factory()->create();
        $course = CourseFactory::new()->boardProgram()->create(['department_id' => $dept->id]);
        $g1 = Graduate::factory()->forCourse($course)->create();
        $g2 = Graduate::factory()->forCourse($course)->create();

        BoardExamRecordFactory::new()->passed()->create(['graduate_id' => $g1->id, 'exam_year' => 2024]);
        BoardExamRecordFactory::new()->notApplicable()->create(['graduate_id' => $g2->id, 'exam_year' => 2024]);

        $this->actingAsAdmin();

        $this->getJson('/api/admin/analytics/college/board-exams')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total_records', 'passed', 'by_department', 'by_year']])
            ->assertJsonPath('data.total_records', 2)
            ->assertJsonPath('data.passed', 1);
    }

    public function test_employment_analytics_returns_data(): void
    {
        $course = CourseFactory::new()->create();
        $graduate = Graduate::factory()->forCourse($course)->create();
        $user = User::factory()->create();
        AlumniProfileFactory::new()->employed()->create([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ]);
        EmploymentRecordFactory::new()->type(EmploymentType::LOCAL)->create(['graduate_id' => $graduate->id]);

        $this->actingAsAdmin();

        $this->getJson('/api/admin/analytics/college/employment')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['total_alumni', 'employed', 'unemployed', 'unknown', 'employment_rate', 'by_type', 'by_industry'],
            ])
            ->assertJsonPath('data.employed', 1);
    }

    public function test_analytics_requires_admin_role(): void
    {
        // Unauthenticated → 401.
        $this->getJson('/api/admin/analytics/overview')->assertUnauthorized();

        // Alumni → 403.
        $this->actingAsAlumni(User::factory()->create());
        $this->getJson('/api/admin/analytics/overview')->assertForbidden();
    }

    public function test_simple_level_analytics(): void
    {
        Graduate::factory()->count(2)->elementary()->create(['graduation_year' => 2023]);

        $this->actingAsAdmin();

        $this->getJson('/api/admin/analytics/elementary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total_graduates', 'by_year']])
            ->assertJsonPath('data.total_graduates', 2);
    }
}
