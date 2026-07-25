<?php

namespace Tests\Feature\Admin;

use App\Models\Announcement;
use App\Models\User;
use Database\Factories\AnnouncementFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AnnouncementControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Publishing dispatches SendContentPublishedEmails — fake the bus so the
        // controller tests stay focused on the HTTP surface.
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
            'title' => 'New Scholarship Program',
            'content' => '<p>Applications are now open.</p>',
            'target_type' => 'all',
        ], $overrides);
    }

    public function test_index_returns_paginated_announcements(): void
    {
        AnnouncementFactory::new()->count(2)->create();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/announcements')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'title', 'is_published', 'is_pinned']],
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_store_creates_announcement(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/announcements', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.title', 'New Scholarship Program');

        $this->assertDatabaseHas('announcements', ['title' => 'New Scholarship Program']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/announcements', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'content', 'target_type']);
    }

    public function test_show_returns_announcement(): void
    {
        $announcement = AnnouncementFactory::new()->create();
        $this->actingAsAdmin();

        $this->getJson("/api/admin/announcements/{$announcement->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $announcement->id);
    }

    public function test_update_modifies_announcement(): void
    {
        $announcement = AnnouncementFactory::new()->create();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/announcements/{$announcement->id}", ['title' => 'Updated Title', 'target_type' => 'all'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated Title');

        $this->assertDatabaseHas('announcements', ['id' => $announcement->id, 'title' => 'Updated Title']);
    }

    public function test_destroy_soft_deletes_announcement(): void
    {
        $announcement = AnnouncementFactory::new()->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/announcements/{$announcement->id}")->assertOk();
        $this->assertSoftDeleted('announcements', ['id' => $announcement->id]);
    }

    public function test_publish_sets_published(): void
    {
        $announcement = AnnouncementFactory::new()->create(); // draft
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/announcements/{$announcement->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->assertDatabaseHas('announcements', ['id' => $announcement->id, 'is_published' => 1]);
    }

    public function test_archive_sets_archived_at(): void
    {
        $announcement = AnnouncementFactory::new()->published()->create();
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/announcements/{$announcement->id}/archive")->assertOk();
        $this->assertNotNull($announcement->fresh()->archived_at);
    }

    public function test_pin_toggle(): void
    {
        $announcement = AnnouncementFactory::new()->create(); // unpinned
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/announcements/{$announcement->id}/pin")
            ->assertOk()
            ->assertJsonPath('data.is_pinned', true);
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/announcements')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/announcements')->assertForbidden();
    }
}
