<?php

namespace Tests\Feature\Admin;

use App\Models\Graduate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class GraduateControllerTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_index_returns_paginated_graduates(): void
    {
        Graduate::factory()->count(3)->create();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/graduates')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'full_name', 'education_level', 'graduation_year']],
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 3);
    }

    public function test_index_filters_by_education_level(): void
    {
        Graduate::factory()->count(2)->create();              // college
        Graduate::factory()->elementary()->create();          // elementary
        $this->actingAsAdmin();

        $this->getJson('/api/admin/graduates?education_level=elementary')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_show_returns_graduate(): void
    {
        $graduate = Graduate::factory()->create();
        $this->actingAsAdmin();

        $this->getJson("/api/admin/graduates/{$graduate->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $graduate->id);
    }

    public function test_show_returns_404_for_unknown(): void
    {
        $this->actingAsAdmin();
        $this->getJson('/api/admin/graduates/999999')->assertNotFound();
    }

    public function test_update_modifies_graduate(): void
    {
        $graduate = Graduate::factory()->create();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/graduates/{$graduate->id}", [
            'first_name' => 'Reynaldo',
            'graduation_year' => 2021,
        ])
            ->assertOk()
            ->assertJsonPath('data.first_name', 'Reynaldo');

        $this->assertDatabaseHas('graduates', [
            'id' => $graduate->id,
            'first_name' => 'Reynaldo',
            'graduation_year' => 2021,
        ]);
    }

    public function test_destroy_soft_deletes_graduate(): void
    {
        $graduate = Graduate::factory()->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/graduates/{$graduate->id}")->assertOk();
        $this->assertSoftDeleted('graduates', ['id' => $graduate->id]);
    }

    public function test_trashed_lists_soft_deleted_graduates(): void
    {
        $graduate = Graduate::factory()->create();
        $graduate->delete();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/graduates/trashed')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_restore_recovers_soft_deleted_graduate(): void
    {
        $graduate = Graduate::factory()->create();
        $graduate->delete();
        $this->actingAsAdmin();

        $this->postJson("/api/admin/graduates/{$graduate->id}/restore")->assertOk();
        $this->assertNotSoftDeleted('graduates', ['id' => $graduate->id]);
    }

    public function test_force_delete_permanently_removes_graduate(): void
    {
        $graduate = Graduate::factory()->create();
        $graduate->delete();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/graduates/{$graduate->id}/force")->assertOk();
        $this->assertDatabaseMissing('graduates', ['id' => $graduate->id]);
    }

    public function test_force_delete_blocked_when_alumni_account_is_linked(): void
    {
        // Every FK onto graduates cascades, so force-deleting a registered
        // alumni would silently take their profile, employment and board exam
        // records with it. Only unclaimed master-list entries may be purged.
        $alumni = User::factory()->create();
        $graduate = Graduate::factory()->withUser($alumni)->create();
        $graduate->delete();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/graduates/{$graduate->id}/force")
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'Cannot permanently delete a graduate with a linked alumni account.',
            );

        $this->assertSoftDeleted('graduates', ['id' => $graduate->id]);
    }

    public function test_graduation_years_returns_list(): void
    {
        Graduate::factory()->create(['graduation_year' => 2021]);
        Graduate::factory()->create(['graduation_year' => 2023]);
        $this->actingAsAdmin();

        $data = $this->getJson('/api/admin/graduates/years')
            ->assertOk()
            ->json('data');

        $this->assertIsArray($data);
        $this->assertContains(2021, $data);
        $this->assertContains(2023, $data);
    }

    public function test_batch_update_updates_multiple_graduates(): void
    {
        $graduates = Graduate::factory()->count(2)->create(['graduation_year' => 2019]);
        $this->actingAsAdmin();

        $this->patchJson('/api/admin/graduates/batch-update', [
            'ids' => $graduates->pluck('id')->all(),
            'data' => ['graduation_year' => 2020],
        ])
            ->assertOk()
            ->assertJsonPath('data.updated_count', 2);

        foreach ($graduates as $graduate) {
            $this->assertDatabaseHas('graduates', ['id' => $graduate->id, 'graduation_year' => 2020]);
        }
    }

    public function test_import_requires_integration_coverage(): void
    {
        $this->markTestIncomplete('Import requires queue worker integration test (file upload + async processing).');
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/graduates')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/graduates')->assertForbidden();
    }
}
