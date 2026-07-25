<?php

namespace Tests\Feature\Admin;

use App\Models\Department;
use App\Models\Graduate;
use App\Models\User;
use Database\Factories\CourseFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class DepartmentControllerTest extends TestCase
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

    public function test_index_returns_paginated_departments(): void
    {
        Department::factory()->count(3)->create();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/departments')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'name', 'code', 'education_level', 'status']],
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 3);
    }

    public function test_all_returns_active_departments(): void
    {
        Department::factory()->count(2)->create();
        Department::factory()->inactive()->create();
        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/departments/all')->assertOk();
        // Only the 2 active departments are returned (no pagination).
        $this->assertCount(2, $response->json('data'));
    }

    public function test_store_creates_department(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/departments', [
            'name' => 'Computer Studies',
            'code' => 'CS',
            'education_level' => 'college',
            'is_board_program' => false,
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Computer Studies')
            ->assertJsonPath('data.code', 'CS');

        $this->assertDatabaseHas('departments', ['name' => 'Computer Studies', 'code' => 'CS']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/departments', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'code', 'education_level']);
    }

    public function test_show_returns_department(): void
    {
        $dept = Department::factory()->create();
        $this->actingAsAdmin();

        $this->getJson("/api/admin/departments/{$dept->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $dept->id);
    }

    public function test_show_returns_404_for_unknown(): void
    {
        $this->actingAsAdmin();
        $this->getJson('/api/admin/departments/999999')->assertNotFound();
    }

    public function test_update_modifies_department(): void
    {
        $dept = Department::factory()->create();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/departments/{$dept->id}", [
            'name' => 'Renamed Department',
            'code' => $dept->code,
            'education_level' => 'college',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed Department');

        $this->assertDatabaseHas('departments', ['id' => $dept->id, 'name' => 'Renamed Department']);
    }

    public function test_destroy_deletes_department_without_graduates(): void
    {
        $dept = Department::factory()->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/departments/{$dept->id}")->assertOk();
        $this->assertDatabaseMissing('departments', ['id' => $dept->id]);
    }

    public function test_destroy_blocked_when_graduates_exist(): void
    {
        $dept = Department::factory()->create();
        $course = CourseFactory::new()->create(['department_id' => $dept->id]);
        Graduate::factory()->forCourse($course)->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/departments/{$dept->id}")->assertStatus(422);
        $this->assertDatabaseHas('departments', ['id' => $dept->id]);
    }

    public function test_status_toggle(): void
    {
        $dept = Department::factory()->create();
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/departments/{$dept->id}/status", ['status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');
    }

    public function test_stats_returns_counts(): void
    {
        $dept = Department::factory()->create();
        $course = CourseFactory::new()->create(['department_id' => $dept->id]);
        Graduate::factory()->count(2)->forCourse($course)->create();
        $this->actingAsAdmin();

        $this->getJson("/api/admin/departments/{$dept->id}/stats")
            ->assertOk()
            ->assertJsonStructure(['data' => ['total_graduates', 'is_board_program', 'board_exam_name']])
            ->assertJsonPath('data.total_graduates', 2);
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/departments')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/departments')->assertForbidden();
    }
}
