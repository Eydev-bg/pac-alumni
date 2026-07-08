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
        try {
            $announcement = $this->announcementService->find($id);
            return $this->success(new AnnouncementResource($announcement), 'Announcement retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PUT /api/admin/announcements/{id}
     */
    public function update(UpdateAnnouncementRequest $request, int $id): JsonResponse
    {
        try {
            $announcement = $this->announcementService->update($id, $request->validated(), $request->file('image'));
            return $this->success(new AnnouncementResource($announcement), 'Announcement updated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/admin/announcements/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->announcementService->destroy($id);
            return $this->success(null, 'Announcement deleted.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/announcements/{id}/publish
     */
    public function publish(int $id): JsonResponse
    {
        try {
            $announcement = $this->announcementService->publish($id);
            return $this->success(new AnnouncementResource($announcement), 'Announcement published.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/announcements/{id}/archive
     */
    public function archive(int $id): JsonResponse
    {
        try {
            $announcement = $this->announcementService->archive($id);
            return $this->success(new AnnouncementResource($announcement), 'Announcement archived.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/announcements/{id}/pin
     */
    public function togglePin(int $id): JsonResponse
    {
        try {
            $announcement = $this->announcementService->togglePin($id);
            return $this->success(new AnnouncementResource($announcement), 'Announcement pin updated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
