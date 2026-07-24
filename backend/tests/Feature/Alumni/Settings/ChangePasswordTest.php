<?php

namespace Tests\Feature\Alumni\Settings;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/alumni/settings/security/password';

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }

    public function test_rejects_an_incorrect_current_password(): void
    {
        $user = User::factory()->create(); // factory password = 'password'

        $response = $this->withToken($this->tokenFor($user))->putJson(self::ENDPOINT, [
            'current_password'      => 'not-the-right-password',
            'password'              => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);
    }

    public function test_rejects_a_weak_new_password(): void
    {
        $user = User::factory()->create();

        $response = $this->withToken($this->tokenFor($user))->putJson(self::ENDPOINT, [
            'current_password'      => 'password',
            'password'              => 'weak',
            'password_confirmation' => 'weak',
        ]);

        // Proves the StrongPassword rule actually fires on this endpoint.
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_rejects_a_new_password_identical_to_the_current_one(): void
    {
        // Give the user a strong current password so the ONLY failing rule is
        // `different` — otherwise StrongPassword would mask it.
        $user = User::factory()->create(['password' => 'Current123!']);

        $response = $this->withToken($this->tokenFor($user))->putJson(self::ENDPOINT, [
            'current_password'      => 'Current123!',
            'password'              => 'Current123!',
            'password_confirmation' => 'Current123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_succeeds_with_a_valid_strong_password_and_returns_a_token(): void
    {
        $user = User::factory()->create();

        $response = $this->withToken($this->tokenFor($user))->putJson(self::ENDPOINT, [
            'current_password'      => 'password',
            'password'              => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.token_type', 'bearer');
        $this->assertIsString($response->json('data.token'));
        $this->assertNotEmpty($response->json('data.token'));

        // The password was actually rotated.
        $this->assertTrue(Hash::check('NewPass123!', $user->fresh()->password));
    }

    public function test_writes_an_audit_log_row_with_null_metadata(): void
    {
        $user = User::factory()->create();

        $this->withToken($this->tokenFor($user))->putJson(self::ENDPOINT, [
            'current_password'      => 'password',
            'password'              => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ])->assertOk();

        $log = AuditLog::where('action', 'settings.password_changed')->first();

        $this->assertNotNull($log, 'Expected a settings.password_changed audit row.');
        $this->assertSame($user->id, $log->user_id);
        // CRITICAL: no password value, length, or any derived secret is logged.
        $this->assertNull($log->metadata);
    }

    public function test_the_old_token_is_rejected_after_the_password_changes(): void
    {
        $user = User::factory()->create();
        $oldToken = $this->tokenFor($user);

        $this->withToken($oldToken)->putJson(self::ENDPOINT, [
            'current_password'      => 'password',
            'password'              => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ])->assertOk();

        // Reusing the pre-change token must fail: the password fingerprint the
        // token carries is now stale (EnsureTokenPasswordIsCurrent).
        $this->withToken($oldToken)
            ->getJson('/api/alumni/settings/appearance')
            ->assertUnauthorized();
    }

    public function test_an_admin_cannot_reach_the_alumni_settings_route(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->withToken($this->tokenFor($admin))->putJson(self::ENDPOINT, [
            'current_password'      => 'password',
            'password'              => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ]);

        $response->assertForbidden();
    }
}
