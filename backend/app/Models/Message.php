<?php

// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/Message.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Events\MessageSent;
use App\Services\StorageService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'unsent_at',
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
            'is_read'   => 'boolean',
            'read_at'   => 'datetime',
            'unsent_at' => 'datetime',
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

    /** True once the sender has unsent this message for everyone. */
    public function getIsUnsentAttribute(): bool
    {
        return $this->unsent_at !== null;
    }

    /** Per-user "remove for you" rows — see MessageDelete. */
    public function deletes(): HasMany
    {
        return $this->hasMany(MessageDelete::class);
    }

    // ─── Scopes ──────────────────────────────────────────────
    /**
     * Messages the given user has NOT hidden from their own view. Unsent
     * messages deliberately survive this filter — they still render, as the
     * "This message was unsent." placeholder.
     */
    public function scopeVisibleTo(Builder $query, int $userId): Builder
    {
        return $query->whereDoesntHave('deletes', fn ($q) => $q->where('user_id', $userId));
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
