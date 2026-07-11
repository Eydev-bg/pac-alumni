<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/EventRsvp.php
//  Phase 2 — Event Module
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Enums\RsvpStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRsvp extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => RsvpStatus::class,
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
