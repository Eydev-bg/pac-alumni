<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Controllers/Api/Admin/ReminderController.php
//  Phase 4.3 — Admin visibility into the automated reminder system.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ReminderStatsService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ReminderController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ReminderStatsService $reminderStats,
    ) {}

    /**
     * GET /api/admin/reminders/stats
     * Reminder email volume — today / this week / this month, by type.
     */
    public function stats(): JsonResponse
    {
        return $this->success(
            $this->reminderStats->getStats(),
            'Reminder statistics retrieved.'
        );
    }
}
