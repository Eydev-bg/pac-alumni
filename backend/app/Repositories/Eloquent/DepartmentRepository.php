<?php

namespace App\Repositories\Eloquent;

use App\Enums\DepartmentStatus;
use App\Models\Department;
use App\Repositories\Contracts\DepartmentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class DepartmentRepository implements DepartmentRepositoryInterface
{
    public function __construct(
        protected Department $model
    ) {}

    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?DepartmentStatus $status = null,
        ?bool $isBoard = null,
        string $sortBy = 'name',
        string $sortDir = 'asc',
        ?string $educationLevel = null
    ): LengthAwarePaginator {
        // SECURITY: Whitelist sortable columns
        $allowedSorts = ['name', 'code', 'created_at', 'status'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'name';
        $sortDir = in_array($sortDir, ['asc', 'desc']) ? $sortDir : 'asc';

        return $this->model->newQuery()
            ->with(['courses'])
            ->withCount(['courses', 'graduates', 'directGraduates'])
            ->search($search)
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($isBoard !== null, fn($q) => $q->where('is_board_program', $isBoard))
            ->byLevel($educationLevel)
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function all(?DepartmentStatus $status = null): Collection
    {
        return $this->model->newQuery()
            ->with('courses')
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderBy('name')
            ->get();
    }

    public function findById(int $id): ?Department
    {
        return $this->model
            ->with(['courses'])
            ->withCount(['courses', 'graduates', 'directGraduates'])
            ->find($id);
    }

    public function findByCode(string $code): ?Department
    {
        return $this->model->where('code', $code)->first();
    }

    public function create(array $data): Department
    {
        return $this->model->create($data);
    }

    public function update(Department $department, array $data): Department
    {
        $department->update($data);
        return $department->fresh();
    }

    public function updateStatus(Department $department, DepartmentStatus $status): Department
    {
        $department->update(['status' => $status]);
        return $department->fresh();
    }

    public function delete(Department $department): bool
    {
        return $department->delete();
    }

    public function getGraduateCount(Department $department): int
    {
        return $department->all_graduates_count;
    }
}
