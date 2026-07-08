<?php

namespace App\Models;

use App\Enums\AchievementType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AchievementFeed extends Model
{
    protected $fillable = [
        'alumni_profile_id',
        'type',
        'title',
        'description',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'type' => AchievementType::class,
            'is_public' => 'boolean',
        ];
    }

    public function alumniProfile(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class);
    }

    /** Only achievements the alumni has chosen to keep visible. */
    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    // ─── Auto-generation helpers ─────────────────────────────
    // Mirrors the static ::log() convention used by ProfileActivityLog
    // and EmploymentStatusHistory so call sites stay one-liners.

    /**
     * Base recorder. When $unique is true, skips creation if an entry of the
     * same type already exists for the alumni (used for once-only milestones).
     */
    public static function record(
        int $alumniProfileId,
        AchievementType $type,
        string $title,
        ?string $description = null,
        bool $unique = false,
    ): ?self {
        if ($unique && static::where('alumni_profile_id', $alumniProfileId)->where('type', $type->value)->exists()) {
            return null;
        }

        return static::create([
            'alumni_profile_id' => $alumniProfileId,
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'is_public' => true,
        ]);
    }

    /** "[Name] is now working as [Position] at [Company]" */
    public static function recordEmployment(AlumniProfile $profile, EmploymentRecord $record, string $name): ?self
    {
        return static::record(
            $profile->id,
            AchievementType::EMPLOYMENT_UPDATE,
            "{$name} is now working as {$record->job_title} at {$record->company_name}.",
        );
    }

    /** "[Name] passed the [Exam Name]!" */
    public static function recordBoardPassed(AlumniProfile $profile, BoardExamRecord $record, string $name): ?self
    {
        return static::record(
            $profile->id,
            AchievementType::BOARD_EXAM_PASSED,
            "{$name} passed the {$record->exam_name}!",
        );
    }

    /** "[Name] joined the PAC alumni network" — fired once at registration. */
    public static function recordRegistration(AlumniProfile $profile, string $name): ?self
    {
        return static::record(
            $profile->id,
            AchievementType::NEW_REGISTRATION,
            "{$name} joined the PAC alumni network.",
            null,
            unique: true,
        );
    }

    /**
     * Record a "profile completed" achievement the first time the alumni's
     * profile reaches 100% completion. Safe to call from any flow that edits
     * profile data — the once-only guard prevents duplicates.
     */
    public static function maybeRecordProfileCompleted(AlumniProfile $profile): ?self
    {
        if (!static::isProfileComplete($profile)) {
            return null;
        }

        $name = $profile->user?->full_name ?? 'An alumnus';

        return static::record(
            $profile->id,
            AchievementType::PROFILE_COMPLETED,
            "{$name} completed their alumni profile.",
            null,
            unique: true,
        );
    }

    /**
     * Whether the alumni's profile is 100% complete. Delegates to
     * ProfileCompletionService so the criteria live in exactly one place
     * (shared with the GET /alumni/profile/completion endpoint).
     */
    public static function isProfileComplete(AlumniProfile $profile): bool
    {
        return app(\App\Services\Alumni\ProfileCompletionService::class)->isComplete($profile);
    }
}
