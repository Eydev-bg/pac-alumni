<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\PasswordReset;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Auth\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthService $authService,
        protected UserRepositoryInterface $userRepo,
    ) {}

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
                'user' => new UserResource($result['user']),
            ], 'Login successful.');
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
            new UserResource(auth('api')->user()),
            'User profile retrieved.'
        );
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
            // Delete old tokens
            PasswordReset::where('email', $email)->delete();

            // Create new token
            $token = Str::random(64);
            PasswordReset::create([
                'email' => $email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            // TODO: Send email with reset link containing $token
            // Mail::to($email)->queue(new PasswordResetMail($token));
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
}
