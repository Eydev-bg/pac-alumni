<?php

use App\Http\Controllers\Api\BroadcastAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Broadcasting Auth Route (Protected: auth only — both roles)
|--------------------------------------------------------------------------
|
| Echo/pusher-js calls this endpoint automatically whenever the frontend
| subscribes to a private or presence channel (see resources/js Echo
| client config on the frontend). It is intentionally OUTSIDE the
| role:admin / role:alumni groups in admin.php / alumni.php — both admins
| and alumni need to authorize channel subscriptions (e.g. an alumnus
| authorizing "conversation.42", an admin authorizing "admin.dashboard").
| Per-channel, per-role authorization itself happens in
| routes/channels.php's Broadcast::channel() callbacks, not here.
|
| No 'maintenance' middleware: admins must keep receiving real-time
| updates while maintenance mode blocks alumni elsewhere, and CheckAccountStatus
| already blocks suspended/deactivated accounts of either role.
|
*/

Route::post('/broadcasting/auth', [BroadcastAuthController::class, 'authenticate'])
    ->middleware(['auth:api', 'account.status'])
    ->name('broadcasting.auth');
