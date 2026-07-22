<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Services/Alumni/DirectoryService.php
//  Alumni Directory (Phase B) — alumni-facing, privacy-scrubbed
//  listing of fellow alumni.
//
//  Mirrors the admin Graduate list stack (GraduateService::list →
//  GraduateRepository::filteredQuery) but is DRIVEN FROM `User`
//  (role=alumni, active) and scoped to directory-visible profiles.
//  Board-status filtering copies the SOURCE-OF-TRUTH logic from
//  GraduateRepository (course.is_board_program + a passed
//  board_exam_record), never the derived alumni_profiles.board_status
//  column (which never persists `not_taken`).
// ═══════════════════════════════════════════════════════════

namespace App\Services\Alumni;

use App\Enums\BoardStatus;
use App\Enums\EducationLevel;
use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Department;
use App\Models\Graduate;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class DirectoryService
{
    /**
     * Relations eager-loaded (column-scoped) for the list cards. FK columns are
     * kept in each select so the belongsTo/hasOne chains resolve. Employment is
     * constrained to the current record only.
     */
    private const CARD_EAGER = [
        'alumniProfile:id,user_id,graduate_id,employment_status,current_location',
        'alumniProfile.graduate:id,first_name,middle_name,last_name,suffix,graduation_year,course_id,department_id',
        'alumniProfile.graduate.course:id,name,code,department_id',
        'alumniProfile.graduate.course.department:id,name',
    ];

    /**
     * Paginated, searchable, filterable directory of fellow alumni.
     *
     * @param int $excludeUserId The requesting alumni's own id — hidden from the list.
     */
    public function list(
        int $excludeUserId,
        int $perPage = 15,
        ?string $search = null,
        ?int $graduationYear = null,
        ?int $departmentId = null,
        ?int $courseId = null,
        ?string $employmentStatus = null,
        ?string $boardStatus = null,
        string $sortBy = 'name',
        string $sortDir = 'asc',
    ): LengthAwarePaginator {
        return $this->baseQuery($excludeUserId)
            ->with(self::CARD_EAGER)
            ->with(['alumniProfile.graduate.employmentRecords' => fn ($q) => $q->where('is_current', true)])
            ->tap(fn ($q) => $this->applyFilters(
                $q,
                $search,
                $graduationYear,
                $departmentId,
                $courseId,
                $employmentStatus,
                $boardStatus,
            ))
            ->tap(fn ($q) => $this->applySort($q, $sortBy, $sortDir))
            ->paginate($perPage);
    }

    /**
     * Resolve one alumni's PUBLIC profile by user UUID.
     *
     * A hidden, non-alumni, inactive, or unknown user all 404 identically so the
     * endpoint never confirms the existence of a profile the viewer may not see.
     *
     * @throws \Exception 404 in every not-viewable case.
     */
    public function findVisibleProfile(int $excludeUserId, string $uuid): User
    {
        $user = $this->baseQuery($excludeUserId)
            ->where('uuid', $uuid)
            ->with([
                'alumniProfile:id,user_id,graduate_id,employment_status,current_location,board_status',
                'alumniProfile.graduate:id,alumni_id_number,first_name,middle_name,last_name,suffix,education_level,graduation_year,course_id,department_id',
                'alumniProfile.graduate.course:id,name,code,department_id,is_board_program',
                'alumniProfile.graduate.course.department:id,name,code',
                'alumniProfile.graduate.employmentRecords' => fn ($q) => $q->where('is_current', true),
                'alumniProfile.graduate.boardExamRecords:id,graduate_id,status',
            ])
            ->first();

        if (!$user || !$user->alumniProfile?->graduate) {
            throw new \Exception('Profile not available.', 404);
        }

        return $user;
    }

    /**
     * Reference data for the directory's filter dropdowns. Batch years are drawn
     * from the visible directory population so the dropdown never offers a year
     * that returns nothing; departments/courses reuse the active reference lists
     * (same source the admin dropdowns use), so no new reference endpoint is
     * invented on the admin side.
     */
    public function filterOptions(int $excludeUserId): array
    {
        $years = Graduate::query()
            ->whereHas('user', fn ($u) => $u
                ->byRole(UserRole::ALUMNI)
                ->active()
                ->where('users.id', '!=', $excludeUserId)
                ->whereHas('alumniProfile', fn ($ap) => $ap->where('is_directory_visible', true)))
            ->whereNotNull('graduation_year')
            ->distinct()
            ->orderBy('graduation_year', 'desc')
            ->pluck('graduation_year')
            ->values();

        $departments = Department::query()
            ->active()
            ->byLevel(EducationLevel::COLLEGE->value)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($d) => ['id' => $d->id, 'name' => $d->name]);

        $courses = Course::query()
            ->active()
            ->orderBy('code')
            ->get(['id', 'name', 'code', 'department_id'])
            ->map(fn ($c) => [
                'id'            => $c->id,
                'name'          => $c->name,
                'code'          => $c->code,
                'department_id' => $c->department_id,
            ]);

        return [
            'years'       => $years,
            'departments' => $departments,
            'courses'     => $courses,
        ];
    }

    /**
     * Base directory query: active alumni (excluding the viewer) whose profile is
     * flagged directory-visible. Shared by the list and the single-profile lookup
     * so the visibility rules can never drift between them.
     */
    private function baseQuery(int $excludeUserId): Builder
    {
        return User::query()
            ->byRole(UserRole::ALUMNI)
            ->active()
            // Table-qualified so it stays unambiguous when the graduation_year
            // sort joins alumni_profiles/graduates (both of which also have `id`).
            ->where('users.id', '!=', $excludeUserId)
            ->whereHas('alumniProfile', fn ($q) => $q->where('is_directory_visible', true));
    }

    /**
     * Apply the optional list filters. Name search matches first/middle/last only
     * (never email — this is a public directory). Academic filters reach the
     * graduate through the alumni profile; department mirrors
     * Graduate::scopeByDepartment (direct + through-course).
     */
    private function applyFilters(
        Builder $query,
        ?string $search,
        ?int $graduationYear,
        ?int $departmentId,
        ?int $courseId,
        ?string $employmentStatus,
        ?string $boardStatus,
    ): void {
        // ─── Name search (first/middle/last, multi-term) ─────
        if (!empty($search)) {
            $terms = array_filter(explode(' ', trim($search)));
            foreach ($terms as $term) {
                $query->where(function ($q) use ($term) {
                    $q->where('first_name', 'LIKE', "%{$term}%")
                        ->orWhere('middle_name', 'LIKE', "%{$term}%")
                        ->orWhere('last_name', 'LIKE', "%{$term}%");
                });
            }
        }

        $query
            ->when($graduationYear, fn ($q) => $q->whereHas(
                'alumniProfile.graduate',
                fn ($g) => $g->where('graduation_year', $graduationYear)
            ))
            ->when($departmentId, fn ($q) => $q->whereHas(
                'alumniProfile.graduate',
                fn ($g) => $g->byDepartment($departmentId)
            ))
            ->when($courseId, fn ($q) => $q->whereHas(
                'alumniProfile.graduate',
                fn ($g) => $g->where('course_id', $courseId)
            ))
            ->when($employmentStatus, fn ($q) => $q->whereHas(
                'alumniProfile',
                fn ($ap) => $ap->where('employment_status', $employmentStatus)
            ))
            ->when($boardStatus, function ($q) use ($boardStatus) {
                // SOURCE OF TRUTH: query course.is_board_program + a passed
                // board_exam_record, NOT the derived board_status column (which
                // never persists 'not_taken'). Mirrors GraduateRepository.
                $passed = BoardStatus::PASSED->value;

                $q->whereHas('alumniProfile.graduate', function ($g) use ($boardStatus, $passed) {
                    match ($boardStatus) {
                        // Passed the board exam (record is the source of truth).
                        'passed' => $g->whereHas(
                            'boardExamRecords',
                            fn ($r) => $r->where('status', $passed)
                        ),
                        // In a board program but no passed record yet.
                        'not_taken' => $g
                            ->whereHas('course', fn ($c) => $c->where('is_board_program', true))
                            ->whereDoesntHave(
                                'boardExamRecords',
                                fn ($r) => $r->where('status', $passed)
                            ),
                        // Course has no board exam.
                        'not_applicable' => $g->whereHas(
                            'course',
                            fn ($c) => $c->where('is_board_program', false)
                        ),
                        default => null,
                    };
                });
            });
    }

    /**
     * Apply a whitelisted sort. `graduation_year` lives on the graduate, reached
     * through a 1:1 join (user → alumni_profile → graduate, so no row fan-out).
     */
    private function applySort(Builder $query, string $sortBy, string $sortDir): void
    {
        $sortBy = in_array($sortBy, ['name', 'graduation_year'], true) ? $sortBy : 'name';
        $sortDir = in_array(strtolower($sortDir), ['asc', 'desc'], true) ? strtolower($sortDir) : 'asc';

        if ($sortBy === 'graduation_year') {
            $query
                ->select('users.*')
                ->join('alumni_profiles as ap_sort', 'ap_sort.user_id', '=', 'users.id')
                ->join('graduates as grad_sort', 'grad_sort.id', '=', 'ap_sort.graduate_id')
                ->orderBy('grad_sort.graduation_year', $sortDir);
            return;
        }

        $query->orderBy('first_name', $sortDir)->orderBy('last_name', $sortDir);
    }
}
