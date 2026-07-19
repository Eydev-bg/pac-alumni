<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/BoardExamRecord.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Enums\BoardStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoardExamRecord extends Model
{
    protected $fillable = [
        'graduate_id',
        'exam_name',
        'exam_year',
        'status',
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
            'updated_by_alumni' => 'boolean',
            'verified_at' => 'datetime',
        ];
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
