<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/Event.php
//  Phase 2 — Event Module
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'admin_id',
        'title',
        'content',
        'image',
        'target_type',
        'target_value',
        'is_published',
        'is_pinned',
        'published_at',
        'archived_at',
        'start_datetime',
        'end_datetime',
        'location',
    ];

    protected function casts(): array
    {
        return [
            'is_published'   => 'boolean',
            'is_pinned'      => 'boolean',
            'published_at'   => 'datetime',
            'archived_at'    => 'datetime',
            'start_datetime' => 'datetime',
            'end_datetime'   => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────────
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(EventRsvp::class);
    }

    // ─── Query Scopes ────────────────────────────────────────
    public function scopePublished($query)
    {
        return $query->where('is_published', true)->whereNull('archived_at');
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('title', 'LIKE', "%{$search}%")
                ->orWhere('content', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Restrict to events targeted at a given alumni context.
     *
     * $context keys (any may be null): education_level, department_id,
     * course_id, graduation_year. An event matches when it targets
     * everyone, or its target_type/target_value matches the alumni.
     */
    public function scopeTargetedTo($query, array $context)
    {
        return $query->where(function ($q) use ($context) {
            $q->where('target_type', 'all');

            if (!empty($context['education_level'])) {
                $q->orWhere(fn ($s) => $s->where('target_type', 'education_level')
                    ->where('target_value', (string) $context['education_level']));
            }
            if (!empty($context['department_id'])) {
                $q->orWhere(fn ($s) => $s->where('target_type', 'department')
                    ->where('target_value', (string) $context['department_id']));
            }
            if (!empty($context['course_id'])) {
                $q->orWhere(fn ($s) => $s->where('target_type', 'course')
                    ->where('target_value', (string) $context['course_id']));
            }
            if (!empty($context['graduation_year'])) {
                $q->orWhere(fn ($s) => $s->where('target_type', 'batch')
                    ->where('target_value', (string) $context['graduation_year']));
            }
        });
    }
}
