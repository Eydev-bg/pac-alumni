<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/AnnouncementRead.php
//  Phase 2 — Announcement Module
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnnouncementRead extends Model
{
    // Table only tracks read_at — no created_at/updated_at columns.
    public $timestamps = false;

    protected $fillable = [
        'announcement_id',
        'user_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
