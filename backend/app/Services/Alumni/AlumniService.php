<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Services/Alumni/AlumniService.php
//  Alumni service — dashboard + profile management.
//  Handles: dashboard data, profile updates, location,
//           profile picture upload/removal.
// ═══════════════════════════════════════════════════════════

namespace App\Services\Alumni;

use App\Models\AchievementFeed;
use App\Models\AlumniProfile;
use App\Models\Notification;
use App\Models\ProfileActivityLog;
use App\Models\User;
use App\Services\StorageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class AlumniService
{
    /**
     * Get dashboard summary for the authenticated alumni.
     */
    public function getDashboardData(User $user): array
    {
        $profile = AlumniProfile::where('user_id', $user->id)
            ->with(['graduate.course.department'])
            ->first();

        if (!$profile || !$profile->graduate) {
            throw \App\Exceptions\DomainException::notFound('Alumni profile not found.');
        }

        $graduate = $profile->graduate;
        $course = $graduate->course;
        $department = $course?->department;

        return [
            'personal' => [
                'full_name' => $user->full_name,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'suffix' => $user->suffix,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_picture' => $user->profile_picture,
            ],
            'academic' => [
                'alumni_id' => $graduate->alumni_id_number,
                'graduation_year' => $graduate->graduation_year,
                'education_level' => $graduate->education_level?->value,
                'course' => $course ? [
                    'id' => $course->id,
                    'name' => $course->name,
                    'code' => $course->code,
                    'is_board_program' => $course->is_board_program,
                ] : null,
                'department' => $department ? [
                    'id' => $department->id,
                    'name' => $department->name,
                    'code' => $department->code,
                ] : null,
            ],
            'status' => [
                'employment_status' => $profile->employment_status?->value,
                'employment_label' => $profile->employment_status?->label(),
                'board_status' => $profile->board_status?->value,
                'board_label' => $profile->board_status?->label(),
                'current_location' => $profile->current_location,
            ],
            'account' => [
                'member_since' => $user->created_at?->toISOString(),
                'last_login' => $user->last_login_at?->toISOString(),
            ],
        ];
    }

    /**
     * Get full profile data for the profile edit page.
     */
    public function getProfile(User $user): array
    {
        $profile = AlumniProfile::where('user_id', $user->id)
            ->with(['graduate.course.department'])
            ->first();

        if (!$profile || !$profile->graduate) {
            throw \App\Exceptions\DomainException::notFound('Alumni profile not found.');
        }

        $graduate = $profile->graduate;
        $course = $graduate->course;
        $department = $course?->department;

        return [
            'personal' => [
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'suffix' => $user->suffix,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_picture' => $user->profile_picture,
            ],
            'academic' => [
                'alumni_id' => $graduate->alumni_id_number,
                'graduation_year' => $graduate->graduation_year,
                'education_level' => $graduate->education_level?->value,
                'course_name' => $course?->name,
                'course_code' => $course?->code,
                'department_name' => $department?->name,
                'department_code' => $department?->code,
                'is_board_program' => $course?->is_board_program ?? false,
            ],
            'location' => [
                'current_location' => $profile->current_location,
            ],
            'status' => [
                'employment_status' => $profile->employment_status?->value,
                'employment_label' => $profile->employment_status?->label(),
                'board_status' => $profile->board_status?->value,
                'board_label' => $profile->board_status?->label(),
            ],
            'preferences' => [
                'is_directory_visible' => (bool) $profile->is_directory_visible,
            ],
        ];
    }

    /**
     * Update contact information (phone) and location.
     */
    public function updateProfile(User $user, array $data): array
    {
        return DB::transaction(function () use ($user, $data) {
            $changes = [];

            // ─── Update phone on users table ─────────────────
            if (array_key_exists('phone', $data)) {
                $oldPhone = $user->phone;
                $newPhone = $data['phone'];

                if ($oldPhone !== $newPhone) {
                    $user->update(['phone' => $newPhone]);
                    $changes['phone'] = ['from' => $oldPhone, 'to' => $newPhone];
                }
            }

            // ─── Update location on alumni_profiles table ────
            $profile = AlumniProfile::where('user_id', $user->id)->first();

            if (!$profile) {
                throw \App\Exceptions\DomainException::notFound('Alumni profile not found.');
            }

            if (array_key_exists('current_location', $data)) {
                $oldLocation = $profile->current_location;
                $newLocation = $data['current_location'];

                if ($oldLocation !== $newLocation) {
                    $profile->update(['current_location' => $newLocation]);
                    $changes['current_location'] = ['from' => $oldLocation, 'to' => $newLocation];
                }
            }

            // ─── Alumni Directory opt-out toggle ─────────────
            if (array_key_exists('is_directory_visible', $data)) {
                $oldVisible = (bool) $profile->is_directory_visible;
                $newVisible = filter_var($data['is_directory_visible'], FILTER_VALIDATE_BOOLEAN);

                if ($oldVisible !== $newVisible) {
                    $profile->update(['is_directory_visible' => $newVisible]);
                    $changes['is_directory_visible'] = ['from' => $oldVisible, 'to' => $newVisible];
                }
            }

            // ─── Log activity if anything changed ────────────
            if (!empty($changes)) {
                $graduate = $profile->graduate;

                if ($graduate) {
                    ProfileActivityLog::log(
                        $graduate->id,
                        $user->id,
                        'updated_profile',
                        'Alumni updated contact information.',
                        $changes
                    );
                }

                // ─── Phase 4.1: Track profile activity for reminders ──
                $user->update(['last_profile_update_at' => now()]);

                // ─── Phase 3.1: Profile-completion achievement ──
                AchievementFeed::maybeRecordProfileCompleted($profile);
            }

            $fresh = $profile->fresh();

            return [
                'phone' => $user->fresh()->phone,
                'current_location' => $fresh->current_location,
                'is_directory_visible' => (bool) $fresh->is_directory_visible,
                'changes_made' => !empty($changes),
            ];
        });
    }

    /**
     * Upload profile picture.
     * SECURITY: Stores on the configured upload disk with a unique filename.
     */
    public function uploadProfilePicture(User $user, UploadedFile $file): array
    {
        return DB::transaction(function () use ($user, $file) {
            // Delete old picture if exists
            $this->deleteProfilePictureFile($user);

            // Generate unique filename
            $filename = 'profile_pictures/' . $user->uuid . '_' . time() . '.' . $file->getClientOriginalExtension();

            // Store the file on the configured disk (local 'public' or cloud)
            $path = StorageService::store($file, $filename);

            // Persist the RAW storage path — the URL (which may be a short-lived
            // signed cloud URL) is resolved at read time by the model accessor.
            $user->update([
                'profile_picture' => $path,
                'last_profile_update_at' => now(),
            ]);

            // Log activity
            $profile = AlumniProfile::where('user_id', $user->id)->first();
            if ($profile?->graduate) {
                ProfileActivityLog::log(
                    $profile->graduate->id,
                    $user->id,
                    'updated_profile_picture',
                    'Alumni uploaded a new profile picture.',
                    null
                );

                // ─── Phase 3.1: Profile-completion achievement ──
                AchievementFeed::maybeRecordProfileCompleted($profile);
            }

            return [
                'profile_picture' => $user->fresh()->profile_picture,
            ];
        });
    }

    /**
     * Remove profile picture.
     */
    public function removeProfilePicture(User $user): void
    {
        DB::transaction(function () use ($user) {
            $this->deleteProfilePictureFile($user);
            $user->update(['profile_picture' => null]);

            $profile = AlumniProfile::where('user_id', $user->id)->first();
            if ($profile?->graduate) {
                ProfileActivityLog::log(
                    $profile->graduate->id,
                    $user->id,
                    'removed_profile_picture',
                    'Alumni removed their profile picture.',
                    null
                );
            }
        });
    }

    /**
     * Delete the physical profile picture file from storage.
     *
     * Reads the RAW stored value (not the accessor-resolved URL) so cloud
     * paths — which the accessor would turn into an un-parseable signed URL —
     * still delete correctly. StorageService handles both legacy /storage/
     * paths and new raw paths.
     */
    private function deleteProfilePictureFile(User $user): void
    {
        $stored = $user->getRawOriginal('profile_picture');
        if ($stored) {
            StorageService::delete($stored);
        }
    }
}
