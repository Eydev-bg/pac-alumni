<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/NotificationController.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->paginated($notifications, 'Notifications retrieved.');
    }

    /**
     * GET /api/admin/notifications/unread-count
     */
    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', auth()->id())->unread()->count();
        return $this->success(['count' => $count], 'Unread count retrieved.');
    }

    /**
     * PATCH /api/admin/notifications/{id}/read
     */
    public function markRead(int $id): JsonResponse
    {
        $notification = Notification::where('user_id', auth()->id())->find($id);
        if (!$notification) return $this->notFound('Notification not found.');
        $notification->markAsRead();
        return $this->success(null, 'Marked as read.');
    }

    /**
     * PATCH /api/admin/notifications/read-all
     */
    public function markAllRead(): JsonResponse
    {
        Notification::where('user_id', auth()->id())
            ->unread()
            ->update(['is_read' => true, 'read_at' => now()]);
        return $this->success(null, 'All notifications marked as read.');
    }
}
