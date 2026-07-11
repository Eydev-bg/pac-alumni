<?php

namespace App\Http\Middleware;

use App\Models\MaintenanceSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks non-admin (Alumni / Employer) access while maintenance mode is on.
 *
 * SAFETY: Admins ALWAYS bypass this check — even if the middleware is ever
 * attached to an admin route by mistake — so an administrator can never lock
 * themselves out and can always turn maintenance mode back off.
 *
 * When active, non-admin requests receive a 503 with a `maintenance: true`
 * flag and the custom (or default) message, which the SPA renders as a clean
 * maintenance page.
 */
class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $user->isAdmin()) {
            return $next($request);
        }

        $settings = MaintenanceSetting::getSettings();

        if ($settings->is_enabled) {
            return response()->json([
                'success' => false,
                'maintenance' => true,
                'message' => $settings->message ?: MaintenanceSetting::DEFAULT_MESSAGE,
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return $next($request);
    }
}
