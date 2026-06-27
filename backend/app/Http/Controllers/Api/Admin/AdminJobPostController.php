<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/AdminJobPostController.php
//  Features 47-49: Job post moderation
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobPost;
use App\Models\JobReport;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminJobPostController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/job-posts — Feature 47
     */
    public function index(Request $request): JsonResponse
    {
        $posts = JobPost::with(['postedBy:id,uuid,first_name,last_name', 'department:id,name,code'])
            ->withCount('reports')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->search($request->search)
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        $data = $posts->through(fn($p) => [
            'id' => $p->id,
            'job_title' => $p->job_title,
            'company_name' => $p->company_name,
            'job_type' => $p->job_type,
            'industry' => $p->industry,
            'location_type' => $p->location_type,
            'status' => $p->status,
            'reports_count' => $p->reports_count,
            'posted_by' => $p->postedBy ? ['uuid' => $p->postedBy->uuid, 'full_name' => $p->postedBy->full_name] : null,
            'created_at' => $p->created_at?->toISOString(),
        ]);

        return $this->paginated($data, 'Job posts retrieved.');
    }

    /**
     * GET /api/admin/job-posts/{id}
     */
    public function show(int $id): JsonResponse
    {
        $post = JobPost::with(['postedBy:id,uuid,first_name,last_name,email', 'department:id,name,code', 'reports.reportedBy:id,uuid,first_name,last_name'])->find($id);
        if (!$post) return $this->notFound('Job post not found.');
        return $this->success($post, 'Job post detail.');
    }

    /**
     * DELETE /api/admin/job-posts/{id} — Feature 48
     */
    public function destroy(int $id): JsonResponse
    {
        $post = JobPost::find($id);
        if (!$post) return $this->notFound('Job post not found.');
        $post->update(['status' => 'deleted']);
        return $this->success(null, 'Job post deleted.');
    }

    /**
     * GET /api/admin/job-posts/reported — Feature 49
     */
    public function reported(Request $request): JsonResponse
    {
        $posts = JobPost::with(['postedBy:id,uuid,first_name,last_name'])
            ->withCount('reports')
            ->whereHas('reports')
            ->orderByDesc('reports_count')
            ->paginate($request->integer('per_page', 15));

        $data = $posts->through(fn($p) => [
            'id' => $p->id,
            'job_title' => $p->job_title,
            'company_name' => $p->company_name,
            'status' => $p->status,
            'reports_count' => $p->reports_count,
            'posted_by' => $p->postedBy ? ['uuid' => $p->postedBy->uuid, 'full_name' => $p->postedBy->full_name] : null,
            'created_at' => $p->created_at?->toISOString(),
        ]);

        return $this->paginated($data, 'Reported job posts.');
    }

    /**
     * PATCH /api/admin/job-reports/{id}/review
     */
    public function reviewReport(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:reviewed,dismissed']);
        $report = JobReport::find($id);
        if (!$report) return $this->notFound('Report not found.');

        $report->update([
            'status' => $request->status,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return $this->success(null, 'Report ' . $request->status . '.');
    }
}
