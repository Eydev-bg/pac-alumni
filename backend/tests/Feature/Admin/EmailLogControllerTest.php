<?php

namespace Tests\Feature\Admin;

use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class EmailLogControllerTest extends TestCase
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

    public function test_index_returns_paginated_logs(): void
    {
        EmailLog::create([
            'user_id' => null,
            'to_email' => 'a@example.com',
            'type' => 'announcement',
            'subject' => 'Hello',
            'status' => 'sent',
            'sent_at' => now(),
        ]);
        EmailLog::create([
            'user_id' => null,
            'to_email' => 'b@example.com',
            'type' => 'reminder',
            'subject' => 'Reminder',
            'status' => 'failed',
            'sent_at' => now(),
        ]);

        $this->actingAsAdmin();

        $this->getJson('/api/admin/email-logs')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_index_requires_admin_role(): void
    {
        // Unauthenticated → 401.
        $this->getJson('/api/admin/email-logs')->assertUnauthorized();

        // Alumni → 403.
        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/email-logs')->assertForbidden();
    }
}
