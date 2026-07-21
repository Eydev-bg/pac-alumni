<?php

namespace App\Services\Admin;

use App\Enums\DepartmentStatus;
use App\Enums\UserRole;
use App\Models\Department;
use App\Repositories\Contracts\DepartmentRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class DepartmentService
{
    public function __construct(
        protected DepartmentRepositoryInterface $deptRepo,
        protected UserRepositoryInterface $userRepo,
    ) {}

    public function list(
        int $perPage = 15,
        ?string $search = null,
        ?string $status = null,
        ?string $isBoard = null,
        string $sortBy = 'name',
        string $sortDir = 'asc',
        ?string $educationLevel = null
    ): LengthAwarePaginator {
        return $this->deptRepo->paginate(
            $perPage,
            $search,
            $status ? DepartmentStatus::from($status) : null,
            $isBoard !== null ? filter_var($isBoard, FILTER_VALIDATE_BOOLEAN) : null,
            $sortBy,
            $sortDir,
            $educationLevel
        );
    }

    /**
     * Get all active departments (for dropdowns).
     * Optionally filter by education_level (e.g. 'college') so audience
     * dropdowns only show levels that actually have alumni accounts.
     */
    public function allActive(?string $educationLevel = null): Collection
    {
        return $this->deptRepo->all(DepartmentStatus::ACTIVE, $educationLevel);
    }

    public function findById(int $id): Department
    {
        $dept = $this->deptRepo->findById($id);

        if (!$dept) {
            throw new \Exception('Department not found.', 404);
        }

        return $dept;
    }

    public function create(array $data): Department
    {
        // Non-college departments cannot have board programs
        $level = $data['education_level'] ?? 'college';
        if ($level !== 'college') {
            $data['is_board_program'] = false;
            $data['board_exam_name'] = null;
        }

        // Ensure board_exam_name is set only for board programs
        if (empty($data['is_board_program']) || !$data['is_board_program']) {
            $data['board_exam_name'] = null;
        }

        return $this->deptRepo->create($data);
    }

    public function update(Department $department, array $data): Department
    {
        // Clear board_exam_name if switching to non-board
        if (isset($data['is_board_program']) && !$data['is_board_program']) {
            $data['board_exam_name'] = null;
        }

        return $this->deptRepo->update($department, $data);
    }

    public function updateStatus(Department $department, string $status): Department
    {
        $newStatus = DepartmentStatus::from($status);

        // Business rule: Cannot deactivate department with active graduates linked
        // (We allow it but show a warning in the frontend — historical data is preserved)

        return $this->deptRepo->updateStatus($department, $newStatus);
    }

    /**
     * Delete a department.
     * Only allowed if no graduates are linked.
     */
    public function delete(Department $department): void
    {
        if ($department->hasGraduates()) {
            throw new \Exception(
                'Cannot delete department with existing graduate records. Deactivate it instead.',
                422
            );
        }

        $this->deptRepo->delete($department);
    }

    /**
     * Get quick stats for a department.
     */
    public function getStats(Department $department): array
    {
        $totalGraduates = $this->deptRepo->getGraduateCount($department);

        return [
            'total_graduates' => $totalGraduates,
            'is_board_program' => $department->is_board_program,
            'board_exam_name' => $department->board_exam_name,
        ];
    }
}
