<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Services/Alumni/AlumniService.php
//  Alumni service — dashboard + profile management.
//  Handles: dashboard data, profile updates, location,
//           profile picture upload/removal.
// ═══════════════════════════════════════════════════════════

namespace App\Services\Alumni;

use App\Models\AlumniProfile;
use App\Models\Notification;
use App\Models\ProfileActivityLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
            throw new \Exception('Alumni profile not found.', 404);
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
            throw new \Exception('Alumni profile not found.', 404);
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
                throw new \Exception('Alumni profile not found.', 404);
            }

            if (array_key_exists('current_location', $data)) {
                $oldLocation = $profile->current_location;
                $newLocation = $data['current_location'];

                if ($oldLocation !== $newLocation) {
                    $profile->update(['current_location' => $newLocation]);
                    $changes['current_location'] = ['from' => $oldLocation, 'to' => $newLocation];
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
            }

            return [
                'phone' => $user->fresh()->phone,
                'current_location' => $profile->fresh()->current_location,
                'changes_made' => !empty($changes),
            ];
        });
    }

    /**
     * Upload profile picture.
     * SECURITY: Stores in public disk with unique filename.
     */
    public function uploadProfilePicture(User $user, UploadedFile $file): array
    {
        return DB::transaction(function () use ($user, $file) {
            // Delete old picture if exists
            $this->deleteProfilePictureFile($user);

            // Generate unique filename
            $filename = 'profile_pictures/' . $user->uuid . '_' . time() . '.' . $file->getClientOriginalExtension();

            // Store the file
            $path = $file->storeAs('', $filename, 'public');

            // Update user record
            $user->update(['profile_picture' => '/storage/' . $path]);

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
     */
    private function deleteProfilePictureFile(User $user): void
    {
        if ($user->profile_picture) {
            $path = str_replace('/storage/', '', $user->profile_picture);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
