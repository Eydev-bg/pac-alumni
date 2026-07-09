<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/DashboardController.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Enums\BoardExamStatus;
use App\Enums\EducationLevel;
use App\Enums\EmploymentStatus;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\Course;
use App\Models\Graduate;
use App\Models\User;
use App\Services\Admin\DashboardCacheService;
use App\Support\SqlExpression;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DashboardCacheService $dashboardCache,
    ) {}

    /**
     * GET /api/admin/dashboard
     * Aggregated dashboard data — single API call for the entire dashboard.
     * Served from a short-TTL cache; invalidated on graduate imports/edits.
     */
    public function index(): JsonResponse
    {
        $data = $this->dashboardCache->remember(fn () => [
            'stats' => $this->getStatsCards(),
            'graduates_per_year' => $this->getGraduatesPerYear(),
            'alumni_registrations_per_month' => $this->getAlumniRegistrationsPerMonth(),
            'participation' => $this->getParticipationStats(),
        ]);

        return $this->success($data, 'Dashboard data retrieved.');
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

        // Alumni who logged in within the last 30 days
        $activeRecently = User::where('role', 'alumni')
            ->where('status', 'active')
            ->where('last_login_at', '>=', now()->subDays(30))
            ->count();

        // Alumni who have NOT logged in for 30+ days (matches the SendLoginReminder threshold)
        // Include those who never logged in (null last_login_at)
        $inactiveAlumni = User::where('role', 'alumni')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('last_login_at')
                      ->orWhere('last_login_at', '<', now()->subDays(30));
            })
            ->count();

        // Board passers (unique graduates)
        $boardPassers = $this->distinctGraduateCount(
            BoardExamRecord::where('status', BoardExamStatus::PASSER->value)
        );

        // Board exam failed (unique graduates). A graduate who has BOTH a passer
        // and a failed record counts as a passer only, so exclude any graduate
        // who also has a passer record. A correlated whereNotExists keeps the
        // passer ids in SQL instead of materialising them into PHP.
        $boardFailed = $this->distinctGraduateCount(
            BoardExamRecord::where('status', BoardExamStatus::FAILED->value)
                ->whereNotExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('board_exam_records as passers')
                        ->whereColumn('passers.graduate_id', 'board_exam_records.graduate_id')
                        ->where('passers.status', BoardExamStatus::PASSER->value);
                })
        );

        // Graduates in board program courses who have NO board exam record at all
        $boardProgramCourseIds = Course::boardPrograms()->pluck('id');
        $graduatesInBoardPrograms = Graduate::whereIn('course_id', $boardProgramCourseIds)->count();
        $graduatesWithBoardRecord = $this->distinctGraduateCount(BoardExamRecord::query());
        $boardNotYetTaken = max(0, $graduatesInBoardPrograms - $graduatesWithBoardRecord);

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
            'active_recently' => $activeRecently,
            'inactive_alumni' => $inactiveAlumni,
            'board_passers' => $boardPassers,
            'board_failed' => $boardFailed,
            'board_not_yet_taken' => $boardNotYetTaken,
            'board_program_total' => $graduatesInBoardPrograms,
            'board_passing_rate' => $graduatesInBoardPrograms > 0
                ? round(($boardPassers / $graduatesInBoardPrograms) * 100, 1)
                : 0,
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

        $monthKey = SqlExpression::monthKey('created_at');

        $registrations = User::where('role', 'alumni')
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("{$monthKey} as month_key, COUNT(*) as count")
            ->groupBy('month_key')
            ->pluck('count', 'month_key');

        return $months->map(fn($m) => [
            'month' => $m['month'],
            'registrations' => $registrations[$m['month_key']] ?? 0,
        ])->toArray();
    }

    /**
     * Alumni Participation — how well alumni are engaging / reporting data.
     * Surfaces the "low alumni participation" problem highlighted in tracer-study
     * literature. Computed entirely from existing tables/columns.
     */
    private function getParticipationStats(): array
    {
        $totalRegistered = User::where('role', 'alumni')->count();

        // Alumni who have reported a definite employment status (not "unknown")
        $employmentKnown = AlumniProfile::whereIn('employment_status', [
            EmploymentStatus::EMPLOYED->value,
            EmploymentStatus::UNEMPLOYED->value,
        ])->count();

        // Profile considered "complete": has a location AND a reported employment status
        $profileComplete = AlumniProfile::whereNotNull('current_location')
            ->where('current_location', '!=', '')
            ->where('employment_status', '!=', EmploymentStatus::UNKNOWN->value)
            ->count();

        // Divide-by-zero guarded percentage helper
        $rate = fn (int $count): float => $totalRegistered > 0
            ? round(($count / $totalRegistered) * 100, 1)
            : 0;

        return [
            'total_registered' => $totalRegistered,
            'employment_known' => $employmentKnown,
            'employment_known_rate' => $rate($employmentKnown),
            'profile_complete' => $profileComplete,
            'profile_complete_rate' => $rate($profileComplete),
        ];
    }

    /**
     * Count distinct graduates for a board-exam-record query using an explicit
     * COUNT(DISTINCT graduate_id). This is correct across driver versions,
     * unlike the fragile distinct('graduate_id')->count('graduate_id') form.
     */
    private function distinctGraduateCount(Builder $query): int
    {
        return (int) $query
            ->selectRaw('COUNT(DISTINCT graduate_id) as aggregate')
            ->value('aggregate');
    }
}
