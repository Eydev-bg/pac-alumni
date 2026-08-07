<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Middleware/TrackLastActive.php
// ═══════════════════════════════════════════════════════════
//
//  Simple online-status tracking — no presence channel (see
//  routes/channels.php for why: a JWT-only app fighting Laravel's
//  session-guard-only presence-auth path wasn't worth it for what's
//  fundamentally just "was this person recently active").
//
//  Updates `users.last_active_at` on authenticated requests, throttled to
//  once every ACTIVE_THROTTLE_SECONDS per user so this doesn't add a write
//  query to every single API call. ConversationThread.jsx reads the OTHER
//  participant's last_active_at (via GET /api/alumni/conversations/{id})
//  and renders "🟢 Available" when recent, else "Active X ago".
//
// ═══════════════════════════════════════════════════════════

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class TrackLastActive
{
    /** Minimum seconds between last_active_at writes for the same user. */
    private const ACTIVE_THROTTLE_SECONDS = 60;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $cacheKey = "last-active-throttle:{$user->id}";

            if (!Cache::has($cacheKey)) {
                Cache::put($cacheKey, true, self::ACTIVE_THROTTLE_SECONDS);
                // Bulk update() (not $user->save()) — avoids touching
                // updated_at / firing model events for what's just a
                // best-effort heartbeat, not a meaningful model change.
                $user::where('id', $user->id)->update(['last_active_at' => now()]);
            }
        }

        return $next($request);
    }
}
