<?php

// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/Message.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Events\MessageSent;
use App\Services\StorageService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
        'reply_to_id',
        'attachment_path',
        'attachment_type',
        'attachment_name',
        'attachment_size',
        'is_read',
    ];

    protected static function booted(): void
    {
        static::created(function (Message $message) {
            // Load the relations broadcastOn()/broadcastWith() need — the
            // caller (MessageService::sendMessage) loads `sender` right
            // after create(), but that happens after this event fires, so
            // load explicitly here rather than depend on call-site order.
            $message->loadMissing(['sender', 'conversation', 'replyTo.sender']);
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

    /**
     * Resolve the attachment's URL at read time — the DB holds the RAW storage
     * path, and a cloud disk's signed URL would expire if it were persisted.
     */
    public function getAttachmentUrlAttribute(): ?string
    {
        $raw = $this->getRawOriginal('attachment_path');

        return $raw ? StorageService::url($raw) : null;
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * The message this one is quoting, if any. Nullable — the parent may have
     * been deleted (nullOnDelete), in which case the quote resolves to null.
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }
}
