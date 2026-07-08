<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rejects JWTs whose password fingerprint no longer matches the user's current
 * password. When a user changes their password, the fingerprint claim ('pwf')
 * baked into previously-issued tokens becomes stale, so every old session is
 * forced to re-authenticate.
 *
 * The middleware is a no-op for requests without a bearer token (public routes)
 * and for legacy tokens that predate the fingerprint claim — in both cases the
 * route's own auth:api middleware remains the authority on access.
 */
class EnsureTokenPasswordIsCurrent
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            try {
                $fingerprint = JWTAuth::parseToken()->getPayload()->get('pwf');

                if ($fingerprint !== null) {
                    $user = JWTAuth::authenticate();

                    if ($user && $fingerprint !== $user->passwordFingerprint()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Session expired. Please login again.',
                        ], Response::HTTP_UNAUTHORIZED);
                    }
                }
            } catch (\Throwable $e) {
                // Invalid / expired / unparseable token — defer to auth:api so
                // the standard unauthenticated handling applies.
            }
        }

        return $next($request);
    }
}
