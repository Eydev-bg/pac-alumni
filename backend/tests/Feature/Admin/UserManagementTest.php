<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * Phase 6 QA — Admin User Management.
 *
 * Covers authorization boundaries and the self-protection invariants enforced
 * in UserService (an admin may not suspend themselves, may not suspend another
 * admin, and may not create/promote admins through the user endpoint).
 *
 * Run with: php artisan test --filter=UserManagementTest
 */
class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $token = JWTAuth::fromUser($admin);
        $this->withHeader('Authorization', "Bearer {$token}");

        return $admin;
    }

    public function test_alumni_cannot_access_admin_user_list(): void
    {
        $alumni = User::factory()->create(['role' => UserRole::ALUMNI]);
        $token = JWTAuth::fromUser($alumni);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users')
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }

    public function test_admin_can_list_users(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonStructure(['success', 'message', 'data', 'meta']);
    }

    public function test_admin_cannot_create_another_admin_through_user_endpoint(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/users', [
            'email' => 'new-admin@example.com',
            'password' => 'Str0ng!Passw0rd#1',
            'role' => 'admin',
            'first_name' => 'New',
            'last_name' => 'Admin',
        ])->assertStatus(422)->assertJsonValidationErrors('role');
    }

    public function test_admin_cannot_change_own_status(): void
    {
        $admin = $this->actingAsAdmin();

        $this->patchJson("/api/admin/users/{$admin->uuid}/status", [
            'status' => UserStatus::SUSPENDED->value,
        ])->assertForbidden();
    }

    public function test_admin_cannot_suspend_another_admin(): void
    {
        $this->actingAsAdmin();
        $otherAdmin = User::factory()->admin()->create();

        $this->patchJson("/api/admin/users/{$otherAdmin->uuid}/status", [
            'status' => UserStatus::SUSPENDED->value,
        ])->assertForbidden();
    }

    public function test_admin_can_suspend_an_alumni(): void
    {
        $this->actingAsAdmin();
        $alumni = User::factory()->create(['role' => UserRole::ALUMNI]);

        $this->patchJson("/api/admin/users/{$alumni->uuid}/status", [
            'status' => UserStatus::SUSPENDED->value,
        ])->assertOk();

        $this->assertEquals(
            UserStatus::SUSPENDED,
            $alumni->fresh()->status
        );
    }
}
