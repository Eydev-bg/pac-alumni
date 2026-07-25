<?php

namespace Tests\Feature\Admin;

use App\Enums\JobEmploymentType;
use App\Enums\JobStatus;
use App\Models\User;
use Database\Factories\JobPostingFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminJobPostingControllerTest extends TestCase
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
            'company_name' => 'Acme Corp',
            'job_position' => 'Software Engineer',
            'location' => 'Cebu City',
            'employment_type' => JobEmploymentType::FULL_TIME->value,
            'description' => 'Build and maintain internal systems.',
            'application_link' => 'https://acme.test/apply',
            'status' => JobStatus::DRAFT->value,
        ], $overrides);
    }

    public function test_index_returns_paginated_job_postings(): void
    {
        JobPostingFactory::new()->count(2)->create();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/job-postings')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'company_name', 'job_position', 'status', 'employment_type']],
                'meta' => ['current_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_store_creates_job_posting(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/job-postings', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.company_name', 'Acme Corp')
            ->assertJsonPath('data.status.value', 'draft');

        $this->assertDatabaseHas('job_postings', ['company_name' => 'Acme Corp', 'status' => 'draft']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/job-postings', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'company_name', 'job_position', 'location', 'employment_type',
                'description', 'application_link', 'status',
            ]);
    }

    public function test_show_returns_job_posting(): void
    {
        $job = JobPostingFactory::new()->create();
        $this->actingAsAdmin();

        $this->getJson("/api/admin/job-postings/{$job->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $job->id);
    }

    public function test_update_modifies_job_posting(): void
    {
        $job = JobPostingFactory::new()->create();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/job-postings/{$job->id}", ['job_position' => 'Senior Engineer'])
            ->assertOk()
            ->assertJsonPath('data.job_position', 'Senior Engineer');

        $this->assertDatabaseHas('job_postings', ['id' => $job->id, 'job_position' => 'Senior Engineer']);
    }

    public function test_destroy_soft_deletes_job_posting(): void
    {
        $job = JobPostingFactory::new()->create();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/job-postings/{$job->id}")->assertOk();
        $this->assertSoftDeleted('job_postings', ['id' => $job->id]);
    }

    public function test_publish_activates_job_posting(): void
    {
        $job = JobPostingFactory::new()->create(); // draft
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/job-postings/{$job->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status.value', 'active');

        $this->assertDatabaseHas('job_postings', ['id' => $job->id, 'status' => 'active']);
    }

    public function test_mark_expired_sets_expired_status(): void
    {
        $job = JobPostingFactory::new()->active()->create();
        $this->actingAsAdmin();

        $this->patchJson("/api/admin/job-postings/{$job->id}/mark-expired")
            ->assertOk()
            ->assertJsonPath('data.status.value', 'expired');

        $this->assertDatabaseHas('job_postings', ['id' => $job->id, 'status' => 'expired']);
    }

    public function test_requires_admin_role(): void
    {
        $this->getJson('/api/admin/job-postings')->assertUnauthorized();

        $this->authAs(User::factory()->create());
        $this->getJson('/api/admin/job-postings')->assertForbidden();
    }
}
