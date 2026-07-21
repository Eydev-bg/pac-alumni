<?php

namespace App\Repositories\Contracts;

use App\Enums\DepartmentStatus;
use App\Models\Department;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface DepartmentRepositoryInterface
{
    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?DepartmentStatus $status = null,
        ?bool $isBoard = null,
        string $sortBy = 'name',
        string $sortDir = 'asc',
        ?string $educationLevel = null
    ): LengthAwarePaginator;

    public function all(?DepartmentStatus $status = null, ?string $educationLevel = null): Collection;

    public function findById(int $id): ?Department;

    public function findByCode(string $code): ?Department;

    public function create(array $data): Department;

    public function update(Department $department, array $data): Department;

    public function updateStatus(Department $department, DepartmentStatus $status): Department;

    public function delete(Department $department): bool;

    public function getGraduateCount(Department $department): int;
}
