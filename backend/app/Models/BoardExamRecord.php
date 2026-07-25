<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/BoardExamRecord.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Enums\BoardStatus;
use App\Services\StorageService;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoardExamRecord extends Model
{
    protected $fillable = [
        'graduate_id',
        'exam_name',
        'exam_year',
        'status',
        'is_current',
        'proof_file',
        'updated_by_alumni',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => BoardStatus::class,
            'exam_year' => 'integer',
            'is_current' => 'boolean',
            'updated_by_alumni' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    /**
     * Resolve the stored proof-file path to a servable URL at read time.
     * Mirrors User::profilePicture — see that accessor for the case breakdown.
     */
    protected function proofFile(): Attribute
    {
        return Attribute::make(
            get: function (?string $value) {
                if (!$value) return null;
                if (str_starts_with($value, 'http')) return $value;
                if (str_starts_with($value, '/storage/')) {
                    if (StorageService::diskName() !== 'public') {
                        return StorageService::url(substr($value, strlen('/storage/')));
                    }
                    return $value;
                }
                return StorageService::url($value);
            },
        );
    }

    public function graduate(): BelongsTo
    {
        return $this->belongsTo(Graduate::class);
    }

    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
