<?php

namespace App\Models;

use App\Enums\EducationLevel;
use App\Enums\ImportStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportBatch extends Model
{
    protected $fillable = [
        'uploaded_by',
        'file_name',
        'education_level',
        'total_records',
        'imported_count',
        'duplicate_count',
        'error_count',
        'status',
        'error_details',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'education_level' => EducationLevel::class,
            'status' => ImportStatus::class,
            'error_details' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ─── Helpers ─────────────────────────────────────────
    public function markCompleted(): void
    {
        $this->update([
            'status' => ImportStatus::COMPLETED,
            'completed_at' => now(),
        ]);
    }

    public function markFailed(): void
    {
        $this->update([
            'status' => ImportStatus::FAILED,
            'completed_at' => now(),
        ]);
    }

    public function incrementImported(): void
    {
        $this->increment('imported_count');
    }

    public function incrementDuplicate(): void
    {
        $this->increment('duplicate_count');
    }

    public function incrementError(): void
    {
        $this->increment('error_count');
    }
}
