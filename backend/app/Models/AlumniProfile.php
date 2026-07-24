<?php

namespace App\Models;

use App\Enums\BoardStatus;
use App\Enums\EmploymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlumniProfile extends Model
{
    protected $fillable = [
        'user_id',
        'graduate_id',
        'current_location',
        'employment_status',
        'board_status',
        'is_directory_visible',
        'preferences',
    ];

    protected function casts(): array
    {
        return [
            'employment_status' => EmploymentStatus::class,
            'board_status' => BoardStatus::class,
            'is_directory_visible' => 'boolean',
            'preferences' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function graduate(): BelongsTo
    {
        return $this->belongsTo(Graduate::class);
    }
}
