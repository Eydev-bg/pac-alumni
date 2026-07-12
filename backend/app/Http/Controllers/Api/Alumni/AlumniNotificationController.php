<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Alumni/AlumniNotificationController.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniNotificationController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/alumni/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->paginated($notifications, 'Notifications retrieved.');
    }

    /**
     * GET /api/alumni/notifications/unread-count
     */
    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', auth()->id())->unread()->count();
        return $this->success(['count' => $count], 'Unread count retrieved.');
    }

    /**
     * PATCH /api/alumni/notifications/{id}/read
     */
    public function markRead(int $id): JsonResponse
    {
        $notification = Notification::where('user_id', auth()->id())->find($id);
        if (!$notification) return $this->notFound('Notification not found.');
        $notification->markAsRead();
        return $this->success(null, 'Marked as read.');
    }

    /**
     * PATCH /api/alumni/notifications/read-all
     */
    public function markAllRead(): JsonResponse
    {
        Notification::where('user_id', auth()->id())
            ->unread()
            ->update(['is_read' => true, 'read_at' => now()]);
        return $this->success(null, 'All notifications marked as read.');
    }
}
