<?php

namespace Tests\Feature\Admin;

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
 * Report exports stream via maatwebsite/excel. We exercise the CSV writer
 * (no PDF/DOMPDF dependency) and assert the endpoints authorize correctly and
 * produce a successful download. The underlying export queries use standard
 * Eloquent (no MySQL-only SQL), so they run under SQLite.
 */
class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    private function authAs(User $user): void
    {
        $this->withHeader('Authorization', 'Bearer ' . JWTAuth::fromUser($user));
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->authAs($admin);

        return $admin;
    }

    /**
     * Seed one fully-populated alumni so every export has at least one row.
     */
    private function seedAlumni(): void
    {
        $course = CourseFactory::new()->boardProgram()->create();
        $user = User::factory()->create();
        $graduate = Graduate::factory()->forCourse($course)->create([
            'user_id' => $user->id,
            'alumni_id_number' => 'PAC-2024-0001',
        ]);
        AlumniProfileFactory::new()->employed()->create([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ]);
        BoardExamRecordFactory::new()->passed()->create(['graduate_id' => $graduate->id]);
        EmploymentRecordFactory::new()->create(['graduate_id' => $graduate->id]);
    }

    public function test_board_passing_export_downloads(): void
    {
        $this->seedAlumni();
        $this->actingAsAdmin();

        $this->get('/api/admin/reports/board-passing/export?format=csv')
            ->assertOk();
    }

    public function test_employment_export_downloads(): void
    {
        $this->seedAlumni();
        $this->actingAsAdmin();

        $this->get('/api/admin/reports/employment/export?format=csv')
            ->assertOk();
    }

    public function test_alumni_id_list_export_downloads(): void
    {
        $this->seedAlumni();
        $this->actingAsAdmin();

        $this->get('/api/admin/reports/alumni-id-list/export?format=csv')
            ->assertOk();
    }

    public function test_export_validates_format(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/reports/board-passing/export')
            ->assertStatus(422)
            ->assertJsonValidationErrors('format');
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/reports/board-passing/export?format=csv')
            ->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/reports/board-passing/export?format=csv')
            ->assertForbidden();
    }
}
