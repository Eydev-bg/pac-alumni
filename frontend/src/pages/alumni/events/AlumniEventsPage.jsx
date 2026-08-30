import { useEffect, useState, useCallback, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import SkeletonCard from "../../../components/common/SkeletonCard";
import EmptyState from "../../../components/common/EmptyState";
import useModalA11y from "../../../hooks/useModalA11y";
import {
  formatDate,
  storageUrl,
  cn,
  stripHtml,
} from "../../../utils/formatters";
import { RSVP_STATUSES } from "../../../config/eventOptions";
import { IconChip } from "../../../components/alumni/ui";
import {
  HiOutlineCalendarDays,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineMapPin,
  HiOutlineBookmark,
  HiOutlineHandThumbUp,
  HiOutlineStar,
} from "react-icons/hi2";

// Extract short month / day-of-month / 12-hour time from an ISO string for the
// prominent date badge. Uses the native Date — no extra libraries.
function dateParts(iso) {
  const d = new Date(iso);
  return {
    mon: d.toLocaleString("en-US", { month: "short" }),
    day: d.getDate(),
    time: d.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

// True once the event's end has passed (compared against the live clock).
function isPast(event) {
  return event.end_datetime && new Date(event.end_datetime) < new Date();
}

// Matches Tailwind's lg breakpoint — the tabs are a mobile treatment, so the
// desktop list keeps showing every event regardless of the selected tab.
const DESKTOP_QUERY = "(min-width: 1024px)";

// going_count tracks only "going" RSVPs, so adjust it when the caller's own
// status crosses the going boundary (keeps the optimistic count accurate).
function applyGoingDelta(prevStatus, nextStatus, goingCount) {
  let c = goingCount ?? 0;
  if (prevStatus === "going" && nextStatus !== "going") c -= 1;
  if (prevStatus !== "going" && nextStatus === "going") c += 1;
  return Math.max(0, c);
}

export default function AlumniEventsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);

  // Batch 5: mobile-only Upcoming / Past tabs, split from the current page
  // client-side (the payload carries start/end datetimes). Hidden on lg+.
  const [tab, setTab] = useState("upcoming");
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // 5A: the page number lives in the URL so refresh and back/forward
  // restore the list position.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

  const handlePageChange = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const load = useCallback(() => {
    setLoading(true);
    alumniApi
      .getEvents({ page })
      .then((res) => {
        setItems(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError("Failed to load events."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // Patch an event across both the list and the open modal.
  const patchEvent = (id, patch) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setActive((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
  };

  // Toggle RSVP optimistically — tapping the active status cancels it, tapping
  // the other switches. Reverts on failure.
  const handleRsvp = async (a, status) => {
    const current = a.my_rsvp ?? null;
    const next = current === status ? null : status;

    patchEvent(a.id, {
      my_rsvp: next,
      going_count: applyGoingDelta(current, next, a.going_count),
    });

    try {
      if (next === null) {
        await alumniApi.cancelEventRsvp(a.id);
      } else {
        await alumniApi.rsvpEvent(a.id, next);
      }
    } catch {
      // Revert to the pre-tap state — the RSVP did not persist.
      patchEvent(a.id, { my_rsvp: current, going_count: a.going_count });
    }
  };

  // Desktop shows the full page; mobile splits it by the selected tab.
  const visibleItems = isDesktop
    ? items
    : items.filter((e) => (tab === "past" ? isPast(e) : !isPast(e)));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ━━━━ Header ━━━━ */}
      <div className="flex items-center gap-3">
        <IconChip icon={HiOutlineCalendarDays} color="blue" size="lg" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Events
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upcoming events and gatherings for alumni.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[0.78rem] text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Mobile-only Upcoming / Past tabs */}
      <div className="lg:hidden flex items-center gap-6 border-b border-slate-200 dark:border-slate-700 px-1">
        {[
          { key: "upcoming", label: "Upcoming" },
          { key: "past", label: "Past" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative -mb-px pb-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-slate-400 border-b-2 border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ━━━━ List ━━━━ */}
      {loading ? (
        <SkeletonCard variant="event" count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={HiOutlineCalendarDays}
          title="No events yet"
          message="Check back soon for upcoming alumni events."
        />
      ) : (
        <div className="space-y-3">
          {visibleItems.length === 0 ? (
            <p className="lg:hidden text-center text-sm text-slate-400 py-10">
              {tab === "past" ? "No past events." : "No upcoming events."}
            </p>
          ) : (
            visibleItems.map((a) => (
              <EventCard
                key={a.id}
                event={a}
                onOpen={() => setActive(a)}
                onRsvp={handleRsvp}
              />
            ))
          )}
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </div>
      )}

      {active && (
        <EventModal
          event={active}
          onClose={() => setActive(null)}
          onRsvp={handleRsvp}
        />
      )}
    </div>
  );
}

// Prominent left-column date badge: month / day / time.
function DateBadge({ iso, size = "md" }) {
  if (!iso) return null;
  const { mon, day, time } = dateParts(iso);
  const dayCls = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center text-center bg-blue-50 dark:bg-blue-500/15 rounded-xl py-3">
      <span className="text-[0.65rem] uppercase font-bold text-blue-600 dark:text-blue-300">
        {mon}
      </span>
      <span
        className={`${dayCls} font-bold text-slate-800 dark:text-slate-100 leading-tight`}
      >
        {day}
      </span>
      <span className="text-[0.65rem] text-slate-400">{time}</span>
    </div>
  );
}

function PinnedBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
      <HiOutlineBookmark className="w-3 h-3 flex-shrink-0" /> Pinned
    </span>
  );
}

function PastBadge() {
  return (
    <span className="inline-flex items-center whitespace-nowrap text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
      Past event
    </span>
  );
}

// Going / Interested pill toggles built from RSVP_STATUSES.
function RsvpControl({ event: a, onRsvp }) {
  const base =
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors";
  return (
    <div className="flex items-center gap-x-2 gap-y-2 flex-wrap">
      {RSVP_STATUSES.map((s) => {
        const activeState = a.my_rsvp === s.value;
        const Icon = s.value === "going" ? HiOutlineHandThumbUp : HiOutlineStar;
        const cls = activeState
          ? s.value === "going"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300"
            : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-300"
          : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600";
        return (
          <Fragment key={s.value}>
            <button
              type="button"
              onClick={() => onRsvp(a, s.value)}
              className={`${base} ${cls}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
            </button>
            {s.value === "going" && (
              <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                ({a.going_count ?? 0} going)
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function EventCard({ event: a, onOpen, onRsvp }) {
  const past = isPast(a);
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl border p-4 sm:p-6 shadow-sm dark:shadow-none transition-all hover:shadow-md dark:hover:shadow-none",
        a.is_pinned
          ? "border-amber-300 ring-1 ring-amber-100 dark:border-amber-500/50 dark:ring-amber-500/20"
          : "border-slate-200 dark:border-slate-700",
        past && "opacity-75",
      )}
    >
      <div className="flex flex-row gap-3 sm:gap-4">
        {/* LEFT: date badge */}
        <DateBadge iso={a.start_datetime} />

        {/* RIGHT: content */}
        <div className="flex-1 min-w-0">
          <button onClick={onOpen} className="w-full text-left block">
            <div className="flex items-center gap-2 flex-wrap">
              {a.is_pinned && <PinnedBadge />}
              {past && <PastBadge />}
              <h3 className="min-w-0 flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {a.title}
              </h3>
            </div>

            {a.location && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <HiOutlineMapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="break-words">{a.location}</span>
              </div>
            )}

            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 event-snippet">
              {stripHtml(a.content)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.7rem] text-slate-500 dark:text-slate-400">
              {a.posted_by && (
                <span className="flex items-center gap-1">
                  <HiOutlineUser className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="break-words">{a.posted_by}</span>
                </span>
              )}
              {a.start_datetime && (
                <span className="flex items-center gap-1">
                  <HiOutlineCalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="break-words">
                    {formatDate(a.start_datetime)}
                  </span>
                </span>
              )}
            </div>
          </button>

          {/* RSVP controls — hidden for events that have already ended. */}
          {!past && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <RsvpControl event={a} onRsvp={onRsvp} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventModal({ event: a, onClose, onRsvp }) {
  const past = isPast(a);
  const panelRef = useModalA11y(onClose);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-start justify-center p-4 py-10">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          tabIndex={-1}
          className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-slate-900/50 max-w-2xl w-full focus:outline-none overflow-hidden"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors z-10"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>

          {a.image && (
            <img
              src={storageUrl(a.image)}
              alt={a.title}
              className="w-full max-h-60 object-cover rounded-t-2xl"
            />
          )}

          <div className="p-4 sm:p-6 min-w-0">
            <div className="flex items-start gap-3 sm:gap-4">
              <DateBadge iso={a.start_datetime} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {a.is_pinned && <PinnedBadge />}
                  {past && <PastBadge />}
                </div>
                <h2
                  id="event-modal-title"
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words pr-8"
                >
                  {a.title}
                </h2>
                {a.location && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <HiOutlineMapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="break-words">{a.location}</span>
                  </div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.72rem] text-slate-400">
                  {a.start_datetime && (
                    <span className="flex items-center gap-1">
                      <HiOutlineCalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-words">
                        {formatDate(a.start_datetime)} &rarr;{" "}
                        {formatDate(a.end_datetime)}
                      </span>
                    </span>
                  )}
                  {a.posted_by && (
                    <span className="flex items-center gap-1">
                      <HiOutlineUser className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-words">{a.posted_by}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!past && (
              <div className="mt-4">
                <RsvpControl event={a} onRsvp={onRsvp} />
              </div>
            )}

            <div
              className="event-content mt-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(a.content),
              }}
            />
          </div>
        </div>
      </div>

      {/* Minimal styling for rendered rich-text content (light surface). */}
      <style>{`.event-content{overflow-wrap:break-word;word-break:break-word}
        .event-content h1{font-size:1.25rem;font-weight:700;margin:.5rem 0;color:#1e293b}
        .event-content h2{font-size:1.1rem;font-weight:700;margin:.5rem 0;color:#1e293b}
        .event-content h3{font-size:1rem;font-weight:600;margin:.5rem 0;color:#1e293b}
        .event-content p{margin:.5rem 0}
        .event-content ul{list-style:disc;padding-left:1.25rem;margin:.5rem 0}
        .event-content ol{list-style:decimal;padding-left:1.25rem;margin:.5rem 0}
        .event-content a{color:#2563eb;text-decoration:underline;overflow-wrap:break-word}
        .event-content blockquote{border-left:3px solid #2563eb;padding-left:.75rem;color:#64748b;margin:.5rem 0}
        .event-snippet{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .dark .event-content h1,.dark .event-content h2,.dark .event-content h3{color:#f1f5f9}
        .dark .event-content a{color:#60a5fa}
        .dark .event-content blockquote{color:#cbd5e1}`}</style>
    </div>
  );
}
