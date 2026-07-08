<?php

namespace App\Services\Audit;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Central writer for the admin audit trail.
 *
 * Every privileged / destructive admin action funnels through record() so the
 * actor, target, request context (IP + user agent) and optional metadata are
 * captured consistently in one place — no duplicated logging code at call sites.
 */
class AuditLogService
{
    /**
     * Persist a single audit entry for the currently authenticated actor.
     *
     * @param  AuditAction  $action    The privileged action being recorded.
     * @param  Model|null   $target    The affected model (type + key are derived from it).
     * @param  array        $metadata  Safe, non-sensitive context (e.g. before/after keys).
     */
    public function record(AuditAction $action, ?Model $target = null, array $metadata = []): AuditLog
    {
        $actor = $this->resolveActor();
        $request = request();

        return AuditLog::create([
            'user_id' => $actor?->id,
            'actor_uuid' => $actor?->uuid,
            'action' => $action->value,
            'target_type' => $target ? $target::class : null,
            'target_id' => $target ? (string) $target->getKey() : null,
            'metadata' => $metadata ?: null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * Resolve the acting admin from the JWT guard, falling back to the default
     * guard so the service also works outside the api-guarded request cycle.
     */
    private function resolveActor(): ?User
    {
        return auth('api')->user() ?? auth()->user();
    }
}
