<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Jobs/SendContentPublishedEmails.php
//  Bulk email-on-publish orchestrator. Given a published content
//  item (event | announcement | job_posting), emails every alumni
//  in its target audience exactly once. Safe for ~20k recipients
//  (chunked, per-mail queueing) and safe to re-dispatch
//  (content_email_logs idempotency + unique job lock).
// ═══════════════════════════════════════════════════════════

namespace App\Jobs;

use App\Mail\AnnouncementPublishedMail;
use App\Mail\EventPublishedMail;
use App\Mail\JobPostingPublishedMail;
use App\Models\Announcement;
use App\Models\ContentEmailLog;
use App\Models\Event;
use App\Models\JobPosting;
use App\Models\Notification;
use App\Models\User;
use App\Services\ContentAudienceResolver;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use InvalidArgumentException;

class SendContentPublishedEmails implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    /**
     * Seconds the unique lock is held so two dispatches for the same item
     * cannot run concurrently. The per-user content_email_logs check (plus
     * its unique index) keeps things correct even after the lock expires.
     */
    public int $uniqueFor = 600;

    /**
     * Deliberately carries only type + id, not the Eloquent model:
     * SerializesModels would re-query anyway, and a tiny payload stays
     * valid however long the job waits in the queue.
     *
     * @param  string  $contentType  A ContentEmailLog::TYPE_* value.
     */
    public function __construct(
        public string $contentType,
        public int $contentId,
    ) {}

    public function uniqueId(): string
    {
        return "{$this->contentType}:{$this->contentId}";
    }

    public function handle(ContentAudienceResolver $resolver): void
    {
        $item = $this->loadSendableItem();

        // Deleted, unpublished, or archived/expired before the job ran —
        // the "publish then quickly retract" race. Nothing to send.
        if (!$item) {
            return;
        }

        $audience = match ($this->contentType) {
            ContentEmailLog::TYPE_JOB_POSTING => $resolver->jobPostingQuery(),
            default => $resolver->query($item->target_type, $item->target_value),
        };

        $audience
            // Only what the mailables need: address + full_name parts.
            ->select(['id', 'email', 'first_name', 'middle_name', 'last_name', 'suffix'])
            ->chunkById(500, function (Collection $users) use ($item) {
                foreach ($users as $user) {
                    $this->sendTo($user, $item);
                }
            });
    }

    /**
     * Load the content item, or null when it is gone or no longer in a
     * sendable state: published for event/announcement, visible to alumni
     * (active AND deadline not passed) for jobs — if alumni can't see it
     * in the Career Center, they shouldn't be emailed about it.
     */
    private function loadSendableItem(): Event|Announcement|JobPosting|null
    {
        return match ($this->contentType) {
            ContentEmailLog::TYPE_EVENT => Event::query()->published()->find($this->contentId),
            ContentEmailLog::TYPE_ANNOUNCEMENT => Announcement::query()->published()->find($this->contentId),
            ContentEmailLog::TYPE_JOB_POSTING => JobPosting::query()->visibleToAlumni()->find($this->contentId),
            default => throw new InvalidArgumentException("Unknown content type [{$this->contentType}]."),
        };
    }

    /**
     * Queue the email for one user and record it — never letting one bad
     * recipient abort the batch (same philosophy as AbstractReminderCommand).
     */
    private function sendTo(User $user, Event|Announcement|JobPosting $item): void
    {
        try {
            // Idempotency: survives re-dispatch and retried/resumed chunks.
            if (ContentEmailLog::alreadySent($user->id, $this->contentType, $this->contentId)) {
                return;
            }

            Mail::to($user->email)->queue($this->mailableFor($user, $item));

            // Second channel, same guard: create the in-app bell notification
            // alongside the email. Because it lives inside the alreadySent()
            // guard, a re-dispatch or resumed chunk never double-creates it.
            $this->createNotification($user, $item);

            // Record only AFTER both channels fired, so a crash mid-chunk never
            // marks unnotified users as done. One content_email_logs row now
            // means "user has been notified about this item (email + in-app)".
            // Insert-only: a duplicate key means a racing worker already did it
            // — treat as "already sent", not fatal.
            try {
                ContentEmailLog::record($user->id, $this->contentType, $this->contentId);
            } catch (UniqueConstraintViolationException) {
                // Unique index [user_id, content_type, content_id] did its job.
            }
        } catch (\Throwable $e) {
            Log::error(
                "Content email [{$this->contentType}:{$this->contentId}] failed for user {$user->id}: {$e->getMessage()}"
            );
        }
    }

    /**
     * Create the in-app bell notification for one user, scoped to the same
     * audience the email job already resolved (target scoping for
     * announcements/events, jobPostingQuery() for jobs).
     */
    private function createNotification(User $user, Event|Announcement|JobPosting $item): void
    {
        [$title, $message, $data] = match ($this->contentType) {
            ContentEmailLog::TYPE_ANNOUNCEMENT => [
                'New Announcement',
                $item->title,
                ['announcement_id' => $item->id],
            ],
            ContentEmailLog::TYPE_EVENT => [
                'New Event',
                $item->title,
                ['event_id' => $item->id],
            ],
            ContentEmailLog::TYPE_JOB_POSTING => [
                'New Job Opportunity',
                "{$item->job_position} at {$item->company_name}",
                ['job_posting_id' => $item->id],
            ],
        };

        Notification::create([
            'user_id' => $user->id,
            'type' => $this->contentType,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    private function mailableFor(User $user, Event|Announcement|JobPosting $item): Mailable
    {
        $recipientName = $user->full_name ?: 'Alumnus';
        $base = rtrim((string) config('app.frontend_url'), '/');

        // NOTE: the SPA has list pages only for events/announcements (no
        // /:id detail route), so those links land on the list. Job postings
        // deep-link the same way the in-app notification does.
        return match ($this->contentType) {
            ContentEmailLog::TYPE_EVENT => new EventPublishedMail(
                recipientName: $recipientName,
                eventTitle: $item->title,
                eventBody: $this->plainText($item->content),
                eventLocation: (string) $item->location,
                startDatetime: $item->start_datetime?->format('M j, Y g:i A') ?? '',
                actionUrl: $base . '/alumni/events',
            ),
            ContentEmailLog::TYPE_ANNOUNCEMENT => new AnnouncementPublishedMail(
                recipientName: $recipientName,
                announcementTitle: $item->title,
                announcementBody: $this->plainText($item->content),
                actionUrl: $base . '/alumni/announcements',
            ),
            ContentEmailLog::TYPE_JOB_POSTING => new JobPostingPublishedMail(
                recipientName: $recipientName,
                jobPosition: $item->job_position,
                companyName: $item->company_name,
                jobLocation: (string) $item->location,
                employmentType: $item->employment_type?->label() ?? '',
                actionUrl: $base . '/alumni/careers/' . $item->id,
            ),
        };
    }

    /**
     * Content is sanitized rich-text HTML; the mailables take plain text.
     * Capped so a huge post doesn't bloat every one of ~20k emails.
     */
    private function plainText(?string $html): string
    {
        return Str::limit(trim(html_entity_decode(strip_tags((string) $html), ENT_QUOTES)), 2000);
    }
}
