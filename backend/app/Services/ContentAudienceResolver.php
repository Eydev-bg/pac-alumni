<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

/**
 * Resolves the alumni audience for bulk email-on-publish.
 *
 * This is the REVERSE of Event/Announcement::scopeTargetedTo: given a content
 * item's target_type/target_value, return the alumni users who should receive
 * the email. The two directions must stay consistent — anyone who can see the
 * item in-app must be in the email audience, and vice versa — so the matching
 * here mirrors AlumniEventService::contextFor() + scopeTargetedTo() exactly.
 */
class ContentAudienceResolver
{
    private const TARGETED_TYPES = ['education_level', 'department', 'course', 'batch'];

    /**
     * Resolve the alumni User models that should receive an email for a
     * content item with the given targeting. Returns a query builder (NOT
     * a collection) so the caller can chunk 20k+ users efficiently.
     */
    public function query(string $targetType, ?string $targetValue): Builder
    {
        if ($targetType === 'all') {
            // Mirrors the forward direction: alumni without a graduate record
            // still see 'all' content, so they receive 'all' emails too.
            return $this->baseAlumniQuery();
        }

        if (! in_array($targetType, self::TARGETED_TYPES, true)) {
            // Fail loud — silently falling through would email everyone.
            throw new InvalidArgumentException("Unknown content target_type [{$targetType}].");
        }

        if ($targetValue === null || $targetValue === '') {
            // A targeted item with no target_value matches nobody in the
            // forward scope; emailing anyone here would be a data bug.
            throw new InvalidArgumentException(
                "target_value is required for target_type [{$targetType}]."
            );
        }

        return $this->baseAlumniQuery()->whereHas(
            'alumniProfile.graduate',
            fn (Builder $graduate) => $this->constrainGraduate($graduate, $targetType, $targetValue)
        );
    }

    /**
     * Convenience: resolve audience for a Job Posting (always all alumni).
     */
    public function jobPostingQuery(): Builder
    {
        return $this->baseAlumniQuery();
    }

    /**
     * Active alumni with a usable email address — the floor for every audience.
     */
    private function baseAlumniQuery(): Builder
    {
        return User::query()
            ->active()
            ->byRole(UserRole::ALUMNI)
            ->whereNotNull('email')
            ->where('email', '!=', '');
    }

    /**
     * Apply the targeting constraint on the graduates query, matching the
     * context AlumniEventService::contextFor() feeds into scopeTargetedTo.
     */
    private function constrainGraduate(Builder $graduate, string $targetType, string $targetValue): void
    {
        match ($targetType) {
            'education_level' => $graduate->where('education_level', $targetValue),
            'course' => $graduate->where('course_id', $targetValue),
            'batch' => $graduate->where('graduation_year', $targetValue),
            // contextFor resolves the alumni's department as
            // course->department_id ?? graduate->department_id: the course's
            // department wins whenever a course is set (college graduates),
            // and the direct column only applies when there is no course
            // (elementary/JHS/SHS graduates). Mirror that exactly.
            'department' => $graduate->where(function (Builder $q) use ($targetValue) {
                $q->whereHas('course', fn (Builder $c) => $c->where('department_id', $targetValue))
                    ->orWhere(fn (Builder $direct) => $direct
                        ->whereDoesntHave('course')
                        ->where('department_id', $targetValue));
            }),
        };
    }
}
