<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailLogController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/email-logs
     * Paginated email delivery log with optional type/status filters.
     */
    public function index(Request $request): JsonResponse
    {
        $logs = EmailLog::with('user:id,uuid,first_name,last_name')
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('created_at', 'desc')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->paginated($logs, 'Email logs.');
    }
}
