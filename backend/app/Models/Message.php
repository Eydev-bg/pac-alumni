<?php

// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/Message.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Events\MessageSent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
        'is_read',
    ];

    protected static function booted(): void
    {
        static::created(function (Message $message) {
            // Load the relations broadcastOn()/broadcastWith() need — the
            // caller (MessageService::sendMessage) loads `sender` right
            // after create(), but that happens after this event fires, so
            // load explicitly here rather than depend on call-site order.
            $message->loadMissing(['sender', 'conversation']);
            broadcast(new MessageSent($message));
        });
    }

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
