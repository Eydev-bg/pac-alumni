<?php

namespace Tests\Feature;

use App\Enums\EducationLevel;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\AlumniProfile;
use App\Models\Course;
use App\Models\Department;
use App\Models\Graduate;
use App\Models\User;
use App\Services\ContentAudienceResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class ContentAudienceResolverTest extends TestCase
{
    use RefreshDatabase;

    private ContentAudienceResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = new ContentAudienceResolver();
    }

    // ─── Helpers ─────────────────────────────────────────────

    /**
     * Create an active alumni user; pass $graduate attributes to also attach
     * an AlumniProfile → Graduate chain (null = no profile at all).
     */
    private function makeAlumni(?array $graduate = null, array $userAttrs = []): User
    {
        $user = User::factory()->create($userAttrs);

        if ($graduate !== null) {
            $record = Graduate::create($graduate + [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'education_level' => EducationLevel::COLLEGE,
                'graduation_year' => 2024,
                'user_id' => $user->id,
            ]);

            AlumniProfile::create([
                'user_id' => $user->id,
                'graduate_id' => $record->id,
            ]);
        }

        return $user;
    }

    private function makeDepartment(string $code): Department
    {
        return Department::create(['name' => "Department {$code}", 'code' => $code]);
    }

    private function makeCourse(Department $department, string $code): Course
    {
        return Course::create([
            'name' => "Course {$code}",
            'code' => $code,
            'department_id' => $department->id,
        ]);
    }

    private function assertAudienceIs(array $expectedUsers, $query): void
    {
        $this->assertEqualsCanonicalizing(
            collect($expectedUsers)->pluck('id')->all(),
            $query->pluck('id')->all()
        );
    }

    // ─── target_type: all ────────────────────────────────────

    public function test_all_returns_every_active_alumni_and_excludes_admins_and_blank_emails(): void
    {
        $withProfile = $this->makeAlumni([]);
        $withoutProfile = $this->makeAlumni(); // no graduate record — still sees 'all' content in-app
        User::factory()->admin()->create();
        $this->makeAlumni([], ['email' => '']); // unusable email address

        $this->assertAudienceIs(
            [$withProfile, $withoutProfile],
            $this->resolver->query('all', null)
        );
    }

    public function test_inactive_and_suspended_users_are_excluded(): void
    {
        $active = $this->makeAlumni([]);
        $this->makeAlumni([], ['status' => UserStatus::SUSPENDED]);
        $this->makeAlumni([], ['status' => UserStatus::DEACTIVATED]);

        $this->assertAudienceIs([$active], $this->resolver->query('all', null));
    }

    // ─── target_type: education_level ────────────────────────

    public function test_education_level_matches_graduate_education_level(): void
    {
        $college = $this->makeAlumni(['education_level' => EducationLevel::COLLEGE]);
        $this->makeAlumni(['education_level' => EducationLevel::JHS]);
        $this->makeAlumni(); // no graduate record — never matches targeted content

        $this->assertAudienceIs(
            [$college],
            $this->resolver->query('education_level', 'college')
        );
    }

    // ─── target_type: department ─────────────────────────────

    public function test_department_matches_course_department_or_direct_department(): void
    {
        $target = $this->makeDepartment('TGT');
        $other = $this->makeDepartment('OTH');
        $targetCourse = $this->makeCourse($target, 'C-TGT');
        $otherCourse = $this->makeCourse($other, 'C-OTH');

        // College graduate: department comes via the course.
        $viaCourse = $this->makeAlumni(['course_id' => $targetCourse->id]);
        // Basic-ed graduate: no course, direct department_id.
        $viaDirect = $this->makeAlumni([
            'education_level' => EducationLevel::SHS,
            'department_id' => $target->id,
        ]);
        // Course in another department wins over a stale direct department_id
        // (mirrors AlumniEventService::contextFor — in-app they see OTH, not TGT).
        $this->makeAlumni([
            'course_id' => $otherCourse->id,
            'department_id' => $target->id,
        ]);
        $this->makeAlumni(['course_id' => $otherCourse->id]);

        $this->assertAudienceIs(
            [$viaCourse, $viaDirect],
            $this->resolver->query('department', (string) $target->id)
        );
    }

    // ─── target_type: course ─────────────────────────────────

    public function test_course_matches_graduate_course_id(): void
    {
        $department = $this->makeDepartment('DPT');
        $course = $this->makeCourse($department, 'BSIT');
        $otherCourse = $this->makeCourse($department, 'BSCS');

        $match = $this->makeAlumni(['course_id' => $course->id]);
        $this->makeAlumni(['course_id' => $otherCourse->id]);

        $this->assertAudienceIs(
            [$match],
            $this->resolver->query('course', (string) $course->id)
        );
    }

    // ─── target_type: batch ──────────────────────────────────

    public function test_batch_matches_graduation_year(): void
    {
        $match = $this->makeAlumni(['graduation_year' => 2024]);
        $this->makeAlumni(['graduation_year' => 2020]);

        $this->assertAudienceIs(
            [$match],
            $this->resolver->query('batch', '2024')
        );
    }

    // ─── Job postings ────────────────────────────────────────

    public function test_job_posting_query_returns_same_audience_as_all(): void
    {
        $this->makeAlumni([]);
        $this->makeAlumni();
        User::factory()->admin()->create();
        $this->makeAlumni([], ['status' => UserStatus::SUSPENDED]);

        $this->assertEqualsCanonicalizing(
            $this->resolver->query('all', null)->pluck('id')->all(),
            $this->resolver->jobPostingQuery()->pluck('id')->all()
        );
        $this->assertCount(2, $this->resolver->jobPostingQuery()->get());
    }

    // ─── Failure modes ───────────────────────────────────────

    public function test_unknown_target_type_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->resolver->query('everyone', null);
    }

    public function test_missing_target_value_for_targeted_type_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->resolver->query('department', null);
    }
}
