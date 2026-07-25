<?php

namespace Tests\Feature\Alumni;

use App\Models\BoardExamRecord;
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
 * Regression coverage for the alumni board-exam write path.
 *
 * Guards C-001: a board-exam submission must invalidate the admin dashboard
 * cache so board_passers / board_passing_rate surface immediately. Also
 * covers the append-and-supersede history semantics (only the latest record
 * stays current).
 */
class BoardExamSubmissionTest extends TestCase
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
     * Create an alumni whose course IS a board program (required to submit),
     * with a linked Graduate + AlumniProfile, and authenticate as them.
     * Returns [user, graduate, profile, course].
     */
    private function makeBoardAlumni(): array
    {
        $course = CourseFactory::new()->boardProgram()->create();
        $user = User::factory()->create();
        $graduate = Graduate::factory()->forCourse($course)->create(['user_id' => $user->id]);
        $profile = AlumniProfileFactory::new()->create([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ]);

        $this->authAs($user);

        return [$user, $graduate, $profile, $course];
    }

    // ─── Tests ───────────────────────────────────────────────

    public function test_alumni_can_submit_board_exam_passed(): void
    {
        [, $graduate, $profile] = $this->makeBoardAlumni();
        $old = BoardExamRecordFactory::new()->create([
            'graduate_id' => $graduate->id,
            'is_current' => true,
            'exam_year' => 2020,
        ]);

        $this->postJson('/api/alumni/board-exam', ['status' => 'passed', 'exam_year' => 2025])
            ->assertCreated();

        $this->assertDatabaseHas('board_exam_records', [
            'graduate_id' => $graduate->id,
            'exam_year' => 2025,
            'is_current' => 1,
        ]);
        $this->assertDatabaseHas('alumni_profiles', [
            'id' => $profile->id,
            'board_status' => 'passed',
        ]);
        // The previously current record is demoted.
        $this->assertDatabaseHas('board_exam_records', ['id' => $old->id, 'is_current' => 0]);
    }

    /** C-001 regression guard. */
    public function test_board_exam_submission_flushes_dashboard_cache(): void
    {
        $admin = User::factory()->admin()->create();
        [$user] = $this->makeBoardAlumni();

        // Pre-warm — no board passers yet.
        $this->authAs($admin);
        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.board_passers', 0);

        // Alumni submits a passing board exam.
        $this->authAs($user);
        $this->postJson('/api/alumni/board-exam', ['status' => 'passed', 'exam_year' => 2025])
            ->assertCreated();

        // Dashboard reflects it → cache was invalidated.
        $this->authAs($admin);
        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.board_passers', 1);
    }

    public function test_board_exam_requires_alumni_role(): void
    {
        $payload = ['status' => 'passed', 'exam_year' => 2025];

        // Unauthenticated → 401.
        $this->postJson('/api/alumni/board-exam', $payload)->assertUnauthorized();

        // Admin lacks the alumni role → 403.
        $this->actingAsAdmin();
        $this->postJson('/api/alumni/board-exam', $payload)->assertForbidden();
    }

    public function test_board_exam_validates_status_must_be_passed(): void
    {
        $this->makeBoardAlumni();

        $this->postJson('/api/alumni/board-exam', ['status' => 'failed', 'exam_year' => 2025])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_board_exam_get_returns_data(): void
    {
        $this->makeBoardAlumni();

        // NB: the service exposes the course under the `course` key (the audit
        // brief's "course_info" is descriptive, not the literal payload key).
        $this->getJson('/api/alumni/board-exam')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'course' => ['name', 'code', 'board_exam_name'],
                    'current_status' => ['board_status', 'board_label'],
                    'records',
                    'can_submit',
                ],
            ]);
    }

    public function test_board_exam_append_and_supersede(): void
    {
        [, $graduate] = $this->makeBoardAlumni();

        $this->postJson('/api/alumni/board-exam', ['status' => 'passed', 'exam_year' => 2024])
            ->assertCreated();
        $this->postJson('/api/alumni/board-exam', ['status' => 'passed', 'exam_year' => 2025])
            ->assertCreated();

        $records = BoardExamRecord::where('graduate_id', $graduate->id)->get();

        $this->assertCount(2, $records);
        $this->assertSame(1, $records->where('is_current', true)->count());
        $this->assertSame(2025, (int) $records->firstWhere('is_current', true)->exam_year);
    }
}
