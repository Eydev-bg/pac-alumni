<?php

namespace App\Services\Alumni;

use App\Enums\UserRole;
use App\Events\MessagesRead;
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
            ->withCount(['messages as unread_count' => fn($q) => $q
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
            throw \App\Exceptions\DomainException::notFound('Recipient not found.');
        }

        if ($recipient->id === $user->id) {
            throw \App\Exceptions\DomainException::unprocessable('You cannot start a conversation with yourself.');
        }

        // Alumni-only messaging — no contacting admins.
        if ($recipient->role !== UserRole::ALUMNI) {
            throw \App\Exceptions\DomainException::forbidden('You can only message fellow alumni.');
        }

        // Respect the directory opt-out: a hidden alumnus cannot be cold-messaged.
        // EXCEPTION: if a conversation already exists between the two (started while
        // the recipient was visible), allow continuing it. Normalize the ids the
        // same way firstOrCreateBetween does so we match the single canonical row.
        [$one, $two] = $user->id < $recipient->id
            ? [$user->id, $recipient->id]
            : [$recipient->id, $user->id];

        $hasExistingConversation = Conversation::query()
            ->where('participant_one_id', $one)
            ->where('participant_two_id', $two)
            ->exists();

        if (!$hasExistingConversation) {
            $profile = $recipient->alumniProfile;
            if (!$profile || !$profile->is_directory_visible) {
                // Same 404 as a non-existent user — never reveal a hidden profile exists.
                throw \App\Exceptions\DomainException::notFound('Recipient not found.');
            }
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

        // Mark the other party's messages as read on open, and broadcast the
        // read receipt so the sender's open thread flips "Sent" -> "Read" live.
        // A bulk update() bypasses Eloquent model events, so we grab the ids
        // first and dispatch MessagesRead explicitly rather than relying on a
        // model hook.
        $unreadIds = Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->pluck('id');

        if ($unreadIds->isNotEmpty()) {
            $readAt = now();

            Message::whereIn('id', $unreadIds)
                ->update(['is_read' => true, 'read_at' => $readAt]);

            broadcast(new MessagesRead(
                conversationId: $conversation->id,
                readerId: $user->id,
                messageIds: $unreadIds->all(),
                readAt: $readAt,
            ));
        }

        $conversation->load([
            'participantOne',
            'participantTwo',
            'messages' => fn($q) => $q->with(['sender', 'replyTo.sender'])->orderBy('created_at'),
        ]);

        return $conversation;
    }

    /**
     * Persist a new message in the conversation and bump its activity timestamp.
     *
     * @throws \Exception 404 if the user is not a participant.
     */
    public function sendMessage(User $user, int $conversationId, string $content, ?int $replyToId = null): Message
    {
        $conversation = $this->authorizedConversation($user, $conversationId);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'content'         => $content,
            'reply_to_id'     => $replyToId,
            'is_read'         => false,
        ]);

        $conversation->update(['last_message_at' => $message->created_at]);

        $message->load(['sender', 'replyTo.sender']);

        return $message;
    }

    /**
     * Total unread messages across all of the user's conversations.
     */
    public function unreadCount(User $user): int
    {
        return Message::query()
            ->whereHas('conversation', fn($q) => $q->forUser($user->id))
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
            // Respect the directory opt-out: alumni who hid themselves must not
            // be surfaced as message recipients.
            ->whereHas('alumniProfile', fn($q) => $q->where('is_directory_visible', true))
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
            throw \App\Exceptions\DomainException::notFound('Conversation not found.');
        }

        return $conversation;
    }
}
