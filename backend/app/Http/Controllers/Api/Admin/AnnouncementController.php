<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateAnnouncementRequest;
use App\Http\Resources\Admin\AnnouncementResource;
use App\Services\Admin\AnnouncementService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AnnouncementService $announcementService,
    ) {}

    /**
     * GET /api/admin/announcements
     */
    public function index(Request $request): JsonResponse
    {
        $announcements = $this->announcementService->list(
            $request->only(['target_type', 'is_published', 'search', 'per_page'])
        );

        return $this->paginated(
            $announcements->through(fn ($a) => new AnnouncementResource($a)),
            'Announcements retrieved.'
        );
    }

    /**
     * POST /api/admin/announcements
     */
    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $announcement = $this->announcementService->create(
            $request->user(),
            $request->validated(),
            $request->file('image'),
        );

        return $this->created(new AnnouncementResource($announcement), 'Announcement created.');
    }

    /**
     * GET /api/admin/announcements/{id}
     */
    public function show(int $id): JsonResponse
    {
        $announcement = $this->announcementService->find($id);
        return $this->success(new AnnouncementResource($announcement), 'Announcement retrieved.');
    }

    /**
     * PUT /api/admin/announcements/{id}
     */
    public function update(UpdateAnnouncementRequest $request, int $id): JsonResponse
    {
        $announcement = $this->announcementService->update($id, $request->validated(), $request->file('image'));
        return $this->success(new AnnouncementResource($announcement), 'Announcement updated.');
    }

    /**
     * DELETE /api/admin/announcements/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->announcementService->destroy($id);
        return $this->success(null, 'Announcement deleted.');
    }

    /**
     * PATCH /api/admin/announcements/{id}/publish
     */
    public function publish(int $id): JsonResponse
    {
        $announcement = $this->announcementService->publish($id);
        return $this->success(new AnnouncementResource($announcement), 'Announcement published.');
    }

    /**
     * PATCH /api/admin/announcements/{id}/archive
     */
    public function archive(int $id): JsonResponse
    {
        $announcement = $this->announcementService->archive($id);
        return $this->success(new AnnouncementResource($announcement), 'Announcement archived.');
    }

    /**
     * PATCH /api/admin/announcements/{id}/pin
     */
    public function togglePin(int $id): JsonResponse
    {
        $announcement = $this->announcementService->togglePin($id);
        return $this->success(new AnnouncementResource($announcement), 'Announcement pin updated.');
    }
}
