<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/routes/channels.php
// ═══════════════════════════════════════════════════════════
//
//  Channel authorization callbacks. Each callback runs against the user
//  resolved by the `auth:api` JWT guard (see BroadcastAuthController +
//  the POST /api/broadcasting/auth route in routes/api/*.php) — NOT the
//  session-based 'web' guard Laravel assumes by default.
//
//  Naming convention: channels are keyed by the user's UUID, never the
//  numeric id, matching every other public-facing identifier in this app
//  (User::getRouteKeyName() = 'uuid', id is hidden from JSON — see
//  App\Models\User).
//
// ═══════════════════════════════════════════════════════════

use App\Enums\UserRole;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Private per-user channel — Phase 2 will use this for personal
| notifications (both alumni and admin notifications ride this channel;
| the payload's `type` distinguishes them). A user may only listen on
| their own channel.
|--------------------------------------------------------------------------
*/

Broadcast::channel('user.{uuid}', function (User $user, string $uuid) {
    return $user->uuid === $uuid;
});

/*
|--------------------------------------------------------------------------
| Private conversation channel — Phase 2 will use this for the alumni
| messaging feature. Only the two participants of that conversation may
| subscribe. Conversation is looked up by its numeric id (internal,
| never exposed as a route param to the browser — only used as the
| channel's path segment, same as today's /api/alumni/messages/{id}
| routes already do).
|--------------------------------------------------------------------------
*/
Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId) {
    $conversation = Conversation::find($conversationId);

    if (!$conversation) {
        return false;
    }

    return $conversation->participant_one_id === $user->id
        || $conversation->participant_two_id === $user->id;
});

/*
|--------------------------------------------------------------------------
| Private admin-wide channel — Phase 2 will use this for the live
| dashboard chart updates (Employment Type Distribution, Employment
| Overview, Board Exam Overview) and admin notification broadcasts that
| should reach every logged-in admin, not just one. Any authenticated
| admin may subscribe; no per-resource ownership check needed since this
| channel carries no alumni-identifying payloads beyond aggregate counts.
|--------------------------------------------------------------------------
*/
Broadcast::channel('admin.dashboard', function (User $user) {
    return $user->role === UserRole::ADMIN;
});
