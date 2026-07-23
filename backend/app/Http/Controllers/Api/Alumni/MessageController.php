<?php

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\SendMessageRequest;
use App\Http\Requests\Alumni\StartConversationRequest;
use App\Http\Resources\Alumni\ConversationResource;
use App\Http\Resources\Alumni\MessageResource;
use App\Services\Alumni\MessageService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MessageService $messageService,
    ) {}

    /**
     * GET /api/alumni/conversations
     */
    public function conversations(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $conversations = $this->messageService->listConversations($user);

        return $this->success(
            ConversationResource::collection($conversations),
            'Conversations retrieved.'
        );
    }

    /**
     * POST /api/alumni/conversations
     */
    public function startConversation(StartConversationRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        try {
            $conversation = $this->messageService->startConversation(
                $user,
                $request->validated('recipient_id'),
            );

            return $this->success(
                new ConversationResource($conversation),
                'Conversation ready.'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * GET /api/alumni/conversations/{id}/messages
     */
    public function messages(Request $request, int $id): JsonResponse
    {
        $user = auth('api')->user();

        try {
            $conversation = $this->messageService->messages($user, $id);

            return $this->success([
                'conversation' => new ConversationResource($conversation),
                'messages'     => MessageResource::collection($conversation->messages),
            ], 'Messages retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * POST /api/alumni/conversations/{id}/messages
     */
    public function sendMessage(SendMessageRequest $request, int $id): JsonResponse
    {
        $user = auth('api')->user();

        try {
            $message = $this->messageService->sendMessage(
                $user,
                $id,
                $request->validated('content'),
            );

            return $this->created(new MessageResource($message), 'Message sent.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * GET /api/alumni/messages/unread-count
     */
    public function unreadCount(): JsonResponse
    {
        $user = auth('api')->user();

        return $this->success(
            ['unread_count' => $this->messageService->unreadCount($user)],
            'Unread count retrieved.'
        );
    }

    /**
     * GET /api/alumni/messages/recipients
     */
    public function recipients(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $recipients = $this->messageService->searchRecipients(
            $user,
            $request->query('search'),
        );

        $data = $recipients->map(function ($u) {
            $graduate = $u->alumniProfile?->graduate;

            return [
                'uuid'            => $u->uuid,
                'name'            => $u->full_name,
                'profile_picture' => $u->profile_picture,
                'course_code'     => $graduate?->course?->code,
                'graduation_year' => $graduate?->graduation_year,
            ];
        });

        return $this->success($data, 'Recipients retrieved.');
    }
}
