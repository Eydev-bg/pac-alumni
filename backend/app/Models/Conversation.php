<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = [
        'participant_one_id',
        'participant_two_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────────
    public function participantOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_one_id');
    }

    public function participantTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_two_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /** Most recent message — used for the inbox preview. */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    // ─── Scopes ──────────────────────────────────────────────
    /** Conversations the given user participates in. */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('participant_one_id', $userId)
                ->orWhere('participant_two_id', $userId);
        });
    }

    // ─── Helpers ─────────────────────────────────────────────
    /**
     * Find (or create) the single conversation between two users. Participant
     * ids are normalized (smaller first) so the pair maps to one row no matter
     * who initiates.
     */
    public static function firstOrCreateBetween(int $userIdA, int $userIdB): self
    {
        [$one, $two] = $userIdA < $userIdB ? [$userIdA, $userIdB] : [$userIdB, $userIdA];

        return static::firstOrCreate([
            'participant_one_id' => $one,
            'participant_two_id' => $two,
        ]);
    }

    /** Return the participant who is NOT the given user. */
    public function otherParticipant(int $userId): ?User
    {
        return $this->participant_one_id === $userId
            ? $this->participantTwo
            : $this->participantOne;
    }
}
