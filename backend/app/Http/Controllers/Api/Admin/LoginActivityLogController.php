<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\LoginActivityLogResource;
use App\Repositories\Contracts\LoginActivityLogRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoginActivityLogController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected LoginActivityLogRepositoryInterface $logRepo,
    ) {}

    /**
     * GET /api/admin/login-logs
     * View login activity logs with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $logs = $this->logRepo->paginate(
            perPage: min($request->integer('per_page', 20), 100),
            status: $request->string('status')->toString() ?: null,
            dateFrom: $request->string('date_from')->toString() ?: null,
            dateTo: $request->string('date_to')->toString() ?: null,
            ip: $request->string('ip')->toString() ?: null,
            search: $request->string('search')->toString() ?: null,
            sortDir: $request->string('sort_dir', 'desc')->toString(),
        );

        return $this->paginated(
            $logs->through(fn($log) => new LoginActivityLogResource($log)),
            'Login activity logs retrieved.'
        );
    }
}
