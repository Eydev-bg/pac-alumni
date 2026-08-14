<?php

namespace Tests\Feature\Alumni;

use App\Enums\JobSource;
use App\Models\Graduate;
use App\Models\User;
use Database\Factories\AlumniProfileFactory;
use Database\Factories\JobPostingFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

/**
 * N+1 regression guard for the job posting lists.
 *
 * The "Posted by [name] · [course], [year]" badge walks
 * postedByAlumni → alumniProfile → graduate → course. Without eager loading
 * that is 4 extra queries per row; these tests assert the query count stays
 * flat as the number of rows grows.
 */
class AlumniJobPostingQueryCountTest extends TestCase
{
    use RefreshDatabase;

    private function authAs(User $user): void
    {
        $this->withHeader('Authorization', 'Bearer ' . JWTAuth::fromUser($user));
    }

    private function makeAlumni(): User
    {
        $user = User::factory()->create();
        $graduate = Graduate::factory()->create(['user_id' => $user->id]);
        AlumniProfileFactory::new()->create([
            'user_id' => $user->id,
            'graduate_id' => $graduate->id,
        ]);

        return $user;
    }

    /**
     * Count the queries a request issues.
     *
     * The request runs twice and only the second is measured: the first hit
     * of a test warms one-off work (TrackLastActive's throttled UPDATE, the
     * maintenance-settings read), which would otherwise swamp the signal.
     */
    private function countQueries(callable $request): int
    {
        $request();

        DB::flushQueryLog();
        DB::enableQueryLog();
        $request();
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    }

    public function test_career_center_listing_does_not_n_plus_one(): void
    {
        $viewer = $this->makeAlumni();

        // Each posting authored by a *different* alumni, so a lazy-loaded
        // relation could not be de-duplicated by the identity map.
        foreach (range(1, 5) as $ignored) {
            JobPostingFactory::new()->active()->create([
                'source' => JobSource::ALUMNI->value,
                'posted_by_alumni' => $this->makeAlumni()->id,
            ]);
        }

        $this->authAs($viewer);

        $withFive = $this->countQueries(
            fn () => $this->getJson('/api/alumni/job-postings')->assertOk(),
        );

        foreach (range(1, 5) as $ignored) {
            JobPostingFactory::new()->active()->create([
                'source' => JobSource::ALUMNI->value,
                'posted_by_alumni' => $this->makeAlumni()->id,
            ]);
        }

        $withTen = $this->countQueries(
            fn () => $this->getJson('/api/alumni/job-postings')
                ->assertOk()
                ->assertJsonPath('meta.total', 10),
        );

        $this->assertSame(
            $withFive,
            $withTen,
            "Career Center listing scales with row count ({$withFive} queries for 5 rows, {$withTen} for 10) — a relation is being lazy-loaded per row.",
        );
    }

    public function test_my_posts_listing_does_not_n_plus_one(): void
    {
        $alumni = $this->makeAlumni();

        JobPostingFactory::new()->active()->count(3)->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
        ]);

        $this->authAs($alumni);

        $withThree = $this->countQueries(
            fn () => $this->getJson('/api/alumni/careers/my-posts')->assertOk(),
        );

        JobPostingFactory::new()->count(3)->create([
            'source' => JobSource::ALUMNI->value,
            'posted_by_alumni' => $alumni->id,
        ]);

        $withSix = $this->countQueries(
            fn () => $this->getJson('/api/alumni/careers/my-posts')
                ->assertOk()
                ->assertJsonPath('meta.total', 6),
        );

        $this->assertSame($withThree, $withSix, 'My Posts listing lazy-loads a relation per row.');
    }

    public function test_admin_listing_does_not_n_plus_one(): void
    {
        $admin = User::factory()->admin()->create();

        foreach (range(1, 4) as $ignored) {
            JobPostingFactory::new()->active()->create([
                'source' => JobSource::ALUMNI->value,
                'posted_by_alumni' => $this->makeAlumni()->id,
            ]);
        }

        $this->authAs($admin);

        $withFour = $this->countQueries(
            fn () => $this->getJson('/api/admin/job-postings')->assertOk(),
        );

        foreach (range(1, 4) as $ignored) {
            JobPostingFactory::new()->active()->create([
                'source' => JobSource::ALUMNI->value,
                'posted_by_alumni' => $this->makeAlumni()->id,
            ]);
        }

        $withEight = $this->countQueries(
            fn () => $this->getJson('/api/admin/job-postings')
                ->assertOk()
                ->assertJsonPath('meta.total', 8),
        );

        $this->assertSame($withFour, $withEight, 'Admin job listing lazy-loads postedBy/postedByAlumni per row.');
    }
}
