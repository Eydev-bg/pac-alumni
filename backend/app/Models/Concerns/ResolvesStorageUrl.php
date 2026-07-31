<?php

namespace App\Models\Concerns;

use App\Services\StorageService;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * Shared accessor logic for any model attribute that stores a raw file
 * path (e.g. "events/xyz.jpg", "board_exam_proofs/abc.pdf") and needs to
 * be resolved to an actual servable URL at read time.
 *
 * WHY THIS EXISTS: the DB persists the RAW storage path, never a resolved
 * URL — because signed cloud URLs (Supabase/S3) expire, so re-resolving on
 * every read is required. Without this, any model exposing a raw path
 * straight to the frontend produces an unusable value once STORAGE_DISK
 * is a cloud disk (the frontend has no way to turn a bare path into a
 * signed URL itself).
 *
 * Usage in a model:
 *   use App\Models\Concerns\ResolvesStorageUrl;
 *
 *   protected function image(): Attribute
 *   {
 *       return $this->storageUrlAttribute();
 *   }
 */
trait ResolvesStorageUrl
{
    /**
     * Build an Eloquent accessor that resolves a stored path to a URL.
     * Handles:
     *   1. Already-full "http..." URLs — passed through untouched.
     *   2. Legacy "/storage/..." values — kept as-is on local disk, or
     *      converted to a signed URL when running on cloud storage.
     *   3. Raw paths (e.g. "events/xyz.jpg") — resolved via StorageService::url().
     */
    protected function storageUrlAttribute(): Attribute
    {
        return Attribute::make(
            get: function (?string $value) {
                if (!$value) return null;
                if (str_starts_with($value, 'http')) return $value;
                if (str_starts_with($value, '/storage/')) {
                    if (StorageService::diskName() !== 'public') {
                        return StorageService::url(substr($value, strlen('/storage/')));
                    }
                    return $value;
                }
                return StorageService::url($value);
            },
        );
    }
}
