<?php

namespace Tests\Feature\Admin;

use App\Models\Department;
use App\Models\Graduate;
use App\Models\User;
use Database\Factories\CourseFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class CourseControllerTest extends TestCase
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

    public function test_index_returns_paginated_courses(): void
    {
        CourseFactory::new()->count(3)->create();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/courses')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'name', 'code', 'department', 'is_board_program', 'status', 'graduates_count']],
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 3);
    }

    public function test_all_returns_active_courses(): void
    {
        CourseFactory::new()->count(2)->create();
        CourseFactory::new()->create(['status' => 'inactive']);
        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/courses/all')->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_store_creates_course(): void
    {
        $dept = Department::factory()->create();
        $this->actingAsAdmin();

        $this->postJson('/api/admin/courses', [
            'name' => 'BS Information Technology',
            'code' => 'BSIT',
            'department_id' => $dept->id,
            'is_board_program' => false,
        ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'BSIT');

        $this->assertDatabaseHas('courses', ['code' => 'BSIT', 'department_id' => $dept->id]);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/courses', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'code', 'department_id']);
    }

    public function test_update_modifies_course(): void
    {
        $course = CourseFactory::new()->create();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/courses/{$course->id}", [
            'name' => 'Updated Course Name',
            'code' => $course->code,
            'department_id' => $course->department_id,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Course Name');

        $this->assertDatabaseHas('courses', ['id' => $course->id, 'name' => 'Updated Course Name']);
    }

    public function test_update_returns_404_for_unknown(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/courses/999999', [
            'name' => 'X',
            'code' => 'XYZ',
            'department_id' => Department::factory()->create()->id,
        ])->assertNotFound();
    }

    public function test_destroy_deletes_course_without_graduates(): void
    {
        $course = CourseFactory::new()->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/courses/{$course->id}")->assertOk();
        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_destroy_blocked_when_graduates_exist(): void
    {
        $course = CourseFactory::new()->create();
        Graduate::factory()->forCourse($course)->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/courses/{$course->id}")->assertStatus(422);
        $this->assertDatabaseHas('courses', ['id' => $course->id]);
    }

    public function test_status_toggle(): void
    {
        $course = CourseFactory::new()->create();
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/courses/{$course->id}/status", ['status' => 'inactive'])
            ->assertOk();
        $this->assertDatabaseHas('courses', ['id' => $course->id, 'status' => 'inactive']);
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/courses')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/courses')->assertForbidden();
    }
}
