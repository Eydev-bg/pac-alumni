<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_07_12_083452_strip_html_from_job_posting_text.php
//  Data cleanup — requirements/benefits are plain text; strip HTML tags
//  that earlier saves left in existing rows (e.g. Quill <p> wrappers).
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Includes soft-deleted rows so a restored posting is clean too.
        DB::table('job_postings')
            ->select('id', 'requirements', 'benefits')
            ->orderBy('id')
            ->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    $requirements = $row->requirements === null ? null : trim(strip_tags($row->requirements));
                    $benefits = $row->benefits === null ? null : trim(strip_tags($row->benefits));

                    if ($requirements !== $row->requirements || $benefits !== $row->benefits) {
                        DB::table('job_postings')->where('id', $row->id)->update([
                            'requirements' => $requirements,
                            'benefits'     => $benefits,
                        ]);
                    }
                }
            });
    }

    public function down(): void
    {
        // No-op: stripped HTML tags cannot be restored.
    }
};
