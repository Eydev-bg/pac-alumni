<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Public/LandingStatsController.php
//  Public (no-auth) endpoint serving 4 safe aggregate stats for the
//  landing page. Reuses the calculation logic proven in
//  DashboardController::getStatsCards(), but duplicated inline so this
//  public controller stays independent of the admin service layer.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Public;

use App\Enums\BoardStatus;
use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\Course;
use App\Models\Graduate;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LandingStatsController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/landing/stats
     * Public landing-page statistics — 4 safe, non-sensitive aggregate
     * numbers (no PII, no auth). Cached for 1 hour so a public page load
     * never hits the DB directly.
     */
    public function __invoke(Request $request): JsonResponse
    {
        // Cache key bumped to _v2 so the old cached payload (without the new
        // employment context fields) is naturally bypassed.
        $stats = Cache::remember('landing_stats_v2', 3600, function () {
            // Verified alumni (registered users with the alumni role)
            $verifiedAlumni = User::where('role', 'alumni')->count();

            // Employment rate — same formula as DashboardController::getStatsCards()
            $totalProfiles = AlumniProfile::whereIn('employment_status', ['employed', 'unemployed'])->count();
            $employed = AlumniProfile::where('employment_status', 'employed')->count();
            $employmentRate = $totalProfiles > 0 ? round(($employed / $totalProfiles) * 100, 1) : 0;

            // Board passing rate — same distinctGraduateCount / board-program pattern
            $boardPassers = (int) BoardExamRecord::where('status', BoardStatus::PASSED->value)
                ->selectRaw('COUNT(DISTINCT graduate_id) as aggregate')
                ->value('aggregate');
            $boardProgramTotal = Graduate::whereIn('course_id', Course::boardPrograms()->pluck('id'))->count();
            $boardPassingRate = $boardProgramTotal > 0
                ? round(($boardPassers / $boardProgramTotal) * 100, 1)
                : 0;

            // Degree programs — active courses on offer
            $degreePrograms = Course::where('status', 'active')->count();

            return [
                'verified_alumni' => $verifiedAlumni,
                'employment_rate' => $employmentRate,
                'employment_known_count' => $totalProfiles,
                'employment_total_profiles' => AlumniProfile::count(),
                'board_passing_rate' => $boardPassingRate,
                'degree_programs' => $degreePrograms,
            ];
        });

        return $this->success($stats, 'Landing statistics retrieved.');
    }
}
