<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/DashboardController.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Enums\BoardExamStatus;
use App\Enums\EducationLevel;
use App\Enums\EmploymentType;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\Course;
use App\Models\EmploymentRecord;
use App\Models\Graduate;
use App\Models\User;
use App\Services\Admin\DashboardCacheService;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

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
            'employment_type_breakdown' => $this->getEmploymentTypeBreakdown(),
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
     * Horizontal Bar Chart — current employment records grouped by type.
     * Iterates the EmploymentType enum's cases so any new type added to the
     * enum automatically appears; labels come from the enum (never hardcoded).
     * Ordered by count desc.
     */
    private function getEmploymentTypeBreakdown(): array
    {
        // Counts of current employment records keyed by the raw enum value.
        $counts = EmploymentRecord::where('is_current', true)
            ->selectRaw('employment_type, COUNT(*) as count')
            ->groupBy('employment_type')
            ->pluck('count', 'employment_type');

        return collect(EmploymentType::cases())
            ->map(fn (EmploymentType $type) => [
                'type' => $type->label(),
                'count' => (int) ($counts[$type->value] ?? 0),
            ])
            ->sortByDesc('count')
            ->values()
            ->toArray();
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
