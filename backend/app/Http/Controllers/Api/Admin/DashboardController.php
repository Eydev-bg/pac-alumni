<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/DashboardController.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Enums\EducationLevel;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\Graduate;
use App\Models\LoginActivityLog;
use App\Models\User;
use App\Models\VerificationLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/dashboard
     * Aggregated dashboard data — single API call for the entire dashboard.
     */
    public function index(): JsonResponse
    {
        return $this->success([
            'stats' => $this->getStatsCards(),
            'graduates_per_year' => $this->getGraduatesPerYear(),
            'alumni_registrations_per_month' => $this->getAlumniRegistrationsPerMonth(),
            'latest_registered_alumni' => $this->getLatestRegisteredAlumni(),
            'recent_activity' => $this->getRecentActivity(),
        ], 'Dashboard data retrieved.');
    }

    /**
     * Stats Cards — top-level metrics
     */
    private function getStatsCards(): array
    {
        $totalGraduates = Graduate::count();
        $totalCollegeGrads = Graduate::where('education_level', EducationLevel::COLLEGE)->count();
        $registeredAlumni = User::where('role', 'alumni')->count();
        $activeAlumni = User::where('role', 'alumni')->where('status', 'active')->count();

        // Board passers
        $boardPassers = BoardExamRecord::where('status', 'passer')->distinct('graduate_id')->count('graduate_id');

        // Employment rate
        $totalProfiles = AlumniProfile::whereIn('employment_status', ['employed', 'unemployed'])->count();
        $employed = AlumniProfile::where('employment_status', 'employed')->count();
        $employmentRate = $totalProfiles > 0 ? round(($employed / $totalProfiles) * 100, 1) : 0;

        // Compared to last month
        $lastMonthAlumni = User::where('role', 'alumni')
            ->where('created_at', '>=', now()->subMonth()->startOfMonth())
            ->where('created_at', '<', now()->startOfMonth())
            ->count();
        $thisMonthAlumni = User::where('role', 'alumni')
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
        $alumniGrowth = $lastMonthAlumni > 0
            ? round((($thisMonthAlumni - $lastMonthAlumni) / $lastMonthAlumni) * 100, 1)
            : ($thisMonthAlumni > 0 ? 100 : 0);

        return [
            'total_graduates' => $totalGraduates,
            'total_college_graduates' => $totalCollegeGrads,
            'registered_alumni' => $registeredAlumni,
            'active_alumni' => $activeAlumni,
            'board_passers' => $boardPassers,
            'employment_rate' => $employmentRate,
            'employed_count' => $employed,
            'new_alumni_this_month' => $thisMonthAlumni,
            'alumni_growth_percent' => $alumniGrowth,
        ];
    }

    /**
     * Line Chart — Graduate count per year (all levels)
     */
    private function getGraduatesPerYear(): array
    {
        return Graduate::selectRaw('graduation_year as year, education_level as level, COUNT(*) as count')
            ->groupBy('graduation_year', 'education_level')
            ->orderBy('graduation_year')
            ->get()
            ->groupBy('year')
            ->map(function ($group, $year) {
                $row = ['year' => (int) $year];
                foreach ($group as $item) {
                    $row[$item->level] = $item->count;
                }
                return $row;
            })
            ->values()
            ->toArray();
    }

    /**
     * Line Chart — Alumni registrations per month (last 12 months)
     */
    private function getAlumniRegistrationsPerMonth(): array
    {
        $months = collect();
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months->push([
                'month' => $date->format('M Y'),
                'month_key' => $date->format('Y-m'),
            ]);
        }

        $registrations = User::where('role', 'alumni')
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month_key, COUNT(*) as count")
            ->groupBy('month_key')
            ->pluck('count', 'month_key');

        // Active users (logged in within the month)
        $activeUsers = LoginActivityLog::where('status', 'success')
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month_key, COUNT(DISTINCT user_id) as count")
            ->groupBy('month_key')
            ->pluck('count', 'month_key');

        return $months->map(fn($m) => [
            'month' => $m['month'],
            'registrations' => $registrations[$m['month_key']] ?? 0,
            'active_users' => $activeUsers[$m['month_key']] ?? 0,
        ])->toArray();
    }

    /**
     * Latest Registered Alumni — like "Latest New Members"
     */
    private function getLatestRegisteredAlumni(): array
    {
        return User::where('role', 'alumni')
            ->with(['alumniProfile.graduate.department:id,name,code'])
            ->orderBy('created_at', 'desc')
            ->limit(7)
            ->get()
            ->map(function ($user) {
                $graduate = $user->alumniProfile?->graduate;
                return [
                    'uuid' => $user->uuid,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'department' => $graduate?->department?->code,
                    'graduation_year' => $graduate?->graduation_year,
                    'registered_at' => $user->created_at?->toISOString(),
                    'initials' => strtoupper(substr($user->first_name, 0, 1) . substr($user->last_name, 0, 1)),
                ];
            })
            ->toArray();
    }

    /**
     * Recent Activity — latest verification attempts + login attempts
     */
    private function getRecentActivity(): array
    {
        // Latest verification attempts
        $verifications = VerificationLog::orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($v) => [
                'type' => 'verification',
                'title' => $v->status?->value === 'verified'
                    ? "{$v->name_input} registered successfully"
                    : "Registration rejected: {$v->name_input}",
                'status' => $v->status?->value ?? $v->attributes['status'] ?? 'unknown',
                'detail' => $v->rejection_reason ?: 'Auto-verified against graduate list',
                'ip' => $v->ip_address,
                'time' => $v->created_at?->toISOString(),
            ]);

        // Latest login attempts
        $logins = LoginActivityLog::with('user:id,first_name,last_name,email')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($l) => [
                'type' => 'login',
                'title' => $l->status->value === 'success'
                    ? ($l->user?->full_name ?? $l->email_attempted) . ' logged in'
                    : "Failed login: {$l->email_attempted}",
                'status' => $l->status->value,
                'detail' => $l->ip_address,
                'ip' => $l->ip_address,
                'time' => $l->created_at?->toISOString(),
            ]);

        // Merge and sort by time
        return $verifications->concat($logins)
            ->sortByDesc('time')
            ->values()
            ->take(8)
            ->toArray();
    }
}
