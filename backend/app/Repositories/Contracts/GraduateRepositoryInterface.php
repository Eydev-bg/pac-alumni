<?php

namespace App\Repositories\Contracts;

use App\Models\Graduate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface GraduateRepositoryInterface
{
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
    ): LengthAwarePaginator;

    public function paginateTrashed(
        int $perPage = 15,
        ?string $search = null,
        ?string $educationLevel = null,
        ?int $graduationYear = null,
        ?int $departmentId = null,
        string $sortBy = 'deleted_at',
        string $sortDir = 'desc',
        ?int $courseId = null
    ): LengthAwarePaginator;

    public function findById(int $id): ?Graduate;

    public function findTrashedById(int $id): ?Graduate;

    public function create(array $data): Graduate;

    public function update(Graduate $graduate, array $data): Graduate;

    public function delete(Graduate $graduate): bool;

    public function restore(Graduate $graduate): Graduate;

    public function forceDelete(Graduate $graduate): bool;

    public function batchUpdate(array $ids, array $data): int;

    public function getGraduationYears(?string $level = null): array;
}
