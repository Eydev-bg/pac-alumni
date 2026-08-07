<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Events/NotificationCreated.php
// ═══════════════════════════════════════════════════════════
//
//  Broadcasts a Notification the instant it's created, over the
//  recipient's private `user.{uuid}` channel (see routes/channels.php).
//  Dispatched automatically by Notification::booted() — every current
//  and future call site that does Notification::create(...) gets
//  real-time delivery for free, with no per-call-site wiring.
//
// ═══════════════════════════════════════════════════════════

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Notification $notification) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->notification->user->uuid),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    /**
     * Matches the shape already returned by the notifications index
     * endpoints, so the frontend can reuse its existing rendering logic.
     */
    public function broadcastWith(): array
    {
        return $this->notification->toArray();
    }
}
