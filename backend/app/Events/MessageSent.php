<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Events/MessageSent.php
// ═══════════════════════════════════════════════════════════
//
//  Broadcasts a Message the instant it's created, over two channels:
//
//    1. conversation.{id} — the two participants' open chat thread, so a
//       message appears live in ConversationThread.jsx without a poll.
//    2. user.{recipientUuid} — the RECIPIENT's personal channel, so the
//       inbox list (AlumniInboxPage.jsx) can resort + bump the unread dot
//       even when that thread isn't open. Only the recipient needs this;
//       the sender's own list is already updated optimistically client-side.
//
//  Dispatched automatically by Message::booted() — every current and
//  future call site that does Message::create(...) gets real-time
//  delivery for free, with no per-call-site wiring (same pattern as
//  NotificationCreated / Notification::booted()).
//
//  Payload carries raw facts only (sender uuid, conversation id, content).
//  `is_mine` is NOT computed here — unlike a REST response, one broadcast
//  payload reaches both participants, and "mine" means something different
//  to each of them. The frontend derives it by comparing sender.uuid to
//  the logged-in user, same fallback ConversationThread.jsx already uses
//  for optimistic bubbles.
//
// ═══════════════════════════════════════════════════════════

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $conversation = $this->message->conversation;
        $channels = [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];

        $recipient = $conversation?->otherParticipant($this->message->sender_id);
        if ($recipient) {
            $channels[] = new PrivateChannel('user.' . $recipient->uuid);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    /**
     * Raw facts only — see class docblock for why `is_mine` is omitted.
     */
    public function broadcastWith(): array
    {
        return [
            'id'              => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'content'         => $this->message->content,
            'is_read'         => $this->message->is_read,
            'read_at'         => $this->message->read_at?->toISOString(),
            // Quote snapshot. No `is_mine` here for the same reason as the main
            // message — one payload reaches both participants; the frontend
            // derives it from the sender.
            'reply_to'        => $this->message->reply_to_id && $this->message->replyTo
                ? [
                    'id'          => $this->message->replyTo->id,
                    'content'     => $this->message->replyTo->content,
                    'sender_name' => $this->message->replyTo->sender?->full_name ?? 'PAC Alumnus',
                ]
                : null,
            // Attachment snapshot, so a real-time-delivered file renders
            // immediately without a refetch. URL via the model accessor.
            'attachment'      => $this->message->attachment_path
                ? [
                    'url'  => $this->message->attachment_url,
                    'type' => $this->message->attachment_type,
                    'name' => $this->message->attachment_name,
                    'size' => $this->message->attachment_size,
                ]
                : null,
            'sender'          => [
                'uuid' => $this->message->sender?->uuid,
                'name' => $this->message->sender?->full_name ?? 'PAC Alumnus',
            ],
            'created_at'      => $this->message->created_at?->toISOString(),
        ];
    }
}
