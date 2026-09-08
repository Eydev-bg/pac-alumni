<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Events/MessageUnsent.php
// ═══════════════════════════════════════════════════════════
//
//  Broadcasts on conversation.{id} the instant a message is unsent for
//  everyone (see MessageService::deleteMessage()), so the OTHER
//  participant's open thread swaps the bubble for the "This message was
//  unsent." placeholder without waiting for the 30s poll. Mirrors
//  MessagesRead: dispatched explicitly by the service rather than from a
//  model hook, since the sender's own view is already updated
//  optimistically client-side.
//
//  The payload carries ids only — deliberately no content, since the
//  whole point of an unsend is that the text and attachment stop being
//  transmitted.
//
// ═══════════════════════════════════════════════════════════

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class MessageUnsent implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $conversationId,
        public int $messageId,
        public Carbon $unsentAt,
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->conversationId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.unsent';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'message_id'      => $this->messageId,
            'unsent_at'       => $this->unsentAt->toISOString(),
        ];
    }
}
