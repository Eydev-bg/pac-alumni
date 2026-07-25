<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ReminderControllerTest extends TestCase
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

    public function test_stats_returns_data(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/reminders/stats')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'totals' => ['today', 'this_week', 'this_month', 'all_time'],
                    'by_type' => [
                        ['type', 'label', 'today', 'this_week', 'this_month', 'total'],
                    ],
                ],
            ]);
    }

    public function test_stats_requires_admin_role(): void
    {
        $this->getJson('/api/admin/reminders/stats')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/reminders/stats')->assertForbidden();
    }
}
