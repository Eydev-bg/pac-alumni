<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/BroadcastAuthController.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;

/**
 * Authorizes Reverb private/presence channel subscriptions.
 *
 * This app is API-only: JWT via the `auth:api` guard, no sessions, no
 * cookies (see config/cors.php — supports_credentials is false). Laravel's
 * default broadcasting auth route (registered by Broadcast::routes()) is
 * built for the 'web' guard and session-cookie requests, so it is NOT used
 * here. Instead this route is registered manually in routes/api/*.php,
 * behind ->middleware(['auth:api', ...]), and reuses the same Bearer-token
 * pattern as every other authenticated endpoint.
 *
 * IMPORTANT: The response body must be Pusher-protocol raw JSON
 * ({"auth": "..."} or {"auth": "...", "channel_data": "..."}) — NOT the
 * app's usual {success, message, data} envelope (ApiResponse trait). Echo /
 * pusher-js parses this response directly; wrapping it would break every
 * private/presence subscription. Broadcast::auth() + the Broadcaster's
 * validAuthenticationResponse() already produce the correct raw shape, so
 * this controller returns them untouched.
 */
class BroadcastAuthController extends Controller
{
    /**
     * POST /api/broadcasting/auth
     *
     * Channel authorization callbacks live in routes/channels.php as usual
     * (Broadcast::channel(...)) — this controller only swaps out *how* the
     * request is authenticated (JWT guard) before delegating to Laravel's
     * standard broadcast authorization.
     */
    public function authenticate(Request $request)
    {
        \Illuminate\Support\Facades\Log::error('[presence-debug] auth controller hit', [
            'channel_name' => $request->input('channel_name'),
            'socket_id'    => $request->input('socket_id'),
        ]);

        try {
            return Broadcast::auth($request);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[presence-debug] Broadcast::auth threw', [
                'exception_class' => get_class($e),
                'message'         => $e->getMessage(),
                'file'            => $e->getFile(),
                'line'            => $e->getLine(),
            ]);
            throw $e;
        }
    }
}
