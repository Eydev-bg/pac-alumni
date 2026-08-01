<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResendVerificationRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\PasswordReset;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Auth\AuthService;
use App\Services\Auth\EmailVerificationService;
use App\Services\Auth\PasswordResetService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthService $authService,
        protected UserRepositoryInterface $userRepo,
        protected PasswordResetService $passwordResetService,
        protected EmailVerificationService $emailVerificationService,
    ) {}

    /**
     * Eager-load the academic chain for alumni so UserResource can expose
     * `is_board_program` (used by the Alumni layout for Board Exam nav gating)
     * without the frontend fetching the full dashboard.
     */
    protected function withBoardProgramFlag(User $user): User
    {
        if (!$user->isAdmin()) {
            $user->loadMissing('alumniProfile.graduate.course');
        }

        return $user;
    }

    /**
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login(
                $request->validated('email'),
                $request->validated('password'),
                $request->ip(),
                $request->userAgent()
            );

            return $this->success([
                'token' => $result['token'],
                'token_type' => $result['token_type'],
                'expires_in' => $result['expires_in'],
                'user' => new UserResource($this->withBoardProgramFlag($result['user'])),
            ], 'Login successful.');
        } catch (\App\Exceptions\EmailNotVerifiedException $e) {
            // Machine-readable code so the frontend can show a "Resend
            // verification email" action instead of a plain error message.
            return $this->error($e->getMessage(), $e->getCode() ?: 403, [
                'code' => 'EMAIL_NOT_VERIFIED',
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 401);
        }
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): JsonResponse
    {
        try {
            $this->authService->logout();
            return $this->success(null, 'Successfully logged out.');
        } catch (\Exception $e) {
            return $this->success(null, 'Successfully logged out.');
        }
    }

    /**
     * POST /api/auth/refresh
     */
    public function refresh(): JsonResponse
    {
        try {
            $result = $this->authService->refresh();
            return $this->success($result, 'Token refreshed.');
        } catch (\Exception $e) {
            return $this->unauthorized('Token refresh failed. Please login again.');
        }
    }

    /**
     * GET /api/auth/me
     */
    public function me(): JsonResponse
    {
        return $this->success(
            new UserResource($this->withBoardProgramFlag(auth('api')->user())),
            'User profile retrieved.'
        );
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = auth()->user();

        $user->update($request->validated());

        // Return a UserResource (never a raw model) so no non-$hidden field leaks
        // and the payload matches the app-wide contract.
        return $this->success(
            new UserResource($user->fresh()),
            'Profile updated successfully.'
        );
    }

    /**
     * PUT /api/auth/change-password
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = auth()->user();
        $validated = $request->validated();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        // SECURITY: Changing the password rotates the user's password fingerprint,
        // which invalidates every previously-issued JWT (see EnsureTokenPasswordIsCurrent).
        // Issue a fresh token so the CURRENT session stays logged in while all other
        // active sessions are forced to re-authenticate.
        $token = JWTAuth::fromUser($user);

        return $this->success([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ], 'Password changed successfully.');
    }

    /**
     * POST /api/auth/forgot-password
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');
        $user = $this->userRepo->findByEmail($email);

        // SECURITY: Always return success message regardless of whether email exists
        // This prevents email enumeration attacks
        if ($user) {
            // Token creation + queued email are owned by PasswordResetService so
            // the public and admin-initiated flows share one implementation.
            $this->passwordResetService->sendResetLink($user);
        }

        return $this->success(null, 'If your email exists in our system, you will receive a password reset link.');
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $record = PasswordReset::where('email', $request->validated('email'))
            ->latest('created_at')
            ->first();

        if (!$record || !Hash::check($request->validated('token'), $record->token)) {
            return $this->error('Invalid or expired reset token.', 400);
        }

        if ($record->isExpired()) {
            $record->delete();
            return $this->error('Reset token has expired. Please request a new one.', 400);
        }

        $user = $this->userRepo->findByEmail($request->validated('email'));

        if (!$user) {
            return $this->error('User not found.', 404);
        }

        $this->userRepo->update($user, [
            'password' => $request->validated('password'),
        ]);

        // Delete used token
        PasswordReset::where('email', $request->validated('email'))->delete();

        return $this->success(null, 'Password has been reset successfully.');
    }

    /**
     * POST /api/auth/verify-email
     */
    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        try {
            $this->emailVerificationService->verify(
                $request->validated('email'),
                $request->validated('token'),
            );

            return $this->success(null, 'Email verified successfully. You can now log in.');
        } catch (\App\Exceptions\DomainException $e) {
            return $this->error($e->getMessage(), $e->status());
        }
    }

    /**
     * POST /api/auth/resend-verification
     */
    public function resendVerification(ResendVerificationRequest $request): JsonResponse
    {
        // SECURITY: Always return the same generic message regardless of
        // whether the email exists or is already verified, so this endpoint
        // cannot be used to enumerate registered emails (mirrors forgotPassword).
        $this->emailVerificationService->resend($request->validated('email'));

        return $this->success(
            null,
            'If that email is registered and not yet verified, a new verification link has been sent.'
        );
    }
}
