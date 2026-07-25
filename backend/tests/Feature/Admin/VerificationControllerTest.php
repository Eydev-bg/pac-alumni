<?php

namespace Tests\Feature\Admin;

use App\Enums\VerificationStatus;
use App\Models\RegistrationBlacklist;
use App\Models\User;
use App\Models\VerificationLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class VerificationControllerTest extends TestCase
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

    private function makeLog(VerificationStatus $status, array $attrs = []): VerificationLog
    {
        return VerificationLog::create(array_merge([
            'alumni_id_input' => 'PAC-2024-0001',
            'name_input' => 'Juan Dela Cruz',
            'email_input' => 'juan@example.com',
            'ip_address' => '127.0.0.1',
            'status' => $status,
            'matched_graduate_id' => null,
            'rejection_reason' => $status === VerificationStatus::REJECTED ? 'No match found.' : null,
            'created_at' => now(),
        ], $attrs));
    }

    // ─── Verification logs ───────────────────────────────────

    public function test_logs_returns_paginated(): void
    {
        $this->makeLog(VerificationStatus::VERIFIED);
        $this->makeLog(VerificationStatus::REJECTED);
        $this->actingAsAdmin();

        $this->getJson('/api/admin/verification/logs')
            ->assertOk()
            ->assertJsonStructure(['success', 'message', 'data', 'meta' => ['current_page', 'total']])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_verified_returns_only_verified(): void
    {
        $this->makeLog(VerificationStatus::VERIFIED);
        $this->makeLog(VerificationStatus::REJECTED);
        $this->actingAsAdmin();

        $this->getJson('/api/admin/verification/verified')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_rejected_returns_only_rejected(): void
    {
        $this->makeLog(VerificationStatus::VERIFIED);
        $this->makeLog(VerificationStatus::REJECTED);
        $this->makeLog(VerificationStatus::REJECTED);
        $this->actingAsAdmin();

        $this->getJson('/api/admin/verification/rejected')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_stats_returns_structure(): void
    {
        $this->makeLog(VerificationStatus::VERIFIED);
        $this->makeLog(VerificationStatus::REJECTED);
        $this->actingAsAdmin();

        $this->getJson('/api/admin/verification/stats')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['total_attempts', 'verified_count', 'rejected_count', 'success_rate', 'daily_trend'],
            ])
            ->assertJsonPath('data.total_attempts', 2)
            ->assertJsonPath('data.verified_count', 1)
            ->assertJsonPath('data.rejected_count', 1);
    }

    // ─── Registration settings ───────────────────────────────

    public function test_get_registration_settings(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/registration/settings')
            ->assertOk()
            ->assertJsonStructure(['data' => ['is_open', 'is_currently_open', 'open_from', 'open_until']]);
    }

    public function test_update_registration_settings(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/registration/settings', ['is_open' => true])
            ->assertOk()
            ->assertJsonPath('data.is_open', true);

        $this->assertDatabaseHas('registration_settings', ['is_open' => 1]);
    }

    public function test_update_registration_settings_validates(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/registration/settings', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('is_open');
    }

    // ─── Blacklist ───────────────────────────────────────────

    public function test_blacklist_index_returns_paginated(): void
    {
        $admin = $this->actingAsAdmin();
        RegistrationBlacklist::create([
            'identifier' => '10.0.0.5',
            'identifier_type' => 'ip',
            'reason' => 'Abuse',
            'blacklisted_by' => $admin->id,
            'created_at' => now(),
        ]);

        $this->getJson('/api/admin/blacklist')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_add_to_blacklist(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/blacklist', [
            'identifier' => 'PAC-2024-9999',
            'identifier_type' => 'alumni_id',
            'reason' => 'Fraudulent attempt.',
        ])->assertCreated();

        $this->assertDatabaseHas('registration_blacklist', [
            'identifier' => 'PAC-2024-9999',
            'identifier_type' => 'alumni_id',
        ]);
    }

    public function test_add_to_blacklist_rejects_duplicate(): void
    {
        $admin = $this->actingAsAdmin();
        RegistrationBlacklist::create([
            'identifier' => '10.0.0.9',
            'identifier_type' => 'ip',
            'reason' => 'Existing',
            'blacklisted_by' => $admin->id,
            'created_at' => now(),
        ]);

        $this->postJson('/api/admin/blacklist', [
            'identifier' => '10.0.0.9',
            'identifier_type' => 'ip',
        ])->assertStatus(422);
    }

    public function test_remove_from_blacklist(): void
    {
        $admin = $this->actingAsAdmin();
        $item = RegistrationBlacklist::create([
            'identifier' => '10.0.0.7',
            'identifier_type' => 'ip',
            'reason' => 'Remove me',
            'blacklisted_by' => $admin->id,
            'created_at' => now(),
        ]);

        $this->deleteJson("/api/admin/blacklist/{$item->id}")->assertOk();
        $this->assertDatabaseMissing('registration_blacklist', ['id' => $item->id]);
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/verification/logs')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/verification/logs')->assertForbidden();
    }
}
