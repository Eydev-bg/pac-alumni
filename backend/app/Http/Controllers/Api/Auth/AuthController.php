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
use App\Services\Auth\PasswordResetService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthService $authService,
        protected UserRepositoryInterface $userRepo,
        protected PasswordResetService $passwordResetService,
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
     * PUT /api/auth/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => [
                'required', 'email', 'max:150',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data'    => $user->fresh(),
        ]);
    }

    /**
     * PUT /api/auth/change-password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

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

        return response()->json([
            'message' => 'Password changed successfully.',
            'data' => [
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ],
        ]);
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
}
