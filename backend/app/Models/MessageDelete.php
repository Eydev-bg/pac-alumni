<?php

// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/MessageDelete.php
// ═══════════════════════════════════════════════════════════
//
//  A single "remove for you": user {user_id} has hidden message
//  {message_id} from their own view only. The message row is untouched
//  and the other participant still sees it — contrast with unsent_at on
//  messages, which removes it for both sides.
//
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageDelete extends Model
{
    protected $fillable = [
        'message_id',
        'user_id',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
