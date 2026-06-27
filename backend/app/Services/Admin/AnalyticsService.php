<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Services/Admin/AnalyticsService.php
// ═══════════════════════════════════════════════════════════

namespace App\Services\Admin;

use App\Enums\BoardExamStatus;
use App\Enums\EducationLevel;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\EmploymentRecord;
use App\Models\Graduate;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Elementary Analytics (Feature 21) — Simple graduate counts per year
     * Same structure as JHS/SHS for consistency in Admin Analytics
     */
    public function elementary(?int $yearFrom = null, ?int $yearTo = null): array
    {
        return $this->getSimpleLevelAnalytics(EducationLevel::ELEMENTARY, $yearFrom, $yearTo);
    }

    /**
     * JHS Analytics (Feature 22) — Simplified: graduate counts per year
     */
    public function jhs(?int $yearFrom = null, ?int $yearTo = null): array
    {
        return $this->getSimpleLevelAnalytics(EducationLevel::JHS, $yearFrom, $yearTo);
    }

    /**
     * SHS Analytics (Feature 23) — Simplified: graduate counts per year
     */
    public function shs(?int $yearFrom = null, ?int $yearTo = null): array
    {
        return $this->getSimpleLevelAnalytics(EducationLevel::SHS, $yearFrom, $yearTo);
    }

    /**
     * College Analytics — Graduate Count (Feature 24)
     */
    public function collegeGraduates(?int $yearFrom = null, ?int $yearTo = null, ?int $departmentId = null, ?int $courseId = null): array
    {
        $query = Graduate::where('education_level', EducationLevel::COLLEGE);

        if ($yearFrom) $query->where('graduation_year', '>=', $yearFrom);
        if ($yearTo) $query->where('graduation_year', '<=', $yearTo);

        // Course filter takes priority over department filter
        if ($courseId) {
            $query->where('course_id', $courseId);
        } elseif ($departmentId) {
            $courseIds = \App\Models\Course::where('department_id', $departmentId)->pluck('id')->toArray();
            $query->where(function ($q) use ($departmentId, $courseIds) {
                $q->where('department_id', $departmentId);
                if (!empty($courseIds)) {
                    $q->orWhereIn('course_id', $courseIds);
                }
            });
        }

        $total = $query->count();

        $byYear = (clone $query)
            ->selectRaw('graduation_year, COUNT(*) as count')
            ->groupBy('graduation_year')
            ->orderBy('graduation_year', 'desc')
            ->get();

        // By department — get all college departments and count graduates for each
        $collegeDepts = \App\Models\Department::where('education_level', 'college')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $byDepartment = $collegeDepts->map(function ($dept) use ($yearFrom, $yearTo) {
            $courseIds = $dept->courses()->pluck('id')->toArray();
            $count = Graduate::where('education_level', EducationLevel::COLLEGE)
                ->when($yearFrom, fn($q) => $q->where('graduation_year', '>=', $yearFrom))
                ->when($yearTo, fn($q) => $q->where('graduation_year', '<=', $yearTo))
                ->where(function ($q) use ($dept, $courseIds) {
                    $q->where('department_id', $dept->id);
                    if (!empty($courseIds)) {
                        $q->orWhereIn('course_id', $courseIds);
                    }
                })
                ->count();

            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
                'count' => $count,
            ];
        })->filter(fn($d) => $d['count'] > 0)->sortByDesc('count')->values()->toArray();

        return [
            'total_graduates' => $total,
            'by_year' => $byYear,
            'by_department' => $byDepartment,
        ];
    }

    /**
     * College Analytics — Board Exam Tracking (Feature 25)
     */
    public function boardExams(?int $yearFrom = null, ?int $yearTo = null, ?int $departmentId = null): array
    {
        $query = BoardExamRecord::query()
            ->join('graduates', 'board_exam_records.graduate_id', '=', 'graduates.id');

        if ($yearFrom) $query->where('board_exam_records.exam_year', '>=', $yearFrom);
        if ($yearTo) $query->where('board_exam_records.exam_year', '<=', $yearTo);
        if ($departmentId) $query->where('graduates.department_id', $departmentId);

        $totalTakers = (clone $query)->count();
        $passers = (clone $query)->where('board_exam_records.status', BoardExamStatus::PASSER)->count();
        $failed = (clone $query)->where('board_exam_records.status', BoardExamStatus::FAILED)->count();
        $passingRate = $totalTakers > 0 ? round(($passers / $totalTakers) * 100, 1) : 0;

        // By department
        $byDepartment = BoardExamRecord::query()
            ->join('graduates', 'board_exam_records.graduate_id', '=', 'graduates.id')
            ->join('departments', 'graduates.department_id', '=', 'departments.id')
            ->when($yearFrom, fn($q) => $q->where('board_exam_records.exam_year', '>=', $yearFrom))
            ->when($yearTo, fn($q) => $q->where('board_exam_records.exam_year', '<=', $yearTo))
            ->selectRaw("
                departments.id as dept_id, departments.name as dept_name, departments.code as dept_code,
                COUNT(*) as total_takers,
                SUM(CASE WHEN board_exam_records.status = ? THEN 1 ELSE 0 END) as passers,
                SUM(CASE WHEN board_exam_records.status = ? THEN 1 ELSE 0 END) as failed
            ", [BoardExamStatus::PASSER->value, BoardExamStatus::FAILED->value])
            ->groupBy('departments.id', 'departments.name', 'departments.code')
            ->orderByDesc('passers')
            ->get()
            ->map(fn($row) => [
                'department_id' => $row->dept_id,
                'department_name' => $row->dept_name,
                'department_code' => $row->dept_code,
                'total_takers' => $row->total_takers,
                'passers' => (int) $row->passers,
                'failed' => (int) $row->failed,
                'passing_rate' => $row->total_takers > 0 ? round(($row->passers / $row->total_takers) * 100, 1) : 0,
            ]);

        // By year
        $byYear = BoardExamRecord::query()
            ->when($departmentId, fn($q) => $q->join('graduates', 'board_exam_records.graduate_id', '=', 'graduates.id')->where('graduates.department_id', $departmentId))
            ->selectRaw("
                exam_year,
                COUNT(*) as total_takers,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as passers,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed
            ", [BoardExamStatus::PASSER->value, BoardExamStatus::FAILED->value])
            ->groupBy('exam_year')
            ->orderBy('exam_year', 'desc')
            ->get();

        return [
            'total_takers' => $totalTakers,
            'passers' => $passers,
            'failed' => $failed,
            'passing_rate' => $passingRate,
            'by_department' => $byDepartment,
            'by_year' => $byYear,
        ];
    }

    /**
     * College Analytics — Employment Tracking (Feature 26)
     */
    public function employment(?int $yearFrom = null, ?int $yearTo = null, ?int $departmentId = null): array
    {
        $query = AlumniProfile::query()
            ->join('graduates', 'alumni_profiles.graduate_id', '=', 'graduates.id')
            ->where('graduates.education_level', EducationLevel::COLLEGE);

        if ($yearFrom) $query->where('graduates.graduation_year', '>=', $yearFrom);
        if ($yearTo) $query->where('graduates.graduation_year', '<=', $yearTo);
        if ($departmentId) $query->where('graduates.department_id', $departmentId);

        $total = (clone $query)->count();
        $employed = (clone $query)->where('alumni_profiles.employment_status', 'employed')->count();
        $unemployed = (clone $query)->where('alumni_profiles.employment_status', 'unemployed')->count();
        $unknown = (clone $query)->where('alumni_profiles.employment_status', 'unknown')->count();
        $employmentRate = ($total - $unknown) > 0 ? round(($employed / ($total - $unknown)) * 100, 1) : 0;

        // Employment type breakdown (from employment_records)
        $byType = EmploymentRecord::query()
            ->join('graduates', 'employment_records.graduate_id', '=', 'graduates.id')
            ->where('employment_records.is_current', true)
            ->when($yearFrom, fn($q) => $q->where('graduates.graduation_year', '>=', $yearFrom))
            ->when($yearTo, fn($q) => $q->where('graduates.graduation_year', '<=', $yearTo))
            ->when($departmentId, fn($q) => $q->where('graduates.department_id', $departmentId))
            ->selectRaw('employment_records.employment_type, COUNT(*) as count')
            ->groupBy('employment_records.employment_type')
            ->get();

        // By industry
        $byIndustry = EmploymentRecord::query()
            ->join('graduates', 'employment_records.graduate_id', '=', 'graduates.id')
            ->where('employment_records.is_current', true)
            ->when($yearFrom, fn($q) => $q->where('graduates.graduation_year', '>=', $yearFrom))
            ->when($yearTo, fn($q) => $q->where('graduates.graduation_year', '<=', $yearTo))
            ->when($departmentId, fn($q) => $q->where('graduates.department_id', $departmentId))
            ->selectRaw('employment_records.industry, COUNT(*) as count')
            ->groupBy('employment_records.industry')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return [
            'total_alumni' => $total,
            'employed' => $employed,
            'unemployed' => $unemployed,
            'unknown' => $unknown,
            'employment_rate' => $employmentRate,
            'by_type' => $byType,
            'by_industry' => $byIndustry,
        ];
    }

    /**
     * Combined overview for all levels.
     */
    public function overview(): array
    {
        $levels = ['elementary', 'jhs', 'shs', 'college'];
        $summary = [];

        foreach ($levels as $level) {
            $summary[$level] = [
                'total_graduates' => Graduate::where('education_level', $level)->count(),
            ];
        }

        return $summary;
    }

    // ─── Private Helpers ─────────────────────────────────

    /**
     * Simple level analytics — just graduate counts per year.
     * Used by JHS and SHS (no continuation tracking).
     */
    private function getSimpleLevelAnalytics(
        EducationLevel $level,
        ?int $yearFrom,
        ?int $yearTo
    ): array {
        $query = Graduate::where('education_level', $level);
        if ($yearFrom) $query->where('graduation_year', '>=', $yearFrom);
        if ($yearTo) $query->where('graduation_year', '<=', $yearTo);

        $totalGraduates = (clone $query)->count();

        $byYear = (clone $query)
            ->selectRaw('graduation_year as year, COUNT(*) as total_graduates')
            ->groupBy('graduation_year')
            ->orderBy('graduation_year', 'desc')
            ->get()
            ->toArray();

        return [
            'total_graduates' => $totalGraduates,
            'by_year'         => $byYear,
        ];
    }
}
