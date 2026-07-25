<?php

namespace Tests\Feature\Admin;

use App\Enums\LoginAttemptStatus;
use App\Models\LoginActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class LoginActivityLogControllerTest extends TestCase
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
        $user = User::factory()->create();
        LoginActivityLog::create([
            'user_id' => $user->id,
            'email_attempted' => $user->email,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'status' => LoginAttemptStatus::SUCCESS,
            'created_at' => now(),
        ]);
        LoginActivityLog::create([
            'user_id' => null,
            'email_attempted' => 'ghost@example.com',
            'ip_address' => '10.0.0.1',
            'user_agent' => 'PHPUnit',
            'status' => LoginAttemptStatus::FAILED,
            'created_at' => now(),
        ]);

        $this->actingAsAdmin();

        $this->getJson('/api/admin/login-logs')
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
        $this->getJson('/api/admin/login-logs')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/login-logs')->assertForbidden();
    }
}
