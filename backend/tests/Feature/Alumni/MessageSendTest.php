<?php

namespace Tests\Feature\Alumni;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageSendTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The sender must see their just-sent message flagged is_mine === true.
     * Regression test for the POST path returning is_mine:false (the bubble
     * jumping to the wrong side in the UI).
     */
    public function test_post_send_returns_is_mine_true_for_sender(): void
    {
        $sender    = User::factory()->create();
        $recipient = User::factory()->create();

        $conversation = Conversation::firstOrCreateBetween($sender->id, $recipient->id);

        $response = $this->actingAs($sender, 'api')->postJson(
            "/api/alumni/conversations/{$conversation->id}/messages",
            ['content' => 'Hello from the sender'],
        );

        $response->assertCreated();
        $response->assertJsonPath('data.is_mine', true);
        $response->assertJsonPath('data.content', 'Hello from the sender');
    }

    /**
     * The GET path must also keep flagging the sender's own messages correctly.
     */
    public function test_get_messages_returns_is_mine_true_for_own_message(): void
    {
        $sender    = User::factory()->create();
        $recipient = User::factory()->create();

        $conversation = Conversation::firstOrCreateBetween($sender->id, $recipient->id);

        $this->actingAs($sender, 'api')->postJson(
            "/api/alumni/conversations/{$conversation->id}/messages",
            ['content' => 'Own message'],
        )->assertCreated();

        $response = $this->actingAs($sender, 'api')->getJson(
            "/api/alumni/conversations/{$conversation->id}/messages",
        );

        $response->assertOk();
        $response->assertJsonPath('data.messages.0.is_mine', true);
    }

    /**
     * The recipient must NOT see the sender's message as their own.
     */
    public function test_recipient_sees_message_as_not_mine(): void
    {
        $sender    = User::factory()->create();
        $recipient = User::factory()->create();

        $conversation = Conversation::firstOrCreateBetween($sender->id, $recipient->id);

        $this->actingAs($sender, 'api')->postJson(
            "/api/alumni/conversations/{$conversation->id}/messages",
            ['content' => 'Hi recipient'],
        )->assertCreated();

        $response = $this->actingAs($recipient, 'api')->getJson(
            "/api/alumni/conversations/{$conversation->id}/messages",
        );

        $response->assertOk();
        $response->assertJsonPath('data.messages.0.is_mine', false);
    }
}
