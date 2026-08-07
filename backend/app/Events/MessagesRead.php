<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Events/MessagesRead.php
// ═══════════════════════════════════════════════════════════
//
//  Broadcasts on conversation.{id} the instant a batch of messages gets
//  marked read (see MessageService::messages()). Lets the SENDER's open
//  thread flip "Sent" -> "Read • 2:14 PM" live, without a poll.
//
//  Dispatched explicitly from MessageService — NOT from a Message model
//  event hook, because the mark-read operation is a bulk
//  `Message::where(...)->update(...)` query. Bulk updates bypass Eloquent
//  model events entirely (Message::booted()'s static::updated() would
//  never fire here), so this has to be fired by the caller that knows
//  the read actually happened.
//
// ═══════════════════════════════════════════════════════════

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class MessagesRead implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    /**
     * @param int    $conversationId
     * @param int    $readerId    The user who just read the messages (i.e. NOT
     *                            the sender whose bubbles need updating).
     * @param array  $messageIds  IDs of the messages that were just marked read.
     * @param Carbon $readAt
     */
    public function __construct(
        public int $conversationId,
        public int $readerId,
        public array $messageIds,
        public Carbon $readAt,
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
        return 'messages.read';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'reader_id'       => $this->readerId,
            'message_ids'     => $this->messageIds,
            'read_at'         => $this->readAt->toISOString(),
        ];
    }
}
