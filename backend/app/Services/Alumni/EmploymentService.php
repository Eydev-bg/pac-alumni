<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Services/Alumni/EmploymentService.php
//  MODIFIED: Added EmploymentStatusHistory::log() calls
//  after each $profile->update() to track status transitions.
//
//  CHANGES: 2 lines added (lines 116 and 162 below)
//  IMPORT:  1 use statement added (line 11 below)
// ═══════════════════════════════════════════════════════════

namespace App\Services\Alumni;

use App\Enums\EmploymentStatus;
use App\Enums\EmploymentType;
use App\Enums\UserRole;
use App\Models\AchievementFeed;
use App\Models\AlumniProfile;
use App\Models\EmploymentRecord;
use App\Models\EmploymentStatusHistory;  // ← ADDED
use App\Models\Notification;
use App\Models\ProfileActivityLog;
use App\Models\User;
use App\Services\Admin\DashboardCacheService;
use Illuminate\Support\Facades\DB;

class EmploymentService
{
    public function __construct(
        protected DashboardCacheService $dashboardCache,
    ) {}

    /**
     * Get employment data for the authenticated alumni.
     */
    public function getEmploymentData(User $user): array
    {
        $profile = AlumniProfile::where('user_id', $user->id)
            ->with(['graduate.course.department'])
            ->first();

        if (!$profile || !$profile->graduate) {
            throw \App\Exceptions\DomainException::notFound('Alumni profile not found.');
        }

        $graduate = $profile->graduate;

        // Get all employment records
        $records = EmploymentRecord::where('graduate_id', $graduate->id)
            ->orderBy('is_current', 'desc')
            ->orderBy('start_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'company_name' => $r->company_name,
                'job_title' => $r->job_title,
                'industry' => $r->industry,
                'employment_type' => $r->employment_type->value,
                'employment_type_label' => $r->employment_type->label(),
                'start_date' => $r->start_date?->toDateString(),
                'end_date' => $r->end_date?->toDateString(),
                'is_current' => $r->is_current,
                'created_at' => $r->created_at?->toISOString(),
            ]);

        // Get current job (if any)
        $currentJob = $records->firstWhere('is_current', true);

        return [
            'current_status' => [
                'employment_status' => $profile->employment_status?->value,
                'employment_label' => $profile->employment_status?->label(),
            ],
            'current_job' => $currentJob,
            'records' => $records,
            'industries' => self::getIndustryOptions(),
        ];
    }

    /**
     * Submit employment update.
     * If employed: creates new record, marks previous as not current.
     * If unemployed: marks all records as not current, updates status.
     */
    public function submitEmployment(User $user, array $data): array
    {
        $result = DB::transaction(function () use ($user, $data) {
            $profile = AlumniProfile::where('user_id', $user->id)
                ->with(['graduate.course.department'])
                ->first();

            if (!$profile || !$profile->graduate) {
                throw \App\Exceptions\DomainException::notFound('Alumni profile not found.');
            }

            $graduate = $profile->graduate;
            $oldStatus = $profile->employment_status?->value;

            // ─── Phase 4.1: Track profile activity for reminders ──
            $user->update(['last_profile_update_at' => now()]);

            if ($data['employment_status'] === 'employed') {
                // ─── Mark previous records as not current ────
                EmploymentRecord::where('graduate_id', $graduate->id)
                    ->where('is_current', true)
                    ->update([
                        'is_current' => false,
                        'end_date' => now()->toDateString(),
                    ]);

                // ─── Create new employment record ────────────
                $record = EmploymentRecord::create([
                    'graduate_id' => $graduate->id,
                    'company_name' => $data['company_name'],
                    'job_title' => $data['job_title'],
                    'industry' => $data['industry'],
                    'employment_type' => $data['employment_type'],
                    'start_date' => $data['start_date'] ?? now()->toDateString(),
                    'is_current' => true,
                ]);

                // ─── Update alumni profile status ────────────
                $profile->update(['employment_status' => EmploymentStatus::EMPLOYED]);

                // ─── Log status transition for trend tracking ── ADDED
                EmploymentStatusHistory::log($graduate->id, $oldStatus, 'employed', $user->id);

                // ─── Log activity ────────────────────────────
                ProfileActivityLog::log(
                    $graduate->id,
                    $user->id,
                    'updated_employment',
                    "Alumni updated employment: {$data['job_title']} at {$data['company_name']}",
                    [
                        'previous_status' => $oldStatus,
                        'new_status' => 'employed',
                        'company_name' => $data['company_name'],
                        'job_title' => $data['job_title'],
                        'industry' => $data['industry'],
                        'employment_type' => $data['employment_type'],
                    ]
                );

                // ─── Auto-trigger notifications ──
                $this->notifyAdmins($user, $graduate, $profile, 'employed', $record);

                // ─── Phase 3.1: Achievement feed entries ─────
                AchievementFeed::recordEmployment($profile, $record, $user->full_name);
                AchievementFeed::maybeRecordProfileCompleted($profile);

                return [
                    'employment_status' => 'employed',
                    'employment_label' => EmploymentStatus::EMPLOYED->label(),
                    'record' => [
                        'id' => $record->id,
                        'company_name' => $record->company_name,
                        'job_title' => $record->job_title,
                        'industry' => $record->industry,
                        'employment_type' => $record->employment_type->value,
                        'employment_type_label' => $record->employment_type->label(),
                        'start_date' => $record->start_date?->toDateString(),
                        'is_current' => true,
                    ],
                ];
            } else {
                // ─── Unemployed: mark all as not current ─────
                EmploymentRecord::where('graduate_id', $graduate->id)
                    ->where('is_current', true)
                    ->update([
                        'is_current' => false,
                        'end_date' => now()->toDateString(),
                    ]);

                $profile->update(['employment_status' => EmploymentStatus::UNEMPLOYED]);

                // ─── Log status transition for trend tracking ── ADDED
                EmploymentStatusHistory::log($graduate->id, $oldStatus, 'unemployed', $user->id);

                // ─── Log activity ────────────────────────────
                ProfileActivityLog::log(
                    $graduate->id,
                    $user->id,
                    'updated_employment',
                    'Alumni marked status as unemployed.',
                    [
                        'previous_status' => $oldStatus,
                        'new_status' => 'unemployed',
                    ]
                );

                // ─── Notify ──────────────────────────────────
                $this->notifyAdmins($user, $graduate, $profile, 'unemployed', null);

                return [
                    'employment_status' => 'unemployed',
                    'employment_label' => EmploymentStatus::UNEMPLOYED->label(),
                    'record' => null,
                ];
            }
        });

        // Alumni employment changes feed the admin dashboard aggregates
        // (employment_rate, employed_count, employment_type_breakdown), which
        // are served from a short-TTL cache. Invalidate AFTER the transaction
        // commits so a rolled-back write never clears a still-accurate cache.
        $this->dashboardCache->flush();

        return $result;
    }

    /**
     * Notify Admins about employment update.
     */
    private function notifyAdmins(User $alumni, $graduate, AlumniProfile $profile, string $status, ?EmploymentRecord $record): void
    {
        $course = $graduate->course;
        $courseCode = $course?->code ?? 'N/A';

        if ($status === 'employed' && $record) {
            $message = "{$alumni->full_name} ({$courseCode} - Batch {$graduate->graduation_year}) "
                . "updated employment: {$record->job_title} at {$record->company_name} ({$record->employment_type->label()}).";
        } else {
            $message = "{$alumni->full_name} ({$courseCode} - Batch {$graduate->graduation_year}) "
                . "marked their employment status as Unemployed.";
        }

        $notificationData = [
            'type' => 'employment_update',
            'alumni_name' => $alumni->full_name,
            'course_code' => $courseCode,
            'graduation_year' => $graduate->graduation_year,
            'employment_status' => $status,
            'company_name' => $record?->company_name,
            'job_title' => $record?->job_title,
            'graduate_id' => $graduate->id,
        ];

        // ─── Notify all Admins ───────────────────────────
        $admins = User::where('role', UserRole::ADMIN)
            ->where('status', 'active')
            ->pluck('id');

        foreach ($admins as $adminId) {
            Notification::create([
                'user_id' => $adminId,
                'type' => 'employment_update',
                'title' => 'Employment Update',
                'message' => $message,
                'data' => $notificationData,
            ]);
        }
    }

    /**
     * Common industry options for the dropdown.
     */
    public static function getIndustryOptions(): array
    {
        return [
            'Information Technology',
            'Healthcare / Medical',
            'Education / Teaching',
            'Engineering',
            'Business / Finance',
            'Government / Public Service',
            'Hospitality / Tourism',
            'Manufacturing',
            'Agriculture / Fisheries',
            'Retail / Sales',
            'Construction / Real Estate',
            'Media / Communications',
            'Legal Services',
            'Transportation / Logistics',
            'BPO / Call Center',
            'Non-profit / NGO',
            'Freelance / Gig Economy',
            'Other',
        ];
    }
}
