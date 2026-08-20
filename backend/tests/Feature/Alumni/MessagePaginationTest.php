<?php

namespace Tests\Feature\Alumni;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagePaginationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Seed $count messages alternating between the two participants, with
     * increasing created_at so autoincrement id order matches chronological
     * order (the invariant the `id <` cursor relies on).
     */
    private function seedMessages(Conversation $c, User $a, User $b, int $count): void
    {
        $base = now()->subDays(2);

        for ($i = 1; $i <= $count; $i++) {
            Message::create([
                'conversation_id' => $c->id,
                'sender_id'       => $i % 2 === 0 ? $b->id : $a->id,
                'content'         => 'msg-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'is_read'         => false,
                'created_at'      => $base->copy()->addMinutes($i),
                'updated_at'      => $base->copy()->addMinutes($i),
            ]);
        }
    }

    public function test_initial_load_returns_newest_page_in_chronological_order(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = Conversation::firstOrCreateBetween($a->id, $b->id);
        $this->seedMessages($c, $a, $b, 51);

        $res = $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages")
            ->assertOk();

        $contents = collect($res->json('data.messages'))->pluck('content')->all();

        // Newest 30 of 51 => msg-022 .. msg-051, oldest-first for the UI.
        $this->assertCount(30, $contents);
        $this->assertSame('msg-022', $contents[0]);
        $this->assertSame('msg-051', $contents[29]);

        $res->assertJsonPath('data.has_more', true);

        // next_cursor is the id of the OLDEST message on this page (msg-022).
        $oldestId = Message::where('content', 'msg-022')->value('id');
        $res->assertJsonPath('data.next_cursor', $oldestId);
    }

    public function test_before_cursor_returns_the_older_batch_with_no_overlap(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = Conversation::firstOrCreateBetween($a->id, $b->id);
        $this->seedMessages($c, $a, $b, 51);

        $first = $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages")
            ->assertOk();

        $cursor    = $first->json('data.next_cursor');
        $firstIds  = collect($first->json('data.messages'))->pluck('id');

        $second = $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages?before={$cursor}")
            ->assertOk();

        $secondContents = collect($second->json('data.messages'))->pluck('content')->all();
        $secondIds      = collect($second->json('data.messages'))->pluck('id');

        // Remaining 21 => msg-001 .. msg-021, still oldest-first.
        $this->assertCount(21, $secondContents);
        $this->assertSame('msg-001', $secondContents[0]);
        $this->assertSame('msg-021', $secondContents[20]);

        // No page overlap, and the whole thread is covered exactly once.
        $this->assertEmpty($firstIds->intersect($secondIds));
        $this->assertSame(51, $firstIds->merge($secondIds)->unique()->count());

        // End of history reached.
        $second->assertJsonPath('data.has_more', false);
        $second->assertJsonPath('data.next_cursor', null);
    }

    public function test_initial_load_marks_received_messages_read_but_paging_older_does_not(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = Conversation::firstOrCreateBetween($a->id, $b->id);
        $this->seedMessages($c, $a, $b, 51);

        // Everything from B starts unread for A.
        $this->assertGreaterThan(0, Message::where('sender_id', $b->id)->where('is_read', false)->count());

        $first = $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages")
            ->assertOk();

        // Initial load marks the whole thread read (existing behaviour, unchanged).
        $this->assertSame(0, Message::where('sender_id', $b->id)->where('is_read', false)->count());

        // Now make the older half unread again and page back into it.
        Message::where('sender_id', $b->id)->update(['is_read' => false, 'read_at' => null]);
        $unreadBefore = Message::where('sender_id', $b->id)->where('is_read', false)->count();

        $cursor = $first->json('data.next_cursor');
        $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages?before={$cursor}")
            ->assertOk();

        // Paging back through history must NOT touch read state.
        $this->assertSame(
            $unreadBefore,
            Message::where('sender_id', $b->id)->where('is_read', false)->count(),
        );
    }

    public function test_per_page_is_respected_and_bounded(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = Conversation::firstOrCreateBetween($a->id, $b->id);
        $this->seedMessages($c, $a, $b, 51);

        $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages?per_page=10")
            ->assertOk()
            ->assertJsonCount(10, 'data.messages')
            ->assertJsonPath('data.has_more', true);

        // max:50
        $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages?per_page=51")
            ->assertStatus(422);

        // min:1
        $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages?before=0")
            ->assertStatus(422);
    }

    public function test_short_thread_reports_no_more_pages(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = Conversation::firstOrCreateBetween($a->id, $b->id);
        $this->seedMessages($c, $a, $b, 6);

        $this->actingAs($a, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages")
            ->assertOk()
            ->assertJsonCount(6, 'data.messages')
            ->assertJsonPath('data.has_more', false)
            ->assertJsonPath('data.next_cursor', null);
    }

    public function test_non_participant_cannot_read_any_page(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $outsider = User::factory()->create();
        $c = Conversation::firstOrCreateBetween($a->id, $b->id);
        $this->seedMessages($c, $a, $b, 51);

        $this->actingAs($outsider, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages")
            ->assertNotFound();

        $this->actingAs($outsider, 'api')
            ->getJson("/api/alumni/conversations/{$c->id}/messages?before=999999")
            ->assertNotFound();
    }
}
