import { useEffect, useState, useCallback } from "react";
import DOMPurify from "dompurify";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import { formatDate, storageUrl } from "../../../utils/formatters";
import { RSVP_STATUSES } from "../../../config/eventOptions";
import {
  HiOutlineCalendarDays,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineBookmark,
} from "react-icons/hi2";

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
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ━━━━ Header ━━━━ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e5a] via-[#243a6e] to-[#1e3466] rounded-2xl shadow-lg">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-[#c8a84e]/[0.06]" />
        <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
              <HiOutlineCalendarDays className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[0.72rem] text-[#c8a84e] font-semibold tracking-wider uppercase mb-1">
                Stay Connected
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Events</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Upcoming events and gatherings for alumni.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {/* ━━━━ List ━━━━ */}
      {loading ? (
        <div className="text-slate-500 text-sm">Loading events…</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
          No events yet. Check back soon.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <EventCard
              key={a.id}
              event={a}
              onOpen={() => setActive(a)}
              onRsvp={handleRsvp}
            />
          ))}
          <Pagination meta={meta} onPageChange={setPage} />
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

// Going / Interested toggle buttons built from RSVP_STATUSES.
function RsvpControl({ event: a, onRsvp }) {
  return (
    <div className="flex items-center gap-2">
      {RSVP_STATUSES.map((s) => {
        const activeState = a.my_rsvp === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onRsvp(a, s.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              activeState
                ? "bg-[#1a2e5a] text-white border-[#1a2e5a]"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#1a2e5a]/40 hover:text-[#1a2e5a]"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function EventCard({ event: a, onOpen, onRsvp }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-sm">
      <button onClick={onOpen} className="w-full text-left block">
        <div className="flex items-center gap-2 flex-wrap">
          {a.is_pinned && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#c8a84e]/10 text-[#a88a3a]">
              <HiOutlineBookmark className="w-3 h-3" /> Pinned
            </span>
          )}
          <h3 className="text-sm font-bold text-slate-900 truncate">{a.title}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 event-snippet">
          {stripHtml(a.content)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-slate-400">
          {a.start_datetime && (
            <span className="flex items-center gap-1">
              <HiOutlineCalendarDays className="w-3.5 h-3.5" />
              {formatDate(a.start_datetime)}
            </span>
          )}
          {a.location && (
            <span className="flex items-center gap-1">
              <HiOutlineMapPin className="w-3.5 h-3.5" /> {a.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <HiOutlineUsers className="w-3.5 h-3.5" /> {a.going_count ?? 0} going
          </span>
          {a.posted_by && (
            <span className="flex items-center gap-1">
              <HiOutlineUser className="w-3.5 h-3.5" /> {a.posted_by}
            </span>
          )}
        </div>
      </button>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <RsvpControl event={a} onRsvp={onRsvp} />
      </div>
    </div>
  );
}

function EventModal({ event: a, onClose, onRsvp }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 py-10">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
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

          <div className="p-6">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {a.is_pinned && (
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#c8a84e]/10 text-[#a88a3a]">
                  <HiOutlineBookmark className="w-3 h-3" /> Pinned
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{a.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-slate-400">
              {a.start_datetime && (
                <span className="flex items-center gap-1">
                  <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                  {formatDate(a.start_datetime)} &rarr; {formatDate(a.end_datetime)}
                </span>
              )}
              {a.location && (
                <span className="flex items-center gap-1">
                  <HiOutlineMapPin className="w-3.5 h-3.5" /> {a.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <HiOutlineUsers className="w-3.5 h-3.5" /> {a.going_count ?? 0} going
              </span>
              {a.posted_by && (
                <span className="flex items-center gap-1">
                  <HiOutlineUser className="w-3.5 h-3.5" /> {a.posted_by}
                </span>
              )}
            </div>

            <div className="mt-4">
              <RsvpControl event={a} onRsvp={onRsvp} />
            </div>

            <div
              className="event-content mt-4 text-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.content) }}
            />
          </div>
        </div>
      </div>

      {/* Minimal styling for rendered rich-text content. */}
      <style>{`.event-content h1{font-size:1.25rem;font-weight:700;margin:.5rem 0}
        .event-content h2{font-size:1.1rem;font-weight:700;margin:.5rem 0}
        .event-content h3{font-size:1rem;font-weight:600;margin:.5rem 0}
        .event-content p{margin:.5rem 0}
        .event-content ul{list-style:disc;padding-left:1.25rem;margin:.5rem 0}
        .event-content ol{list-style:decimal;padding-left:1.25rem;margin:.5rem 0}
        .event-content a{color:#1a2e5a;text-decoration:underline}
        .event-content blockquote{border-left:3px solid #c8a84e;padding-left:.75rem;color:#475569;margin:.5rem 0}
        .event-snippet{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>
    </div>
  );
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
