<?php

namespace Tests\Feature\Admin;

use App\Models\Department;
use App\Models\Graduate;
use App\Models\User;
use Database\Factories\AlumniProfileFactory;
use Database\Factories\BoardExamRecordFactory;
use Database\Factories\CourseFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * Regression coverage for the graduate tracer endpoints.
 *
 * Guards H-004 (tracer summaries/by-course are now cached and computed with a
 * single conditional-aggregation query) by asserting the numbers are correct
 * and the SQLite-compatible query paths behave. The MySQL-only export path
 * (CONCAT_WS) is intentionally not exercised here.
 */
class GraduateTracerControllerTest extends TestCase
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

    private function actingAsAlumni(User $user): void
    {
        $this->authAs($user);
    }

    // ─── Tests ───────────────────────────────────────────────

    public function test_tracer_summary_returns_correct_data(): void
    {
        $course = CourseFactory::new()->boardProgram()->create();
        $year = 2024;

        // 5 graduates in this course + batch year.
        $grads = Graduate::factory()->count(5)->forCourse($course)->create(['graduation_year' => $year]);

        // 3 of them are registered (linked to a user account).
        foreach ($grads->take(3) as $graduate) {
            $graduate->update(['user_id' => User::factory()->create()->id]);
        }

        // 2 of the registered graduates are employed.
        foreach ($grads->take(2) as $graduate) {
            AlumniProfileFactory::new()->employed()->create([
                'user_id' => $graduate->fresh()->user_id,
                'graduate_id' => $graduate->id,
            ]);
        }

        // 1 board passer.
        BoardExamRecordFactory::new()->passed()->create(['graduate_id' => $grads[0]->id]);

        $this->actingAsAdmin();

        $this->getJson("/api/admin/tracer/summary?course_id={$course->id}&batch_year={$year}")
            ->assertOk()
            ->assertJsonPath('data.total_graduates', 5)
            ->assertJsonPath('data.registered', 3)
            ->assertJsonPath('data.employed', 2)
            ->assertJsonPath('data.board_passers', 1);
    }

    public function test_tracer_summary_requires_valid_course(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/tracer/summary?course_id=999999&batch_year=2024')
            ->assertStatus(422)
            ->assertJsonValidationErrors('course_id');
    }

    public function test_tracer_by_course_returns_data(): void
    {
        $c1 = CourseFactory::new()->create();
        $c2 = CourseFactory::new()->create();
        Graduate::factory()->count(2)->forCourse($c1)->create(['graduation_year' => 2024]);
        Graduate::factory()->count(3)->forCourse($c2)->create(['graduation_year' => 2024]);

        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/tracer/by-course')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    ['course_id', 'course_code', 'total_graduates', 'registered', 'employed', 'board_passers'],
                ],
            ]);

        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }

    public function test_tracer_by_course_filters_by_department(): void
    {
        $deptA = Department::factory()->create();
        $deptB = Department::factory()->create();
        $courseA = CourseFactory::new()->create(['department_id' => $deptA->id]);
        $courseB = CourseFactory::new()->create(['department_id' => $deptB->id]);
        Graduate::factory()->count(2)->forCourse($courseA)->create(['graduation_year' => 2024]);
        Graduate::factory()->count(2)->forCourse($courseB)->create(['graduation_year' => 2024]);

        $this->actingAsAdmin();

        $rows = collect(
            $this->getJson("/api/admin/tracer/by-course?department_id={$deptA->id}")
                ->assertOk()
                ->json('data')
        );

        $this->assertGreaterThanOrEqual(1, $rows->count());
        $this->assertTrue(
            $rows->every(fn ($row) => $row['course_id'] === $courseA->id),
            'Only courses from department A should be returned.'
        );
    }

    public function test_tracer_requires_admin_role(): void
    {
        // Unauthenticated → 401.
        $this->getJson('/api/admin/tracer/by-course')->assertUnauthorized();

        // Alumni → 403.
        $this->actingAsAlumni(User::factory()->create());
        $this->getJson('/api/admin/tracer/by-course')->assertForbidden();
    }

    public function test_employment_trend_returns_data(): void
    {
        $this->actingAsAdmin();

        $data = $this->getJson('/api/admin/tracer/employment-trend')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    ['month', 'month_key', 'became_employed', 'became_unemployed'],
                ],
            ])
            ->json('data');

        // Defaults to a full 12-month window, zero-filled.
        $this->assertCount(12, $data);
    }
}
