<?php

namespace App\Jobs;

use App\Enums\ImportStatus;
use App\Models\ImportBatch;
use App\Services\Admin\GraduateImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

/**
 * Processes a queued graduate import file into its ImportBatch.
 *
 * The heavy row-processing lives in GraduateImportService::process(); this job
 * only resolves the batch, delegates, and guarantees the stored file is cleaned
 * up (including on hard failure).
 */
class ProcessGraduateImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $batchId,
        public string $storedPath,
    ) {}

    public function handle(GraduateImportService $service): void
    {
        $batch = ImportBatch::find($this->batchId);

        // Batch removed before processing — clean up the orphaned file.
        if (!$batch) {
            Storage::disk(config('filesystems.uploads_disk'))->delete($this->storedPath);
            return;
        }

        $service->process($batch, $this->storedPath);
    }

    /**
     * Runs if the job exhausts retries / errors fatally. Marks the batch failed
     * (unless already finalized) and removes the stored file.
     */
    public function failed(\Throwable $e): void
    {
        $batch = ImportBatch::find($this->batchId);

        if ($batch && !in_array($batch->status, [ImportStatus::COMPLETED, ImportStatus::FAILED], true)) {
            $batch->update([
                'status' => ImportStatus::FAILED,
                'error_details' => [$e->getMessage()],
                'completed_at' => now(),
            ]);
        }

        Storage::disk(config('filesystems.uploads_disk'))->delete($this->storedPath);
    }
}
