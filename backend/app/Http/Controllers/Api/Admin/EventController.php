<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Http\Resources\Admin\EventResource;
use App\Services\Admin\EventService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EventService $eventService,
    ) {}

    /**
     * GET /api/admin/events
     */
    public function index(Request $request): JsonResponse
    {
        $events = $this->eventService->list(
            $request->only(['target_type', 'is_published', 'search', 'per_page'])
        );

        return $this->paginated(
            $events->through(fn ($e) => new EventResource($e)),
            'Events retrieved.'
        );
    }

    /**
     * POST /api/admin/events
     */
    public function store(StoreEventRequest $request): JsonResponse
    {
        $event = $this->eventService->create(
            $request->user(),
            $request->validated(),
            $request->file('image'),
        );

        return $this->created(new EventResource($event), 'Event created.');
    }

    /**
     * GET /api/admin/events/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $event = $this->eventService->find($id);
            return $this->success(new EventResource($event), 'Event retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PUT /api/admin/events/{id}
     */
    public function update(UpdateEventRequest $request, int $id): JsonResponse
    {
        try {
            $event = $this->eventService->update($id, $request->validated(), $request->file('image'));
            return $this->success(new EventResource($event), 'Event updated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/admin/events/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->eventService->destroy($id);
            return $this->success(null, 'Event deleted.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/events/{id}/publish
     */
    public function publish(int $id): JsonResponse
    {
        try {
            $event = $this->eventService->publish($id);
            return $this->success(new EventResource($event), 'Event published.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/events/{id}/archive
     */
    public function archive(int $id): JsonResponse
    {
        try {
            $event = $this->eventService->archive($id);
            return $this->success(new EventResource($event), 'Event archived.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/events/{id}/pin
     */
    public function togglePin(int $id): JsonResponse
    {
        try {
            $event = $this->eventService->togglePin($id);
            return $this->success(new EventResource($event), 'Event pin updated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
