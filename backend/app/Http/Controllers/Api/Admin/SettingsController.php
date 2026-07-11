<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceSetting;
use App\Services\Audit\AuditLogService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin-only system settings.
 *
 * Currently exposes the maintenance-mode toggle. Mirrors the direct-model
 * settings pattern used by VerificationController for registration settings.
 */
class SettingsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuditLogService $auditLog,
    ) {}

    /**
     * GET /api/admin/settings/maintenance
     */
    public function getMaintenance(): JsonResponse
    {
        $settings = MaintenanceSetting::getSettings();

        return $this->success(
            $this->present($settings),
            'Maintenance settings retrieved.'
        );
    }

    /**
     * PUT /api/admin/settings/maintenance
     */
    public function updateMaintenance(Request $request): JsonResponse
    {
        $request->validate([
            'is_enabled' => ['required', 'boolean'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $settings = MaintenanceSetting::getSettings();
        $wasEnabled = $settings->is_enabled;
        $nowEnabled = $request->boolean('is_enabled');

        $settings->update([
            'is_enabled' => $nowEnabled,
            'message' => $request->input('message') ?: null,
            // Stamp the audit context only while enabled; clear it when turned off.
            // Preserve the original enabled_at across edits that keep it on.
            'enabled_at' => $nowEnabled ? ($settings->enabled_at ?? now()) : null,
            'enabled_by' => $nowEnabled ? auth('api')->id() : null,
        ]);

        // Record an audit entry only when the on/off state actually changes.
        if ($wasEnabled !== $nowEnabled) {
            $this->auditLog->record(AuditAction::MAINTENANCE_MODE_TOGGLED, $settings, [
                'enabled' => $nowEnabled,
            ]);
        }

        return $this->success(
            $this->present($settings->fresh()),
            'Maintenance settings updated.'
        );
    }

    /**
     * Shape the settings row for API output.
     */
    private function present(MaintenanceSetting $settings): array
    {
        return [
            'is_enabled' => $settings->is_enabled,
            'message' => $settings->message,
            'enabled_at' => $settings->enabled_at?->toISOString(),
            'updated_at' => $settings->updated_at?->toISOString(),
        ];
    }
}
