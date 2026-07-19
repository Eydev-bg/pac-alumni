<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Services/Alumni/BoardExamService.php
//  Handles board exam operations for alumni:
//  - Get board exam data (status, records, course info)
//  - Submit/update board exam result
//  - Upload proof document
//  - Auto-trigger notifications to Admins
// ═══════════════════════════════════════════════════════════

namespace App\Services\Alumni;

use App\Enums\BoardStatus;
use App\Enums\UserRole;
use App\Models\AchievementFeed;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\Course;
use App\Models\Notification;
use App\Models\ProfileActivityLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BoardExamService
{
    /**
     * Get board exam data for the authenticated alumni.
     * Returns course info, current status, and exam history.
     */
    public function getBoardExamData(User $user): array
    {
        $profile = AlumniProfile::where('user_id', $user->id)
            ->with(['graduate.course.department'])
            ->first();

        if (!$profile || !$profile->graduate) {
            throw new \Exception('Alumni profile not found.', 404);
        }

        $graduate = $profile->graduate;
        $course = $graduate->course;

        // Check if this is a board program
        if (!$course || !$course->is_board_program) {
            throw new \Exception('Your course is not a board exam program.', 403);
        }

        // Get all board exam records for this graduate
        $records = BoardExamRecord::where('graduate_id', $graduate->id)
            ->orderBy('exam_year', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'exam_name' => $r->exam_name,
                'exam_year' => $r->exam_year,
                'status' => $r->status->value,
                'status_label' => $r->status->label(),
                'is_current' => $r->is_current,
                'proof_file' => $r->proof_file,
                'updated_by_alumni' => $r->updated_by_alumni,
                'verified_at' => $r->verified_at?->toISOString(),
                'created_at' => $r->created_at?->toISOString(),
            ]);

        return [
            'course' => [
                'name' => $course->name,
                'code' => $course->code,
                'board_exam_name' => $course->board_exam_name,
            ],
            'current_status' => [
                'board_status' => $profile->board_status?->value,
                'board_label' => $profile->board_status?->label(),
            ],
            'records' => $records,
            'can_submit' => true, // Alumni can always submit/update
        ];
    }

    /**
     * Submit or update a board exam result.
     * Also updates the alumni_profiles.board_status accordingly.
     * Triggers notifications to Admins.
     */
    public function submitBoardExam(User $user, array $data, ?UploadedFile $proofFile = null): array
    {
        return DB::transaction(function () use ($user, $data, $proofFile) {
            $profile = AlumniProfile::where('user_id', $user->id)
                ->with(['graduate.course.department'])
                ->first();

            if (!$profile || !$profile->graduate) {
                throw new \Exception('Alumni profile not found.', 404);
            }

            $graduate = $profile->graduate;
            $course = $graduate->course;

            if (!$course || !$course->is_board_program) {
                throw new \Exception('Your course is not a board exam program.', 403);
            }

            // ─── Handle proof file upload ────────────────────
            $proofPath = null;
            if ($proofFile) {
                $filename = 'board_exam_proofs/' . $user->uuid . '_' . time() . '.' . $proofFile->getClientOriginalExtension();
                $proofFile->storeAs('', $filename, 'public');
                $proofPath = '/storage/' . $filename;
            }

            // ─── Append-and-supersede (Phase 3.4) ────────────
            // Every attempt is kept as history. Demote any existing records
            // for this graduate, then create the new one as the current record.
            BoardExamRecord::where('graduate_id', $graduate->id)
                ->update(['is_current' => false]);

            // ─── Create board exam record ────────────────────
            $record = BoardExamRecord::create([
                'graduate_id' => $graduate->id,
                'exam_name' => $course->board_exam_name ?? $course->name . ' Board Exam',
                'exam_year' => $data['exam_year'],
                'status' => $data['status'],
                'is_current' => true,
                'proof_file' => $proofPath,
                'updated_by_alumni' => true,
            ]);

            // ─── Update alumni_profiles.board_status ─────────
            // Alumni can only submit 'passed', so the profile always maps to
            // the canonical PASSED value. (Append/supersede is_current logic
            // is deferred to Phase 3.4.)
            $newBoardStatus = BoardStatus::PASSED;

            $oldStatus = $profile->board_status?->value;
            $profile->update(['board_status' => $newBoardStatus]);

            // ─── Log profile activity ────────────────────────
            ProfileActivityLog::log(
                $graduate->id,
                $user->id,
                'updated_board_exam',
                "Alumni submitted board exam result: {$record->status->label()} ({$data['exam_year']})",
                [
                    'status' => $data['status'],
                    'exam_year' => $data['exam_year'],
                    'previous_board_status' => $oldStatus ?? $profile->board_status?->value,
                    'new_board_status' => $newBoardStatus->value,
                ]
            );

            // ─── Phase 4.1: Track profile activity for reminders ──
            $user->update(['last_profile_update_at' => now()]);

            // ─── Feature 12: Auto-trigger Notifications ──────
            $this->notifyAdmins($user, $graduate, $course, $record);

            // ─── Phase 3.1: Achievement feed entries ─────────
            if ($data['status'] === 'passed') {
                AchievementFeed::recordBoardPassed($profile, $record, $user->full_name);
            }
            AchievementFeed::maybeRecordProfileCompleted($profile);

            return [
                'record' => [
                    'id' => $record->id,
                    'exam_name' => $record->exam_name,
                    'exam_year' => $record->exam_year,
                    'status' => $record->status->value,
                    'status_label' => $record->status->label(),
                    'proof_file' => $record->proof_file,
                    'created_at' => $record->created_at?->toISOString(),
                ],
                'updated_board_status' => $newBoardStatus->value,
                'updated_board_label' => $newBoardStatus->label(),
            ];
        });
    }

    /**
     * Feature 12: Notify Admins about board exam update.
     */
    private function notifyAdmins(User $alumni, $graduate, Course $course, BoardExamRecord $record): void
    {
        $title = 'Board Exam Update';
        $message = "{$alumni->full_name} ({$course->code} - Batch {$graduate->graduation_year}) "
            . "submitted board exam result: {$record->status->label()} for {$record->exam_name} ({$record->exam_year}).";

        $notificationData = [
            'type' => 'board_exam_update',
            'alumni_name' => $alumni->full_name,
            'course_code' => $course->code,
            'graduation_year' => $graduate->graduation_year,
            'exam_name' => $record->exam_name,
            'exam_year' => $record->exam_year,
            'exam_status' => $record->status->value,
            'graduate_id' => $graduate->id,
        ];

        // ─── Notify all Admins ───────────────────────────
        $admins = User::where('role', UserRole::ADMIN)
            ->where('status', 'active')
            ->pluck('id');

        foreach ($admins as $adminId) {
            Notification::create([
                'user_id' => $adminId,
                'type' => 'board_exam_update',
                'title' => $title,
                'message' => $message,
                'data' => $notificationData,
            ]);
        }
    }
}
