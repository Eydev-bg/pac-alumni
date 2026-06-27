<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AnalyticsService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AnalyticsService $analyticsService,
    ) {}

    /**
     * GET /api/admin/analytics/elementary
     */
    public function elementary(Request $request): JsonResponse
    {
        $data = $this->analyticsService->elementary(
            $request->integer('year_from') ?: null,
            $request->integer('year_to') ?: null,
        );
        return $this->success($data, 'Elementary analytics retrieved.');
    }

    /**
     * GET /api/admin/analytics/jhs
     */
    public function jhs(Request $request): JsonResponse
    {
        $data = $this->analyticsService->jhs(
            $request->integer('year_from') ?: null,
            $request->integer('year_to') ?: null,
        );
        return $this->success($data, 'JHS analytics retrieved.');
    }

    /**
     * GET /api/admin/analytics/shs
     */
    public function shs(Request $request): JsonResponse
    {
        $data = $this->analyticsService->shs(
            $request->integer('year_from') ?: null,
            $request->integer('year_to') ?: null,
        );
        return $this->success($data, 'SHS analytics retrieved.');
    }

    /**
     * GET /api/admin/analytics/college
     */
    public function college(Request $request): JsonResponse
    {
        $data = $this->analyticsService->collegeGraduates(
            $request->integer('year_from') ?: null,
            $request->integer('year_to') ?: null,
            $request->integer('department_id') ?: null,
            $request->integer('course_id') ?: null,
        );
        return $this->success($data, 'College graduate analytics retrieved.');
    }

    /**
     * GET /api/admin/analytics/college/board-exams
     */
    public function boardExams(Request $request): JsonResponse
    {
        $data = $this->analyticsService->boardExams(
            $request->integer('year_from') ?: null,
            $request->integer('year_to') ?: null,
            $request->integer('department_id') ?: null,
        );
        return $this->success($data, 'Board exam analytics retrieved.');
    }

    /**
     * GET /api/admin/analytics/college/employment
     */
    public function employment(Request $request): JsonResponse
    {
        $data = $this->analyticsService->employment(
            $request->integer('year_from') ?: null,
            $request->integer('year_to') ?: null,
            $request->integer('department_id') ?: null,
        );
        return $this->success($data, 'Employment analytics retrieved.');
    }

    /**
     * GET /api/admin/analytics/overview
     */
    public function overview(): JsonResponse
    {
        $data = $this->analyticsService->overview();
        return $this->success($data, 'Overview analytics retrieved.');
    }
}
