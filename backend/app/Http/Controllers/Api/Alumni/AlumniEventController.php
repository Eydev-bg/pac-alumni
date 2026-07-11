<?php

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\RsvpEventRequest;
use App\Http\Resources\Alumni\AlumniEventResource;
use App\Services\Alumni\AlumniEventService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniEventController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AlumniEventService $eventService,
    ) {}

    /**
     * GET /api/alumni/events
     */
    public function index(Request $request): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        $events = $this->eventService->list($profile, $request->only(['per_page']));

        return $this->paginated(
            $events->through(fn ($e) => new AlumniEventResource($e)),
            'Events retrieved.'
        );
    }

    /**
     * GET /api/alumni/events/{id}
     */
    public function show(int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        try {
            $event = $this->eventService->show($profile, $id);
            return $this->success(new AlumniEventResource($event), 'Event retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * POST /api/alumni/events/{id}/rsvp
     */
    public function rsvp(RsvpEventRequest $request, int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        try {
            $event = $this->eventService->rsvp($profile, $id, $request->validated()['status']);
            return $this->success(new AlumniEventResource($event), 'RSVP saved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/alumni/events/{id}/rsvp
     */
    public function cancelRsvp(int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        try {
            $event = $this->eventService->cancelRsvp($profile, $id);
            return $this->success(new AlumniEventResource($event), 'RSVP cancelled.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
