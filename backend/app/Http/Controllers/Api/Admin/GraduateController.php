<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BatchUpdateGraduatesRequest;
use App\Http\Requests\Admin\ImportGraduatesRequest;
use App\Http\Requests\Admin\UpdateGraduateRequest;
use App\Http\Resources\Admin\GraduateResource;
use App\Http\Resources\Admin\ImportBatchResource;
use App\Models\ImportBatch;
use App\Services\Admin\GraduateImportService;
use App\Services\Admin\GraduateService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GraduateController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected GraduateService $graduateService,
        protected GraduateImportService $importService,
    ) {}

    /**
     * GET /api/admin/graduates
     */
    public function index(Request $request): JsonResponse
    {
        $graduates = $this->graduateService->list(
            perPage: $request->integer('per_page', 15),
            search: $request->string('search')->toString() ?: null,
            educationLevel: $request->string('education_level')->toString() ?: null,
            graduationYear: $request->integer('graduation_year') ?: null,
            departmentId: $request->integer('department_id') ?: null,
            courseId: $request->integer('course_id') ?: null,
            sortBy: $request->string('sort_by', 'created_at')->toString(),
            sortDir: $request->string('sort_dir', 'desc')->toString(),
            boardStatus: $request->string('board_status')->toString() ?: null,
            employmentStatus: $request->string('employment_status')->toString() ?: null,
        );

        return $this->paginated(
            $graduates->through(fn($g) => new GraduateResource($g)),
            'Graduates retrieved successfully.'
        );
    }

    /**
     * GET /api/admin/graduates/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $graduate = $this->graduateService->findById($id);
            return $this->success(new GraduateResource($graduate), 'Graduate retrieved.');
        } catch (\Exception $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * PUT /api/admin/graduates/{id}
     */
    public function update(UpdateGraduateRequest $request, int $id): JsonResponse
    {
        try {
            $graduate = $this->graduateService->findById($id);
            $updated = $this->graduateService->update($graduate, $request->validated());

            return $this->success(new GraduateResource($updated), 'Graduate updated successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * DELETE /api/admin/graduates/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $graduate = $this->graduateService->findById($id);
            $this->graduateService->delete($graduate);

            return $this->success(null, 'Graduate record deleted successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PATCH /api/admin/graduates/batch-update
     */
    public function batchUpdate(BatchUpdateGraduatesRequest $request): JsonResponse
    {
        try {
            $count = $this->graduateService->batchUpdate(
                $request->validated('ids'),
                $request->validated('data')
            );

            return $this->success(
                ['updated_count' => $count],
                "{$count} graduate records updated."
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /api/admin/graduates/import
     */
    public function import(ImportGraduatesRequest $request): JsonResponse
    {
        $batch = $this->importService->import(
            $request->file('file'),
            $request->validated('education_level'),
            auth('api')->id()
        );

        return $this->success(
            new ImportBatchResource($batch),
            "Import completed. {$batch->imported_count} imported, {$batch->duplicate_count} duplicates, {$batch->error_count} errors."
        );
    }

    /**
     * GET /api/admin/graduates/import-history
     */
    public function importHistory(Request $request): JsonResponse
    {
        $batches = ImportBatch::with('uploadedBy:id,uuid,first_name,last_name')
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated(
            $batches->through(fn($b) => new ImportBatchResource($b)),
            'Import history retrieved.'
        );
    }

    /**
     * GET /api/admin/graduates/import-history/{id}
     */
    public function importDetail(int $id): JsonResponse
    {
        $batch = ImportBatch::with('uploadedBy:id,uuid,first_name,last_name')->find($id);

        if (!$batch) {
            return $this->notFound('Import batch not found.');
        }

        return $this->success(new ImportBatchResource($batch), 'Import detail retrieved.');
    }

    /**
     * POST /api/admin/graduates/check-duplicates
     */
    public function checkDuplicates(Request $request): JsonResponse
    {
        $request->validate([
            'alumni_ids' => ['required', 'array'],
            'alumni_ids.*' => ['string'],
        ]);

        $duplicates = $this->importService->checkDuplicates(
            $request->alumni_ids
        );

        return $this->success([
            'duplicates' => $duplicates,
            'count' => count($duplicates),
        ], 'Duplicate check completed.');
    }

    /**
     * GET /api/admin/graduates/years
     */
    public function graduationYears(Request $request): JsonResponse
    {
        $years = $this->graduateService->getGraduationYears(
            $request->string('education_level')->toString() ?: null
        );

        return $this->success($years, 'Graduation years retrieved.');
    }
}
