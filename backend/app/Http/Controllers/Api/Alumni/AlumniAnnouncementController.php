<?php

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Resources\Alumni\AlumniAnnouncementResource;
use App\Services\Alumni\AlumniAnnouncementService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniAnnouncementController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AlumniAnnouncementService $announcementService,
    ) {}

    /**
     * GET /api/alumni/announcements
     */
    public function index(Request $request): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        $announcements = $this->announcementService->list($profile, $request->only(['per_page']));

        return $this->paginated(
            $announcements->through(fn ($a) => new AlumniAnnouncementResource($a)),
            'Announcements retrieved.'
        );
    }

    /**
     * GET /api/alumni/announcements/unread-count
     */
    public function unreadCount(): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        return $this->success(
            ['unread_count' => $this->announcementService->unreadCount($profile)],
            'Unread count retrieved.'
        );
    }

    /**
     * GET /api/alumni/announcements/{id}
     */
    public function show(int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        try {
            $announcement = $this->announcementService->show($profile, $id);
            return $this->success(new AlumniAnnouncementResource($announcement), 'Announcement retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * POST /api/alumni/announcements/{id}/read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        try {
            $this->announcementService->markAsRead($profile, $id);
            return $this->success(null, 'Announcement marked as read.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
