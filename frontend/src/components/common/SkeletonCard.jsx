// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/components/common/SkeletonCard.jsx
//  Phase 4A — reusable light-theme loading skeletons.
//  Each variant mirrors the dimensions of the real list row it
//  stands in for, so swapping in the data causes no layout shift.
// ═══════════════════════════════════════════════════════════

// Single grey pulse bar. Sizes are passed as Tailwind classes.
function Bar({ className = "" }) {
  return <div className={`rounded bg-slate-200 ${className}`} />;
}

// ── Card-style variants (self-contained white cards) ──

// Announcements: title + 2-line snippet + meta row (rounded-xl p-5 card).
function AnnouncementSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <Bar className="h-4 w-2/5" />
      <div className="mt-3 space-y-2">
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-3/4" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <Bar className="h-3 w-24" />
        <Bar className="h-3 w-16" />
      </div>
    </div>
  );
}

// Career Center: company-logo square + title/company/meta (rounded-xl p-5).
function JobSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Bar className="h-4 w-1/2" />
          <Bar className="mt-2 h-3.5 w-1/3" />
          <div className="mt-3 flex items-center gap-4">
            <Bar className="h-3 w-24" />
            <Bar className="h-3 w-20" />
            <Bar className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Events: date badge column + title/meta/snippet (rounded-2xl p-6 card).
function EventSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-[4.5rem] rounded-xl bg-slate-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Bar className="h-4 w-1/2" />
          <Bar className="mt-2 h-3 w-1/3" />
          <div className="mt-3 space-y-2">
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bare row variants (rendered inside an existing white card) ──

// Notifications: unread dot + title/message/date rows (p-4).
function NotificationSkeleton() {
  return (
    <div className="p-4 flex items-start gap-3 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-slate-200 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Bar className="h-3.5 w-1/3" />
        <Bar className="mt-2 h-3 w-3/4" />
        <Bar className="mt-2 h-3 w-20" />
      </div>
    </div>
  );
}

// Inbox: avatar circle + name/preview lines (px-4 py-3 row).
function ConversationSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Bar className="h-3.5 w-1/2" />
          <Bar className="h-3 w-8 flex-shrink-0" />
        </div>
        <Bar className="mt-2 h-3 w-3/4" />
      </div>
    </div>
  );
}

// Form/profile section: a few label + input field rows inside an existing
// white card. Meant to be used with count={1} — one section block, not stacked
// copies — so a loading form section causes no layout shift.
function FormSectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Bar className="h-3 w-24" /> {/* label */}
          <Bar className="h-10 w-full rounded-xl" /> {/* input */}
        </div>
      ))}
    </div>
  );
}

const VARIANTS = {
  announcement: { Row: AnnouncementSkeleton, bare: false },
  job: { Row: JobSkeleton, bare: false },
  event: { Row: EventSkeleton, bare: false },
  notification: { Row: NotificationSkeleton, bare: true },
  conversation: { Row: ConversationSkeleton, bare: true },
  // Bare — renders inside an existing card. Use with count={1}.
  form: { Row: FormSectionSkeleton, bare: true },
};

/**
 * Loading skeleton list for the Alumni list pages.
 *
 * @param {"announcement"|"job"|"event"|"notification"|"conversation"|"form"} variant
 * @param {number} count  Number of skeleton rows (3–5 recommended; use count={1} for "form").
 */
export default function SkeletonCard({ variant = "announcement", count = 4 }) {
  const { Row, bare } = VARIANTS[variant] || VARIANTS.announcement;
  return (
    <div
      role="status"
      aria-label="Loading"
      className={bare ? "divide-y divide-slate-100" : "space-y-3"}
    >
      {Array.from({ length: count }, (_, i) => (
        <Row key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
