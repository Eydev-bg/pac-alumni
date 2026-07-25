<?php

namespace Tests\Feature\Admin;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
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

    private function makeNotification(User $user, array $attrs = []): Notification
    {
        return Notification::create(array_merge([
            'user_id' => $user->id,
            'type' => 'employment_update',
            'title' => 'Employment Update',
            'message' => 'An alumni updated their employment.',
            'data' => ['foo' => 'bar'],
            'is_read' => false,
        ], $attrs));
    }

    public function test_index_returns_paginated_notifications(): void
    {
        $admin = $this->actingAsAdmin();
        $this->makeNotification($admin);
        $this->makeNotification($admin);

        $this->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_unread_count_returns_number(): void
    {
        $admin = $this->actingAsAdmin();
        $this->makeNotification($admin);
        $this->makeNotification($admin, ['is_read' => true, 'read_at' => now()]);

        $this->getJson('/api/admin/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.count', 1);
    }

    public function test_mark_read_updates_notification(): void
    {
        $admin = $this->actingAsAdmin();
        $notification = $this->makeNotification($admin);

        $this->patchJson("/api/admin/notifications/{$notification->id}/read")
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'is_read' => 1,
        ]);
    }

    public function test_mark_all_read_clears_unread(): void
    {
        $admin = $this->actingAsAdmin();
        $this->makeNotification($admin);
        $this->makeNotification($admin);

        $this->patchJson('/api/admin/notifications/read-all')->assertOk();

        $this->assertSame(0, Notification::where('user_id', $admin->id)->unread()->count());
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/notifications')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/notifications')->assertForbidden();
    }
}
