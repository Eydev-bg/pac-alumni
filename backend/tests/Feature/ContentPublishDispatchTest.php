<?php

namespace Tests\Feature;

use App\Enums\JobEmploymentType;
use App\Enums\JobStatus;
use App\Jobs\SendContentPublishedEmails;
use App\Models\ContentEmailLog;
use App\Models\User;
use App\Services\Admin\AdminJobPostingService;
use App\Services\Admin\AnnouncementService;
use App\Services\Admin\EventService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

/**
 * Wiring tests: the admin services dispatch SendContentPublishedEmails on the
 * transition into a published/active state, and only then. The job's own
 * behavior is covered by SendContentPublishedEmailsTest.
 */
class ContentPublishDispatchTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Bus::fake();
        $this->admin = User::factory()->admin()->create();
    }

    // ─── Helpers ─────────────────────────────────────────────

    private function eventData(array $overrides = []): array
    {
        return $overrides + [
            'title' => 'Alumni Homecoming',
            'content' => '<p>Join us.</p>',
            'target_type' => 'all',
            'start_datetime' => now()->addWeek()->toDateTimeString(),
            'end_datetime' => now()->addWeek()->addHours(4)->toDateTimeString(),
            'location' => 'PAC Gymnasium',
        ];
    }

    private function announcementData(array $overrides = []): array
    {
        return $overrides + [
            'title' => 'New Scholarship',
            'content' => '<p>Applications open.</p>',
            'target_type' => 'all',
        ];
    }

    private function jobData(array $overrides = []): array
    {
        return $overrides + [
            'company_name' => 'Acme Corp',
            'job_position' => 'Software Engineer',
            'location' => 'Cebu City',
            'employment_type' => JobEmploymentType::FULL_TIME->value,
            'description' => '<p>Build things.</p>',
            'application_link' => 'https://acme.test/apply',
            'status' => JobStatus::DRAFT->value,
        ];
    }

    private function assertDispatchedOnceFor(string $contentType, int $contentId): void
    {
        Bus::assertDispatchedTimes(
            SendContentPublishedEmails::class,
            1
        );
        Bus::assertDispatched(
            SendContentPublishedEmails::class,
            fn (SendContentPublishedEmails $job) => $job->contentType === $contentType
                && $job->contentId === $contentId
        );
    }

    // ─── Events ──────────────────────────────────────────────

    public function test_creating_published_event_dispatches(): void
    {
        $event = (new EventService())->create($this->admin, $this->eventData(['is_published' => true]));

        $this->assertDispatchedOnceFor(ContentEmailLog::TYPE_EVENT, $event->id);
    }

    public function test_creating_draft_event_does_not_dispatch(): void
    {
        (new EventService())->create($this->admin, $this->eventData(['is_published' => false]));

        Bus::assertNotDispatched(SendContentPublishedEmails::class);
    }

    public function test_publishing_event_dispatches_once_and_republish_does_not(): void
    {
        $service = new EventService();
        $event = $service->create($this->admin, $this->eventData(['is_published' => false]));

        $service->publish($event->id);
        $service->publish($event->id); // already live — must not dispatch again

        $this->assertDispatchedOnceFor(ContentEmailLog::TYPE_EVENT, $event->id);
    }

    public function test_event_update_archive_and_toggle_pin_never_dispatch(): void
    {
        $service = new EventService();
        $draft = $service->create($this->admin, $this->eventData(['is_published' => false]));

        $service->update($draft->id, ['title' => 'Renamed']);
        $service->archive($draft->id);
        $service->togglePin($draft->id);

        Bus::assertNotDispatched(SendContentPublishedEmails::class);
    }

    // ─── Announcements ───────────────────────────────────────

    public function test_creating_published_announcement_dispatches(): void
    {
        $announcement = (new AnnouncementService())
            ->create($this->admin, $this->announcementData(['is_published' => true]));

        $this->assertDispatchedOnceFor(ContentEmailLog::TYPE_ANNOUNCEMENT, $announcement->id);
    }

    public function test_publishing_announcement_dispatches_once_and_republish_does_not(): void
    {
        $service = new AnnouncementService();
        $announcement = $service->create($this->admin, $this->announcementData(['is_published' => false]));
        Bus::assertNotDispatched(SendContentPublishedEmails::class); // draft create is silent

        $service->publish($announcement->id);
        $service->publish($announcement->id);

        $this->assertDispatchedOnceFor(ContentEmailLog::TYPE_ANNOUNCEMENT, $announcement->id);
    }

    public function test_announcement_update_archive_and_toggle_pin_never_dispatch(): void
    {
        $service = new AnnouncementService();
        $draft = $service->create($this->admin, $this->announcementData(['is_published' => false]));

        $service->update($draft->id, ['title' => 'Renamed']);
        $service->archive($draft->id);
        $service->togglePin($draft->id);

        Bus::assertNotDispatched(SendContentPublishedEmails::class);
    }

    // ─── Job postings ────────────────────────────────────────

    public function test_creating_active_job_posting_dispatches_and_still_notifies_in_app(): void
    {
        $alumni = User::factory()->create();

        $job = (new AdminJobPostingService())
            ->create($this->admin, $this->jobData(['status' => JobStatus::ACTIVE->value]));

        $this->assertDispatchedOnceFor(ContentEmailLog::TYPE_JOB_POSTING, $job->id);

        // The in-app bell notification is additive and must survive the wiring.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $alumni->id,
            'type' => 'job_posting',
        ]);
    }

    public function test_draft_job_posting_dispatches_only_on_first_publish(): void
    {
        $service = new AdminJobPostingService();
        $job = $service->create($this->admin, $this->jobData());
        Bus::assertNotDispatched(SendContentPublishedEmails::class); // draft create is silent

        $service->publish($job->id);
        $service->publish($job->id); // already active — must not dispatch again

        $this->assertDispatchedOnceFor(ContentEmailLog::TYPE_JOB_POSTING, $job->id);
    }

    public function test_job_posting_update_and_mark_expired_never_dispatch(): void
    {
        $service = new AdminJobPostingService();
        $job = $service->create($this->admin, $this->jobData());

        $service->update($job->id, ['job_position' => 'Senior Engineer']);
        $service->markExpired($job->id);

        Bus::assertNotDispatched(SendContentPublishedEmails::class);
    }
}
