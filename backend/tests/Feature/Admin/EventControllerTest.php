<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Factories\EventFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class EventControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Bus::fake();
    }

    private function authAs(User $user): void
    {
        $this->withHeader('Authorization', 'Bearer ' . JWTAuth::fromUser($user));
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->authAs($admin);

        return $admin;
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Alumni Homecoming',
            'content' => '<p>Join us for the annual homecoming.</p>',
            'target_type' => 'all',
            'start_datetime' => now()->addWeek()->toDateTimeString(),
            'end_datetime' => now()->addWeek()->addHours(4)->toDateTimeString(),
            'location' => 'PAC Gymnasium',
        ], $overrides);
    }

    public function test_index_returns_paginated_events(): void
    {
        EventFactory::new()->count(2)->create();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/events')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'title', 'is_published', 'is_pinned']],
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_store_creates_event(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/events', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.title', 'Alumni Homecoming');

        $this->assertDatabaseHas('events', ['title' => 'Alumni Homecoming', 'location' => 'PAC Gymnasium']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/events', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'content', 'target_type', 'start_datetime', 'end_datetime', 'location']);
    }

    public function test_show_returns_event(): void
    {
        $event = EventFactory::new()->create();
        $this->actingAsAdmin();

        $this->getJson("/api/admin/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $event->id);
    }

    public function test_update_modifies_event(): void
    {
        $event = EventFactory::new()->create();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/events/{$event->id}", ['title' => 'Renamed Event', 'target_type' => 'all'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Renamed Event');

        $this->assertDatabaseHas('events', ['id' => $event->id, 'title' => 'Renamed Event']);
    }

    public function test_destroy_soft_deletes_event(): void
    {
        $event = EventFactory::new()->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/events/{$event->id}")->assertOk();
        $this->assertSoftDeleted('events', ['id' => $event->id]);
    }

    public function test_publish_sets_published(): void
    {
        $event = EventFactory::new()->create();
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/events/{$event->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->assertDatabaseHas('events', ['id' => $event->id, 'is_published' => 1]);
    }

    public function test_archive_sets_archived_at(): void
    {
        $event = EventFactory::new()->published()->create();
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/events/{$event->id}/archive")->assertOk();
        $this->assertNotNull($event->fresh()->archived_at);
    }

    public function test_pin_toggle(): void
    {
        $event = EventFactory::new()->create();
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/events/{$event->id}/pin")
            ->assertOk()
            ->assertJsonPath('data.is_pinned', true);
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/events')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/events')->assertForbidden();
    }
}
