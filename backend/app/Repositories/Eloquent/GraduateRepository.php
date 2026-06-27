<?php

namespace App\Repositories\Eloquent;

use App\Models\Graduate;
use App\Repositories\Contracts\GraduateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GraduateRepository implements GraduateRepositoryInterface
{
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
        $allowedSorts = ['created_at', 'first_name', 'last_name', 'graduation_year'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'created_at';
        $sortDir = in_array($sortDir, ['asc', 'desc']) ? $sortDir : 'desc';

        return $this->model->newQuery()
            ->with(['course:id,name,code,department_id,is_board_program', 'course.department:id,name,code', 'user:id,profile_picture'])
            ->search($search)
            ->when($educationLevel, fn($q) => $q->byLevel($educationLevel))
            ->byYear($graduationYear)
            ->byDepartment($departmentId)
            ->byCourse($courseId)
            ->when($boardStatus, function ($q) use ($boardStatus) {
                $q->whereHas(
                    'user',
                    fn($u) =>
                    $u->whereHas('alumniProfile', fn($ap) => $ap->where('board_status', $boardStatus))
                );
            })
            ->when($employmentStatus, function ($q) use ($employmentStatus) {
                $q->whereHas(
                    'user',
                    fn($u) =>
                    $u->whereHas('alumniProfile', fn($ap) => $ap->where('employment_status', $employmentStatus))
                );
            })
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function findById(int $id): ?Graduate
    {
        return $this->model
            ->with(['course:id,name,code,department_id,is_board_program', 'course.department:id,name,code', 'user:id,profile_picture'])
            ->find($id);
    }

    public function create(array $data): Graduate
    {
        return $this->model->create($data);
    }

    public function update(Graduate $graduate, array $data): Graduate
    {
        $graduate->update($data);
        return $graduate->fresh()->load(['course:id,name,code,department_id,is_board_program', 'course.department:id,name,code', 'user:id,profile_picture']);
    }

    public function delete(Graduate $graduate): bool
    {
        return $graduate->delete();
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
}
