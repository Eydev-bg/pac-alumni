<?php

namespace App\Services\Alumni;

use App\Enums\UserRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class MessageService
{
    /**
     * All conversations the user participates in, newest activity first, each
     * annotated with the unread count (messages sent by the OTHER party that the
     * user has not read).
     */
    public function listConversations(User $user): Collection
    {
        return Conversation::query()
            ->forUser($user->id)
            ->with([
                'participantOne.alumniProfile.graduate.course',
                'participantTwo.alumniProfile.graduate.course',
                'latestMessage',
            ])
            ->withCount(['messages as unread_count' => fn ($q) => $q
                ->where('is_read', false)
                ->where('sender_id', '!=', $user->id)])
            // Surface threads with activity first; brand-new (empty) threads fall
            // back to their creation time.
            ->orderByRaw('COALESCE(last_message_at, created_at) DESC')
            ->get();
    }

    /**
     * Start (or reuse) a conversation with another alumnus.
     *
     * @throws \Exception 404 unknown recipient, 422 self-message, 403 non-alumni.
     */
    public function startConversation(User $user, string $recipientUuid): Conversation
    {
        $recipient = User::where('uuid', $recipientUuid)->first();

        if (!$recipient) {
            throw new \Exception('Recipient not found.', 404);
        }

        if ($recipient->id === $user->id) {
            throw new \Exception('You cannot start a conversation with yourself.', 422);
        }

        // Alumni-only messaging — no contacting admins or employers.
        if ($recipient->role !== UserRole::ALUMNI) {
            throw new \Exception('You can only message fellow alumni.', 403);
        }

        $conversation = Conversation::firstOrCreateBetween($user->id, $recipient->id);
        $conversation->load(['participantOne', 'participantTwo', 'latestMessage']);

        return $conversation;
    }

    /**
     * Load a conversation's messages (oldest first) and mark everything the user
     * received as read. Returns the conversation with `messages` loaded.
     *
     * @throws \Exception 404 if the user is not a participant.
     */
    public function messages(User $user, int $conversationId): Conversation
    {
        $conversation = $this->authorizedConversation($user, $conversationId);

        // Mark the other party's messages as read on open.
        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $conversation->load([
            'participantOne',
            'participantTwo',
            'messages' => fn ($q) => $q->with('sender')->orderBy('created_at'),
        ]);

        return $conversation;
    }

    /**
     * Persist a new message in the conversation and bump its activity timestamp.
     *
     * @throws \Exception 404 if the user is not a participant.
     */
    public function sendMessage(User $user, int $conversationId, string $content): Message
    {
        $conversation = $this->authorizedConversation($user, $conversationId);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'content'         => $content,
            'is_read'         => false,
        ]);

        $conversation->update(['last_message_at' => $message->created_at]);

        $message->load('sender');

        return $message;
    }

    /**
     * Total unread messages across all of the user's conversations.
     */
    public function unreadCount(User $user): int
    {
        return Message::query()
            ->whereHas('conversation', fn ($q) => $q->forUser($user->id))
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Search for alumni the user can start a conversation with (excludes self).
     */
    public function searchRecipients(User $user, ?string $search): Collection
    {
        return User::query()
            ->byRole(UserRole::ALUMNI)
            ->active()
            ->where('id', '!=', $user->id)
            ->search($search)
            ->with('alumniProfile.graduate.course')
            ->orderBy('first_name')
            ->limit(20)
            ->get();
    }

    /**
     * Fetch a conversation the user is allowed to access, or fail with 404.
     */
    private function authorizedConversation(User $user, int $conversationId): Conversation
    {
        $conversation = Conversation::query()
            ->forUser($user->id)
            ->find($conversationId);

        if (!$conversation) {
            throw new \Exception('Conversation not found.', 404);
        }

        return $conversation;
    }
}
