<?php

namespace App\Services\Admin;

use App\Models\Graduate;
use App\Repositories\Contracts\GraduateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GraduateService
{
    public function __construct(
        protected GraduateRepositoryInterface $graduateRepo,
    ) {}

    public function list(
        int $perPage = 15,
        ?string $search = null,
        ?string $educationLevel = null,
        ?int $graduationYear = null,
        ?int $departmentId = null,
        ?int $courseId = null,
        string $sortBy = 'created_at',
        string $sortDir = 'desc',
        ?string $boardStatus = null,
        ?string $employmentStatus = null
    ): LengthAwarePaginator {
        return $this->graduateRepo->paginate(
            $perPage,
            $search,
            $educationLevel,
            $graduationYear,
            $departmentId,
            $sortBy,
            $sortDir,
            $courseId,
            $boardStatus,
            $employmentStatus
        );
    }

    public function findById(int $id): Graduate
    {
        $graduate = $this->graduateRepo->findById($id);

        if (!$graduate) {
            throw new \Exception('Graduate not found.', 404);
        }

        return $graduate;
    }

    public function update(Graduate $graduate, array $data): Graduate
    {
        return $this->graduateRepo->update($graduate, $data);
    }

    public function delete(Graduate $graduate): void
    {
        // If graduate has a linked user account, prevent deletion
        if ($graduate->user_id) {
            throw new \Exception('Cannot delete graduate with a linked alumni account. Deactivate the account first.', 422);
        }

        $this->graduateRepo->delete($graduate);
    }

    /**
     * Batch update multiple graduates.
     */
    public function batchUpdate(array $ids, array $data): int
    {
        // Sanitize: only allow certain fields for batch update
        $allowed = ['graduation_year', 'department_id', 'course_id', 'education_level'];
        $filteredData = array_intersect_key($data, array_flip($allowed));

        if (empty($filteredData)) {
            throw new \Exception('No valid fields provided for batch update.', 422);
        }

        return $this->graduateRepo->batchUpdate($ids, $filteredData);
    }

    /**
     * Get available graduation years for filter dropdown.
     */
    public function getGraduationYears(?string $level = null): array
    {
        return $this->graduateRepo->getGraduationYears($level);
    }
}
