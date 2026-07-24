<?php

namespace App\Services\Admin;

use App\Enums\AuditAction;
use App\Models\Graduate;
use App\Repositories\Contracts\GraduateRepositoryInterface;
use App\Services\Audit\AuditLogService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GraduateService
{
    public function __construct(
        protected GraduateRepositoryInterface $graduateRepo,
        protected AuditLogService $auditLog,
        protected DashboardCacheService $dashboardCache,
        protected GraduateTracerService $tracerService,
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
            throw \App\Exceptions\DomainException::notFound('Graduate not found.');
        }

        return $graduate;
    }

    /**
     * Paginated list of soft-deleted (trashed) graduates for the Trash screen.
     */
    public function listTrashed(
        int $perPage = 15,
        ?string $search = null,
        ?string $educationLevel = null,
        ?int $graduationYear = null,
        ?int $departmentId = null,
        ?int $courseId = null,
        string $sortBy = 'deleted_at',
        string $sortDir = 'desc'
    ): LengthAwarePaginator {
        return $this->graduateRepo->paginateTrashed(
            $perPage,
            $search,
            $educationLevel,
            $graduationYear,
            $departmentId,
            $sortBy,
            $sortDir,
            $courseId
        );
    }

    public function findTrashedById(int $id): Graduate
    {
        $graduate = $this->graduateRepo->findTrashedById($id);

        if (!$graduate) {
            throw \App\Exceptions\DomainException::notFound('Trashed graduate not found.');
        }

        return $graduate;
    }

    public function update(Graduate $graduate, array $data): Graduate
    {
        $updated = $this->graduateRepo->update($graduate, $data);

        $this->dashboardCache->flush();
        $this->tracerService->clearCache();

        return $updated;
    }

    public function delete(Graduate $graduate): void
    {
        // If graduate has a linked user account, prevent deletion
        if ($graduate->user_id) {
            throw \App\Exceptions\DomainException::unprocessable('Cannot delete graduate with a linked alumni account. Deactivate the account first.');
        }

        // Snapshot identifying details before the row is gone.
        $snapshot = [
            'alumni_id_number' => $graduate->alumni_id_number,
            'name' => trim($graduate->first_name . ' ' . $graduate->last_name),
        ];

        $this->graduateRepo->delete($graduate);

        $this->auditLog->record(AuditAction::GRADUATE_DELETED, $graduate, $snapshot);

        $this->dashboardCache->flush();
        $this->tracerService->clearCache();
    }

    /**
     * Restore a trashed graduate back into the active records.
     */
    public function restore(Graduate $graduate): Graduate
    {
        $snapshot = [
            'alumni_id_number' => $graduate->alumni_id_number,
            'name' => trim($graduate->first_name . ' ' . $graduate->last_name),
        ];

        $restored = $this->graduateRepo->restore($graduate);

        $this->auditLog->record(AuditAction::GRADUATE_RESTORED, $restored, $snapshot);

        $this->dashboardCache->flush();
        $this->tracerService->clearCache();

        return $restored;
    }

    /**
     * Permanently delete a trashed graduate. Irreversible.
     */
    public function forceDelete(Graduate $graduate): void
    {
        // Snapshot identifying details before the row is gone for good.
        $snapshot = [
            'alumni_id_number' => $graduate->alumni_id_number,
            'name' => trim($graduate->first_name . ' ' . $graduate->last_name),
        ];

        $this->graduateRepo->forceDelete($graduate);

        $this->auditLog->record(AuditAction::GRADUATE_FORCE_DELETED, $graduate, $snapshot);

        $this->dashboardCache->flush();
        $this->tracerService->clearCache();
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
            throw \App\Exceptions\DomainException::unprocessable('No valid fields provided for batch update.');
        }

        $count = $this->graduateRepo->batchUpdate($ids, $filteredData);

        $this->auditLog->record(AuditAction::GRADUATE_BATCH_UPDATED, null, [
            'ids' => array_values($ids),
            'count' => $count,
            'fields' => array_keys($filteredData),
        ]);

        $this->dashboardCache->flush();
        $this->tracerService->clearCache();

        return $count;
    }

    /**
     * Get available graduation years for filter dropdown.
     */
    public function getGraduationYears(?string $level = null): array
    {
        return $this->graduateRepo->getGraduationYears($level);
    }
}
