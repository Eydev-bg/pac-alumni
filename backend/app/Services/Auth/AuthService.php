<?php

namespace App\Services\Auth;

use App\Enums\LoginAttemptStatus;
use App\Enums\UserStatus;
use App\Repositories\Contracts\LoginActivityLogRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    // SECURITY: Brute force protection thresholds
    private const MAX_FAILED_ATTEMPTS_PER_EMAIL = 5;
    private const MAX_FAILED_ATTEMPTS_PER_IP = 15;
    private const LOCKOUT_WINDOW_MINUTES = 15;

    public function __construct(
        protected UserRepositoryInterface $userRepo,
        protected LoginActivityLogRepositoryInterface $logRepo,
    ) {}

    /**
     * Attempt login with security checks.
     *
     * @return array{token: string, user: \App\Models\User}
     * @throws \Exception
     */
    public function login(string $email, string $password, string $ip, ?string $userAgent): array
    {
        // ─── Step 1: Check IP-based rate limiting ────────────
        if ($this->isIpBlocked($ip)) {
            $this->logAttempt(null, $email, $ip, $userAgent, LoginAttemptStatus::BLOCKED);
            throw new \Exception('Too many login attempts. Please try again later.', 429);
        }

        // ─── Step 2: Check email-based rate limiting ─────────
        if ($this->isEmailBlocked($email)) {
            $this->logAttempt(null, $email, $ip, $userAgent, LoginAttemptStatus::BLOCKED);
            throw new \Exception('Account temporarily locked due to too many failed attempts. Please try again later.', 429);
        }

        // ─── Step 3: Find user ───────────────────────────────
        $user = $this->userRepo->findByEmail($email);

        if (!$user || !Hash::check($password, $user->password)) {
            $this->logAttempt(
                $user?->id,
                $email,
                $ip,
                $userAgent,
                LoginAttemptStatus::FAILED
            );
            // SECURITY: Generic message — never reveal if email exists
            throw new \Exception('Invalid email or password.', 401);
        }

        // ─── Step 4: Check account status ────────────────────
        if (!$user->canLogin()) {
            $this->logAttempt($user->id, $email, $ip, $userAgent, LoginAttemptStatus::BLOCKED);
            throw new \Exception('Your account has been ' . $user->status->value . '. Please contact the administrator.', 403);
        }

        // ─── Step 5: Generate token ──────────────────────────
        $token = JWTAuth::fromUser($user);

        // ─── Step 6: Log success & update user ───────────────
        $this->logAttempt($user->id, $email, $ip, $userAgent, LoginAttemptStatus::SUCCESS);
        $this->userRepo->updateLastLogin($user, $ip);

        return [
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60, // seconds
            'user' => $user,
        ];
    }

    /**
     * Logout (invalidate token).
     */
    public function logout(): void
    {
        JWTAuth::invalidate(JWTAuth::getToken());
    }

    /**
     * Refresh token.
     */
    public function refresh(): array
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());

        return [
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ];
    }

    // ─── Private Helpers ─────────────────────────────────────

    private function isEmailBlocked(string $email): bool
    {
        $count = $this->logRepo->getRecentFailedAttempts(
            $email,
            self::LOCKOUT_WINDOW_MINUTES
        );

        return $count >= self::MAX_FAILED_ATTEMPTS_PER_EMAIL;
    }

    private function isIpBlocked(string $ip): bool
    {
        $count = $this->logRepo->getRecentFailedByIp(
            $ip,
            self::LOCKOUT_WINDOW_MINUTES
        );

        return $count >= self::MAX_FAILED_ATTEMPTS_PER_IP;
    }

    private function logAttempt(
        ?int $userId,
        string $email,
        string $ip,
        ?string $userAgent,
        LoginAttemptStatus $status
    ): void {
        $this->logRepo->log(
            $userId,
            $email,
            $ip,
            $userAgent,
            $status->value
        );
    }
}
