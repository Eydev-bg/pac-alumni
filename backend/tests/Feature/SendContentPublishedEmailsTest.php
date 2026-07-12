<?php

namespace Tests\Feature;

use App\Enums\EducationLevel;
use App\Enums\JobEmploymentType;
use App\Enums\JobStatus;
use App\Jobs\SendContentPublishedEmails;
use App\Mail\AnnouncementPublishedMail;
use App\Mail\EventPublishedMail;
use App\Mail\JobPostingPublishedMail;
use App\Models\AlumniProfile;
use App\Models\Announcement;
use App\Models\ContentEmailLog;
use App\Models\Course;
use App\Models\Department;
use App\Models\Event;
use App\Models\Graduate;
use App\Models\JobPosting;
use App\Models\User;
use App\Services\ContentAudienceResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendContentPublishedEmailsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->admin = User::factory()->admin()->create();
    }

    // ─── Helpers ─────────────────────────────────────────────

    private function runJob(string $contentType, int $contentId): void
    {
        (new SendContentPublishedEmails($contentType, $contentId))
            ->handle(new ContentAudienceResolver());
    }

    /**
     * Create an active alumni user; pass $graduate attributes to also attach
     * an AlumniProfile → Graduate chain (null = no profile at all).
     */
    private function makeAlumni(?array $graduate = [], array $userAttrs = []): User
    {
        $user = User::factory()->create($userAttrs);

        if ($graduate !== null) {
            $record = Graduate::create($graduate + [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'education_level' => EducationLevel::COLLEGE,
                'graduation_year' => 2024,
                'user_id' => $user->id,
            ]);

            AlumniProfile::create([
                'user_id' => $user->id,
                'graduate_id' => $record->id,
            ]);
        }

        return $user;
    }

    private function makeEvent(array $attrs = []): Event
    {
        return Event::create($attrs + [
            'admin_id' => $this->admin->id,
            'title' => 'Alumni Homecoming',
            'content' => '<p>Join us for the <strong>annual homecoming</strong>.</p>',
            'target_type' => 'all',
            'target_value' => null,
            'is_published' => true,
            'published_at' => now(),
            'start_datetime' => now()->addWeek(),
            'end_datetime' => now()->addWeek()->addHours(4),
            'location' => 'PAC Gymnasium',
        ]);
    }

    private function makeAnnouncement(array $attrs = []): Announcement
    {
        return Announcement::create($attrs + [
            'admin_id' => $this->admin->id,
            'title' => 'New Scholarship',
            'content' => '<p>Applications are <em>now open</em>.</p>',
            'target_type' => 'all',
            'target_value' => null,
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    private function makeJobPosting(array $attrs = []): JobPosting
    {
        return JobPosting::create($attrs + [
            'posted_by' => $this->admin->id,
            'company_name' => 'Acme Corp',
            'job_position' => 'Software Engineer',
            'location' => 'Cebu City',
            'employment_type' => JobEmploymentType::FULL_TIME,
            'description' => 'Build things.',
            'application_link' => 'https://acme.test/apply',
            'status' => JobStatus::ACTIVE,
            'published_at' => now(),
        ]);
    }

    // ─── Event: 'all' audience ───────────────────────────────

    public function test_all_targeted_event_queues_one_mail_per_active_alumni(): void
    {
        $alumni = [$this->makeAlumni(), $this->makeAlumni(), $this->makeAlumni(null)];
        $event = $this->makeEvent();

        $this->runJob(ContentEmailLog::TYPE_EVENT, $event->id);

        Mail::assertQueued(EventPublishedMail::class, count($alumni));
        foreach ($alumni as $user) {
            Mail::assertQueued(EventPublishedMail::class, fn ($m) => $m->hasTo($user->email));
        }
        // The admin author must not be emailed.
        Mail::assertNotQueued(EventPublishedMail::class, fn ($m) => $m->hasTo($this->admin->email));
    }

    // ─── Event: targeted audience ────────────────────────────

    public function test_course_targeted_event_only_queues_for_matching_alumni(): void
    {
        $department = Department::create(['name' => 'Computer Department', 'code' => 'CD']);
        $course = Course::create(['name' => 'BSIT', 'code' => 'BSIT', 'department_id' => $department->id]);

        $match = $this->makeAlumni(['course_id' => $course->id]);
        $noCourse = $this->makeAlumni();
        $event = $this->makeEvent([
            'target_type' => 'course',
            'target_value' => (string) $course->id,
        ]);

        $this->runJob(ContentEmailLog::TYPE_EVENT, $event->id);

        Mail::assertQueued(EventPublishedMail::class, 1);
        Mail::assertQueued(EventPublishedMail::class, fn ($m) => $m->hasTo($match->email));
        Mail::assertNotQueued(EventPublishedMail::class, fn ($m) => $m->hasTo($noCourse->email));
    }

    // ─── Idempotency ─────────────────────────────────────────

    public function test_running_twice_does_not_double_send_and_logs_one_row_per_user(): void
    {
        $this->makeAlumni();
        $this->makeAlumni();
        $event = $this->makeEvent();

        $this->runJob(ContentEmailLog::TYPE_EVENT, $event->id);
        Mail::assertQueued(EventPublishedMail::class, 2);

        Mail::fake(); // reset the recorder, then re-run the same job
        $this->runJob(ContentEmailLog::TYPE_EVENT, $event->id);

        Mail::assertNotQueued(EventPublishedMail::class);
        $this->assertSame(2, ContentEmailLog::where('content_type', ContentEmailLog::TYPE_EVENT)
            ->where('content_id', $event->id)
            ->count());
    }

    public function test_user_with_preexisting_log_row_is_skipped(): void
    {
        $alreadySent = $this->makeAlumni();
        $fresh = $this->makeAlumni();
        $event = $this->makeEvent();

        ContentEmailLog::record($alreadySent->id, ContentEmailLog::TYPE_EVENT, $event->id);

        $this->runJob(ContentEmailLog::TYPE_EVENT, $event->id);

        Mail::assertQueued(EventPublishedMail::class, 1);
        Mail::assertQueued(EventPublishedMail::class, fn ($m) => $m->hasTo($fresh->email));
        Mail::assertNotQueued(EventPublishedMail::class, fn ($m) => $m->hasTo($alreadySent->email));
    }

    // ─── Job posting path ────────────────────────────────────

    public function test_job_posting_queues_mail_to_all_active_alumni(): void
    {
        $alumni = [$this->makeAlumni(), $this->makeAlumni(null)];
        $job = $this->makeJobPosting(['application_deadline' => now()->addMonth()]);

        $this->runJob(ContentEmailLog::TYPE_JOB_POSTING, $job->id);

        Mail::assertQueued(JobPostingPublishedMail::class, count($alumni));
        foreach ($alumni as $user) {
            Mail::assertQueued(JobPostingPublishedMail::class, fn ($m) => $m->hasTo($user->email));
        }
        Mail::assertQueued(JobPostingPublishedMail::class, fn ($m) => $m->jobPosition === 'Software Engineer'
            && $m->companyName === 'Acme Corp'
            && $m->employmentType === 'Full-time'
            && str_ends_with((string) $m->actionUrl, "/alumni/careers/{$job->id}"));
    }

    public function test_job_posting_with_past_deadline_sends_nothing_even_when_active(): void
    {
        $this->makeAlumni();
        $job = $this->makeJobPosting(['application_deadline' => now()->subDay()]);

        $this->runJob(ContentEmailLog::TYPE_JOB_POSTING, $job->id);

        Mail::assertNothingQueued();
        $this->assertSame(0, ContentEmailLog::count());
    }

    // ─── Retracted-before-send races ─────────────────────────

    public function test_archived_event_sends_nothing(): void
    {
        $this->makeAlumni();
        $archived = $this->makeEvent(['archived_at' => now()]);
        $unpublished = $this->makeEvent(['is_published' => false]);

        $this->runJob(ContentEmailLog::TYPE_EVENT, $archived->id);
        $this->runJob(ContentEmailLog::TYPE_EVENT, $unpublished->id);

        Mail::assertNothingQueued();
        $this->assertSame(0, ContentEmailLog::count());
    }

    // ─── Announcement path ───────────────────────────────────

    public function test_announcement_queues_mail_with_correct_data(): void
    {
        $user = $this->makeAlumni();
        $announcement = $this->makeAnnouncement();

        $this->runJob(ContentEmailLog::TYPE_ANNOUNCEMENT, $announcement->id);

        Mail::assertQueued(AnnouncementPublishedMail::class, function (AnnouncementPublishedMail $m) use ($user) {
            return $m->hasTo($user->email)
                && $m->recipientName === $user->full_name
                && $m->announcementTitle === 'New Scholarship'
                && $m->announcementBody === 'Applications are now open.' // HTML stripped
                && str_ends_with((string) $m->actionUrl, '/alumni/announcements')
                && $m->envelope()->subject === 'New Announcement: New Scholarship';
        });
    }

    // ─── Log bookkeeping ─────────────────────────────────────

    public function test_log_rows_are_written_for_every_queued_recipient(): void
    {
        $alumni = [$this->makeAlumni(), $this->makeAlumni(), $this->makeAlumni()];
        $announcement = $this->makeAnnouncement();

        $this->runJob(ContentEmailLog::TYPE_ANNOUNCEMENT, $announcement->id);

        Mail::assertQueued(AnnouncementPublishedMail::class, count($alumni));
        foreach ($alumni as $user) {
            $this->assertTrue(ContentEmailLog::alreadySent(
                $user->id,
                ContentEmailLog::TYPE_ANNOUNCEMENT,
                $announcement->id
            ));
        }
        $this->assertSame(count($alumni), ContentEmailLog::count());
    }
}
