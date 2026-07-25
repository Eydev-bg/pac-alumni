<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class SettingsControllerTest extends TestCase
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

    public function test_get_returns_maintenance_settings(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/settings/maintenance')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['is_enabled', 'message', 'enabled_at', 'updated_at'],
            ])
            ->assertJsonPath('data.is_enabled', false);
    }

    public function test_update_toggles_maintenance_mode(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/settings/maintenance', [
            'is_enabled' => true,
            'message' => 'Down for maintenance.',
        ])
            ->assertOk()
            ->assertJsonPath('data.is_enabled', true)
            ->assertJsonPath('data.message', 'Down for maintenance.');

        $this->assertDatabaseHas('maintenance_settings', ['is_enabled' => 1]);
    }

    public function test_update_validates_is_enabled_required(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/settings/maintenance', ['message' => 'no flag'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('is_enabled');
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/settings/maintenance')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/settings/maintenance')->assertForbidden();
    }
}
