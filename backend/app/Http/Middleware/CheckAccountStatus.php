<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountStatus
{
    use ApiResponse;

    /**
     * SECURITY: Even if a user has a valid JWT token, block them
     * if their account was suspended/deactivated AFTER token was issued.
     * This prevents "suspended but still logged in" scenarios.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !$user->canLogin()) {
            // Invalidate their token
            try {
                auth()->logout();
            } catch (\Exception $e) {
                // Token may already be invalid
            }

            return $this->forbidden(
                'Your account has been ' . $user->status->value . '. Please contact the administrator.'
            );
        }

        return $next($request);
    }
}
