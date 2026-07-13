<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * Phase 6 QA — Regression test for the batch-update FK integrity fix.
 *
 * Before the fix, BatchUpdateGraduatesRequest had no rule for `data.course_id`,
 * even though GraduateService whitelists `course_id` for batch writes. A client
 * could therefore write an arbitrary (dangling) course_id onto many graduate
 * rows in a single request. The added `exists:courses,id` rule closes that gap.
 *
 * Run with: php artisan test --filter=BatchUpdateGraduatesValidationTest
 */
class BatchUpdateGraduatesValidationTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $admin = User::factory()->admin()->create();
        $token = JWTAuth::fromUser($admin);
        $this->withHeader('Authorization', "Bearer {$token}");
    }

    public function test_batch_update_rejects_nonexistent_course_id(): void
    {
        $this->actingAsAdmin();

        $this->patchJson('/api/admin/graduates/batch-update', [
            'ids' => [999999],            // non-existent graduate → also invalid
            'data' => ['course_id' => 999999], // non-existent course → must be rejected
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('data.course_id');
    }

    public function test_batch_update_requires_at_least_one_id(): void
    {
        $this->actingAsAdmin();

        $this->patchJson('/api/admin/graduates/batch-update', [
            'ids' => [],
            'data' => ['graduation_year' => 2020],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids');
    }
}
