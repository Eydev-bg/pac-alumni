<?php

namespace App\Repositories\Eloquent;

use App\Enums\BoardStatus;
use App\Models\Graduate;
use App\Repositories\Contracts\GraduateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class GraduateRepository implements GraduateRepositoryInterface
{
    /**
     * Relations eager-loaded for every graduate read, kept in one place so the
     * default list, trashed list, and single-record lookups stay in sync.
     */
    private const EAGER = [
        'course:id,name,code,department_id,is_board_program',
        'course.department:id,name,code',
        'user:id,profile_picture',
    ];

    public function __construct(
        protected Graduate $model
    ) {}

    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?string $educationLevel = null,
        ?int $graduationYear = null,
        ?int $departmentId = null,
        string $sortBy = 'created_at',
        string $sortDir = 'desc',
        ?int $courseId = null,
        ?string $boardStatus = null,
        ?string $employmentStatus = null
    ): LengthAwarePaginator {
        return $this->filteredQuery(
            $search,
            $educationLevel,
            $graduationYear,
            $departmentId,
            $sortBy,
            $sortDir,
            $courseId,
            $boardStatus,
            $employmentStatus
        )->paginate($perPage);
    }

    public function paginateTrashed(
        int $perPage = 15,
        ?string $search = null,
        ?string $educationLevel = null,
        ?int $graduationYear = null,
        ?int $departmentId = null,
        string $sortBy = 'deleted_at',
        string $sortDir = 'desc',
        ?int $courseId = null
    ): LengthAwarePaginator {
        return $this->filteredQuery(
            $search,
            $educationLevel,
            $graduationYear,
            $departmentId,
            $sortBy,
            $sortDir,
            $courseId
        )->onlyTrashed()->paginate($perPage);
    }

    public function findById(int $id): ?Graduate
    {
        return $this->model
            ->with(self::EAGER)
            ->find($id);
    }

    public function findTrashedById(int $id): ?Graduate
    {
        return $this->model
            ->onlyTrashed()
            ->with(self::EAGER)
            ->find($id);
    }

    public function create(array $data): Graduate
    {
        return $this->model->create($data);
    }

    public function update(Graduate $graduate, array $data): Graduate
    {
        $graduate->update($data);
        return $graduate->fresh()->load(self::EAGER);
    }

    public function delete(Graduate $graduate): bool
    {
        return $graduate->delete();
    }

    public function restore(Graduate $graduate): Graduate
    {
        $graduate->restore();
        return $graduate->load(self::EAGER);
    }

    public function forceDelete(Graduate $graduate): bool
    {
        return $graduate->forceDelete();
    }

    public function batchUpdate(array $ids, array $data): int
    {
        return $this->model->whereIn('id', $ids)->update($data);
    }

    public function getGraduationYears(?string $level = null): array
    {
        return $this->model->newQuery()
            ->when($level, fn($q) => $q->byLevel($level))
            ->distinct()
            ->orderBy('graduation_year', 'desc')
            ->pluck('graduation_year')
            ->toArray();
    }

    /**
     * Build the shared, filtered + sorted + eager-loaded graduate query used by
     * both the default and the trashed listings (the soft-delete scope is what
     * differs, applied by the caller). Board/employment filters are optional so
     * the trashed listing can omit them.
     */
    private function filteredQuery(
        ?string $search,
        ?string $educationLevel,
        ?int $graduationYear,
        ?int $departmentId,
        string $sortBy,
        string $sortDir,
        ?int $courseId,
        ?string $boardStatus = null,
        ?string $employmentStatus = null
    ): Builder {
        $allowedSorts = ['created_at', 'deleted_at', 'first_name', 'last_name', 'graduation_year'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'created_at';
        $sortDir = in_array($sortDir, ['asc', 'desc']) ? $sortDir : 'desc';

        return $this->model->newQuery()
            ->with(self::EAGER)
            ->search($search)
            ->when($educationLevel, fn($q) => $q->byLevel($educationLevel))
            ->byYear($graduationYear)
            ->byDepartment($departmentId)
            ->byCourse($courseId)
            ->when($boardStatus, function ($q) use ($boardStatus) {
                // Query the source of truth (course board-program flag +
                // board_exam_records) rather than the derived board_status column,
                // which never persists 'not_taken'.
                $passed = BoardStatus::PASSED->value;
                match ($boardStatus) {
                    // Passed the board exam (record is the source of truth).
                    'passed' => $q->whereHas(
                        'boardExamRecords',
                        fn($r) => $r->where('status', $passed)
                    ),
                    // In a board program but no passed record yet — includes
                    // registered alumni with no record and unregistered graduates.
                    'not_taken' => $q
                        ->whereHas('course', fn($c) => $c->where('is_board_program', true))
                        ->whereDoesntHave(
                            'boardExamRecords',
                            fn($r) => $r->where('status', $passed)
                        ),
                    // Course has no board exam.
                    'not_applicable' => $q->whereHas(
                        'course',
                        fn($c) => $c->where('is_board_program', false)
                    ),
                    default => null,
                };
            })
            ->when($employmentStatus, function ($q) use ($employmentStatus) {
                $q->whereHas(
                    'user',
                    fn($u) =>
                    $u->whereHas('alumniProfile', fn($ap) => $ap->where('employment_status', $employmentStatus))
                );
            })
            ->orderBy($sortBy, $sortDir);
    }
}
