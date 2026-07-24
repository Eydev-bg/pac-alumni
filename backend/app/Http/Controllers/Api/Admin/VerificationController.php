<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBlacklistRequest;
use App\Http\Resources\Admin\BlacklistResource;
use App\Http\Resources\Admin\VerificationLogResource;
use App\Models\RegistrationBlacklist;
use App\Models\RegistrationSetting;
use App\Models\VerificationLog;
use App\Services\Admin\VerificationService;
use App\Services\Audit\AuditLogService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected VerificationService $verificationService,
        protected AuditLogService $auditLog,
    ) {}

    // ═══════════════════════════════════════════════════════
    //  REGISTRATION SETTINGS
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/admin/registration/settings
     */
    public function getSettings(): JsonResponse
    {
        $settings = RegistrationSetting::getSettings();

        return $this->success([
            'is_open' => $settings->is_open,
            'is_currently_open' => $settings->isCurrentlyOpen(),
            'open_from' => $settings->open_from?->toISOString(),
            'open_until' => $settings->open_until?->toISOString(),
            'updated_at' => $settings->updated_at?->toISOString(),
        ], 'Registration settings retrieved.');
    }

    /**
     * PUT /api/admin/registration/settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'is_open' => ['required', 'boolean'],
            'open_from' => ['nullable', 'date'],
            'open_until' => ['nullable', 'date', 'after_or_equal:open_from'],
        ]);

        $settings = RegistrationSetting::getSettings();
        $settings->update([
            'is_open' => $request->boolean('is_open'),
            'open_from' => $request->open_from,
            'open_until' => $request->open_until,
            'updated_by' => auth('api')->id(),
        ]);

        return $this->success([
            'is_open' => $settings->is_open,
            'is_currently_open' => $settings->fresh()->isCurrentlyOpen(),
            'open_from' => $settings->open_from?->toISOString(),
            'open_until' => $settings->open_until?->toISOString(),
        ], 'Registration settings updated.');
    }

    // ═══════════════════════════════════════════════════════
    //  VERIFICATION LOGS
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/admin/verification/logs
     */
    public function logs(Request $request): JsonResponse
    {
        $logs = VerificationLog::with('matchedGraduate:id,first_name,last_name,alumni_id_number')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->search($request->search)
            ->dateRange($request->date_from, $request->date_to)
            ->orderBy('created_at', 'desc')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->paginated(
            $logs->through(fn($log) => new VerificationLogResource($log)),
            'Verification logs retrieved.'
        );
    }

    /**
     * GET /api/admin/verification/verified
     */
    public function verified(Request $request): JsonResponse
    {
        $logs = VerificationLog::with('matchedGraduate:id,first_name,last_name,alumni_id_number')
            ->verified()
            ->search($request->search)
            ->orderBy('created_at', 'desc')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->paginated(
            $logs->through(fn($log) => new VerificationLogResource($log)),
            'Verified registrations retrieved.'
        );
    }

    /**
     * GET /api/admin/verification/rejected
     */
    public function rejected(Request $request): JsonResponse
    {
        $logs = VerificationLog::with('matchedGraduate:id,first_name,last_name,alumni_id_number')
            ->rejected()
            ->search($request->search)
            ->orderBy('created_at', 'desc')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->paginated(
            $logs->through(fn($log) => new VerificationLogResource($log)),
            'Rejected attempts retrieved.'
        );
    }

    /**
     * GET /api/admin/verification/stats
     */
    public function stats(): JsonResponse
    {
        $stats = $this->verificationService->getStats();
        return $this->success($stats, 'Verification statistics retrieved.');
    }

    // ═══════════════════════════════════════════════════════
    //  BLACKLIST MANAGEMENT
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/admin/blacklist
     */
    public function blacklist(Request $request): JsonResponse
    {
        $items = RegistrationBlacklist::with('blacklistedByUser:id,uuid,first_name,last_name')
            ->when($request->type, fn($q) => $q->where('identifier_type', $request->type))
            ->orderBy('created_at', 'desc')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->paginated(
            $items->through(fn($item) => new BlacklistResource($item)),
            'Blacklist retrieved.'
        );
    }

    /**
     * POST /api/admin/blacklist
     */
    public function addToBlacklist(StoreBlacklistRequest $request): JsonResponse
    {
        // Check if already blacklisted
        $exists = RegistrationBlacklist::where('identifier', $request->identifier)
            ->where('identifier_type', $request->identifier_type)
            ->exists();

        if ($exists) {
            return $this->error('This identifier is already blacklisted.', 422);
        }

        $item = RegistrationBlacklist::create([
            'identifier' => $request->validated('identifier'),
            'identifier_type' => $request->validated('identifier_type'),
            'reason' => $request->validated('reason'),
            'blacklisted_by' => auth('api')->id(),
            'created_at' => now(),
        ]);

        $this->auditLog->record(AuditAction::BLACKLIST_ADDED, $item, [
            'identifier' => $item->identifier,
            'identifier_type' => $item->identifier_type->value,
        ]);

        return $this->created(
            new BlacklistResource($item->load('blacklistedByUser:id,uuid,first_name,last_name')),
            'Added to blacklist.'
        );
    }

    /**
     * DELETE /api/admin/blacklist/{id}
     */
    public function removeFromBlacklist(int $id): JsonResponse
    {
        $item = RegistrationBlacklist::find($id);

        if (!$item) {
            return $this->notFound('Blacklist entry not found.');
        }

        $identifier = $item->identifier;
        $identifierType = $item->identifier_type->value;

        $item->delete();

        $this->auditLog->record(AuditAction::BLACKLIST_REMOVED, $item, [
            'identifier' => $identifier,
            'identifier_type' => $identifierType,
        ]);

        return $this->success(null, 'Removed from blacklist.');
    }
}
