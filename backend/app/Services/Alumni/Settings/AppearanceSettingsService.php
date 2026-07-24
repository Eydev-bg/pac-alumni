<?php

namespace App\Services\Alumni\Settings;

use App\Enums\ThemePreference;
use App\Exceptions\DomainException;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Read/write the alumni's appearance (theme) preference.
 *
 * The theme lives inside the alumni_profiles.preferences JSON column. A missing
 * key resolves to the SYSTEM default, so a user who has never chosen a theme
 * follows their OS setting.
 */
class AppearanceSettingsService
{
    /**
     * Current theme preference, defaulting to SYSTEM when unset.
     */
    public function get(User $user): array
    {
        $profile = $user->alumniProfile;

        if (!$profile) {
            throw DomainException::notFound('Alumni profile not found.');
        }

        return [
            'theme' => $profile->preferences['theme'] ?? ThemePreference::SYSTEM->value,
        ];
    }

    /**
     * Persist the chosen theme, merging into the existing preferences so other
     * (future) preference keys are never destroyed.
     */
    public function update(User $user, ThemePreference $theme): array
    {
        $profile = $user->alumniProfile;

        if (!$profile) {
            throw DomainException::notFound('Alumni profile not found.');
        }

        return DB::transaction(function () use ($profile, $theme) {
            $prefs = $profile->preferences ?? [];
            $prefs['theme'] = $theme->value;
            $profile->update(['preferences' => $prefs]);

            return ['theme' => $theme->value];
        });
    }
}
