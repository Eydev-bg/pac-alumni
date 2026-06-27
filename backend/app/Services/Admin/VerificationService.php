<?php

namespace App\Services\Admin;

use App\Enums\BlacklistIdentifierType;
use App\Enums\BoardStatus;
use App\Enums\EducationLevel;
use App\Enums\EmploymentStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\AlumniProfile;
use App\Models\Graduate;
use App\Models\RegistrationBlacklist;
use App\Models\RegistrationSetting;
use App\Models\User;
use App\Models\VerificationLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VerificationService
{
    /**
     * Auto-verify alumni registration against graduate master list.
     *
     * UPDATED MATCHING LOGIC:
     *   1. Alumni ID  → lookup in graduates.alumni_id_number
     *   2. First Name + Last Name → must match the found graduate record
     *
     * SECURITY: This is the core registration logic.
     */
    public function verifyAndRegister(array $data, string $ip): array
    {
        // ─── Step 1: Check if registration is open ───────
        $settings = RegistrationSetting::getSettings();
        if (!$settings->isCurrentlyOpen()) {
            throw new \Exception('Registration is currently closed.', 403);
        }

        // ─── Step 2: Check blacklist ─────────────────────
        if (RegistrationBlacklist::isBlacklisted($ip, BlacklistIdentifierType::IP)) {
            throw new \Exception('Your access has been restricted. Please contact the administrator.', 403);
        }

        if (RegistrationBlacklist::isBlacklisted($data['alumni_id'], BlacklistIdentifierType::ALUMNI_ID)) {
            throw new \Exception('This Alumni ID has been blocked. Please contact the administrator.', 403);
        }

        // ─── Step 3: Check if email already registered ───
        if (User::where('email', $data['email'])->exists()) {
            $this->logRejection($data, $ip, 'Email already registered in the system.');
            throw new \Exception('This email is already registered.', 422);
        }

        // ─── Step 4: Match Alumni ID against graduate master list ──
        $graduate = Graduate::where('alumni_id_number', $data['alumni_id'])
            ->where('education_level', EducationLevel::COLLEGE)
            ->first();

        if (!$graduate) {
            $this->logRejection($data, $ip, 'Alumni ID not found in college graduate records.');
            $this->checkAutoBlacklist($ip, $data['alumni_id']);
            throw new \Exception('Verification failed. Your Alumni ID was not found in our records.', 422);
        }

        // ─── Step 5: Verify name match ───────────────────
        $inputName = $this->normalizeName($data['first_name'] . ' ' . $data['last_name']);
        $recordName = $this->normalizeName($graduate->first_name . ' ' . $graduate->last_name);

        if ($inputName !== $recordName) {
            $this->logRejection($data, $ip, 'Name does not match graduate records.', $graduate->id);
            $this->checkAutoBlacklist($ip, $data['alumni_id']);
            throw new \Exception('Verification failed. The name provided does not match our records.', 422);
        }

        // ─── Step 6: Check if already has an account ─────
        if ($graduate->user_id) {
            $this->logRejection($data, $ip, 'Graduate already has a linked alumni account.', $graduate->id);
            throw new \Exception('An alumni account already exists for this graduate record.', 422);
        }

        // ─── Step 7: All checks passed — create account ─
        return DB::transaction(function () use ($data, $graduate, $ip) {
            // Create user account
            $user = User::create([
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => UserRole::ALUMNI,
                'status' => UserStatus::ACTIVE,
                'first_name' => $graduate->first_name,
                'middle_name' => $graduate->middle_name,
                'last_name' => $graduate->last_name,
                'suffix' => $graduate->suffix,
                'email_verified_at' => now(),
            ]);

            // Link graduate to user
            $graduate->update(['user_id' => $user->id]);

            // Create alumni profile
            $department = $graduate->department;
            $boardStatus = ($department && $department->is_board_program)
                ? BoardStatus::NOT_TAKEN
                : BoardStatus::NOT_APPLICABLE;

            AlumniProfile::create([
                'user_id' => $user->id,
                'graduate_id' => $graduate->id,
                'employment_status' => EmploymentStatus::UNKNOWN,
                'board_status' => $boardStatus,
            ]);

            // Log success
            VerificationLog::create([
                'alumni_id_input' => $data['alumni_id'],
                'name_input' => $data['first_name'] . ' ' . $data['last_name'],
                'email_input' => $data['email'],
                'ip_address' => $ip,
                'status' => VerificationStatus::VERIFIED,
                'matched_graduate_id' => $graduate->id,
                'created_at' => now(),
            ]);

            return [
                'user' => $user,
                'graduate' => $graduate,
                'alumni_id' => $graduate->alumni_id_number,
            ];
        });
    }

    /**
     * Get verification statistics.
     */
    public function getStats(): array
    {
        $total = VerificationLog::count();
        $verified = VerificationLog::verified()->count();
        $rejected = VerificationLog::rejected()->count();
        $successRate = $total > 0 ? round(($verified / $total) * 100, 1) : 0;

        // Daily trend (last 30 days)
        $dailyTrend = VerificationLog::selectRaw("DATE(created_at) as date, status, COUNT(*) as count")
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(fn($group) => [
                'date' => $group->first()->date,
                'verified' => $group->where('status', VerificationStatus::VERIFIED)->sum('count'),
                'rejected' => $group->where('status', VerificationStatus::REJECTED)->sum('count'),
            ])
            ->values();

        return [
            'total_attempts' => $total,
            'verified_count' => $verified,
            'rejected_count' => $rejected,
            'success_rate' => $successRate,
            'daily_trend' => $dailyTrend,
        ];
    }

    // ─── Private Helpers ─────────────────────────────────

    private function normalizeName(string $name): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $name)));
    }

    private function logRejection(array $data, string $ip, string $reason, ?int $graduateId = null): void
    {
        VerificationLog::create([
            'alumni_id_input' => $data['alumni_id'],
            'name_input' => ($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''),
            'email_input' => $data['email'],
            'ip_address' => $ip,
            'status' => VerificationStatus::REJECTED,
            'matched_graduate_id' => $graduateId,
            'rejection_reason' => $reason,
            'created_at' => now(),
        ]);
    }

    /**
     * SECURITY: Auto-flag for blacklist if too many failed attempts.
     */
    private function checkAutoBlacklist(string $ip, string $alumniId): void
    {
        $recentIpFails = VerificationLog::where('ip_address', $ip)
            ->rejected()
            ->where('created_at', '>=', now()->subHours(1))
            ->count();

        // After 5 failed attempts from same IP in 1 hour, flag it
        // (Admin still needs to manually blacklist — this is just a threshold alert)
        if ($recentIpFails >= 5) {
            // TODO: Send notification to admin about suspicious activity
            // For now, this is just tracked in logs
        }
    }
}
