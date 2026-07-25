<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

/**
 * Central resolver for the configured upload disk.
 *
 * All alumni file-handling code (profile pictures, board-exam proofs) reads
 * the disk from here so switching between local ('public') and cloud
 * ('supabase') storage is a single config change (STORAGE_DISK env var).
 *
 * DB convention: raw storage paths are persisted (e.g. "profile_pictures/uuid.jpg"),
 * NOT resolved URLs — signed cloud URLs expire, so URLs are resolved at read
 * time via {@see url()} (typically from a model accessor).
 */
class StorageService
{
    /**
     * Get the configured upload disk name.
     * Defaults to 'public' for backward compatibility in dev.
     */
    public static function diskName(): string
    {
        return config('filesystems.uploads_disk', 'public');
    }

    /**
     * Get the configured upload disk instance.
     */
    public static function disk(): Filesystem
    {
        return Storage::disk(static::diskName());
    }

    /**
     * Generate a URL for a stored file.
     * - For local 'public' disk: returns /storage/... path (relative URL).
     * - For cloud disks (supabase/s3): returns a temporary signed URL.
     */
    public static function url(string $path, int $expirationMinutes = 60): string
    {
        $disk = static::diskName();

        if ($disk === 'public') {
            return '/storage/' . ltrim($path, '/');
        }

        // Cloud storage — generate a temporary signed URL
        return Storage::disk($disk)->temporaryUrl($path, now()->addMinutes($expirationMinutes));
    }

    /**
     * Delete a file from the configured disk.
     */
    public static function delete(string $pathOrUrl): bool
    {
        $path = static::extractPath($pathOrUrl);
        if (!$path) return false;

        $diskInstance = static::disk();
        if ($diskInstance->exists($path)) {
            return $diskInstance->delete($path);
        }
        return false;
    }

    /**
     * Store a file on the configured disk. Returns the raw storage path.
     */
    public static function store(\Illuminate\Http\UploadedFile $file, string $filename): string
    {
        return $file->storeAs('', $filename, static::diskName());
    }

    /**
     * Extract the storage path from either a raw path or a /storage/... URL.
     */
    public static function extractPath(string $pathOrUrl): ?string
    {
        if (empty($pathOrUrl)) return null;

        // If it's a /storage/... local URL, strip the prefix
        if (str_starts_with($pathOrUrl, '/storage/')) {
            return substr($pathOrUrl, strlen('/storage/'));
        }

        // If it's an https://... signed URL, we can't reliably extract the path.
        // For cloud storage, the DB stores the raw path (without /storage/ prefix).
        if (str_starts_with($pathOrUrl, 'http')) {
            return null;
        }

        // Already a raw path
        return $pathOrUrl;
    }
}
