<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Services/Admin/ReminderStatsService.php
//  Phase 4.3 — Aggregates automated-reminder volume for the
//  admin dashboard (today / this week / this month, by type).
// ═══════════════════════════════════════════════════════════

namespace App\Services\Admin;

use App\Models\EmailReminderLog;
use Illuminate\Support\Facades\DB;

class ReminderStatsService
{
    /**
     * Human labels for each reminder type, in display order.
     */
    private const TYPE_LABELS = [
        EmailReminderLog::TYPE_LOGIN => 'Login Reminders',
        EmailReminderLog::TYPE_EMPLOYMENT => 'Employment Updates',
        EmailReminderLog::TYPE_PROFILE => 'Profile Completion',
    ];

    /**
     * Build the reminder statistics payload:
     *  - totals: today / this_week / this_month / all_time
     *  - by_type: per-type counts across the same windows
     */
    public function getStats(): array
    {
        $startOfToday = now()->startOfDay();
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        // Single grouped query: type → window counts.
        $rows = EmailReminderLog::select('type')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(sent_at >= ?) as today', [$startOfToday])
            ->selectRaw('SUM(sent_at >= ?) as this_week', [$startOfWeek])
            ->selectRaw('SUM(sent_at >= ?) as this_month', [$startOfMonth])
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        $byType = [];
        $totals = ['today' => 0, 'this_week' => 0, 'this_month' => 0, 'all_time' => 0];

        foreach (self::TYPE_LABELS as $type => $label) {
            $row = $rows->get($type);

            $today = (int) ($row->today ?? 0);
            $week = (int) ($row->this_week ?? 0);
            $month = (int) ($row->this_month ?? 0);
            $total = (int) ($row->total ?? 0);

            $byType[] = [
                'type' => $type,
                'label' => $label,
                'today' => $today,
                'this_week' => $week,
                'this_month' => $month,
                'total' => $total,
            ];

            $totals['today'] += $today;
            $totals['this_week'] += $week;
            $totals['this_month'] += $month;
            $totals['all_time'] += $total;
        }

        return [
            'totals' => $totals,
            'by_type' => $byType,
        ];
    }
}
