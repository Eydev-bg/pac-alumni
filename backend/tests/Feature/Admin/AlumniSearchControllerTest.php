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

class AlumniSearchControllerTest extends TestCase
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

    public function test_search_returns_paginated_results(): void
    {
        $course = CourseFactory::new()->create();
        Graduate::factory()->count(2)->forCourse($course)->create();

        $this->actingAsAdmin();

        $this->getJson('/api/admin/alumni/search')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'full_name', 'education_level', 'graduation_year']],
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_profile_returns_alumni_detail(): void
    {
        $course = CourseFactory::new()->boardProgram()->create();
        $user = User::factory()->create();
        $graduate = Graduate::factory()->forCourse($course)->create(['user_id' => $user->id]);
        AlumniProfileFactory::new()->employed()->create([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ]);
        BoardExamRecordFactory::new()->passed()->create(['graduate_id' => $graduate->id]);
        EmploymentRecordFactory::new()->create(['graduate_id' => $graduate->id]);

        $this->actingAsAdmin();

        $this->getJson("/api/admin/alumni/{$graduate->id}/profile")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'graduate' => ['id', 'full_name'],
                    'alumni_profile' => ['current_location', 'employment_status', 'board_status'],
                    'board_exam_records' => [['id', 'exam_name', 'exam_year', 'status']],
                    'employment_records' => [['id', 'company_name', 'job_title', 'is_current']],
                ],
            ])
            ->assertJsonPath('data.graduate.id', $graduate->id);
    }

    public function test_profile_returns_404_for_unknown_graduate(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/alumni/999999/profile')->assertNotFound();
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/alumni/search')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/alumni/search')->assertForbidden();
    }
}
