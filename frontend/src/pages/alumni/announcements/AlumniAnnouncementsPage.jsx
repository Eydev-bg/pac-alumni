import { useEffect, useState, useCallback } from "react";
import DOMPurify from "dompurify";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import useModalA11y from "../../../hooks/useModalA11y";
import { timeAgo, storageUrl } from "../../../utils/formatters";
import {
  HiOutlineMegaphone,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineClock,
} from "react-icons/hi2";
import { HiOutlineBookmark } from "react-icons/hi2";

export default function AlumniAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [unread, setUnread] = useState(0);
  const [active, setActive] = useState(null);

  const loadUnread = useCallback(() => {
    alumniApi
      .getAnnouncementsUnreadCount()
      .then((res) => setUnread(res.data.data.unread_count))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    alumniApi
      .getAnnouncements({ page })
      .then((res) => {
        setItems(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError("Failed to load announcements."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadUnread();
  }, [loadUnread]);

  const openAnnouncement = async (a) => {
    setActive(a);
    if (a.is_read) return;
    try {
      await alumniApi.markAnnouncementRead(a.id);
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // Non-fatal — viewing still works even if the read receipt fails.
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
              <HiOutlineMegaphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[0.72rem] text-[#c8a84e] font-semibold tracking-wider uppercase mb-1">
                Stay Updated
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Announcements</h1>
              <p className="text-sm text-white/70 mt-0.5">
                {unread > 0
                  ? `You have ${unread} unread announcement${unread > 1 ? "s" : ""}.`
                  : "You're all caught up."}
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
        <div className="text-slate-500 text-sm">Loading announcements…</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
          No announcements yet. Check back soon.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} onOpen={() => openAnnouncement(a)} />
          ))}
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}

      {active && <AnnouncementModal announcement={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function AnnouncementCard({ announcement: a, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className={`w-full text-left block bg-white rounded-xl border p-5 transition-all hover:shadow-sm ${
        a.is_read ? "border-slate-200" : "border-[#c8a84e]/40 ring-1 ring-[#c8a84e]/20"
      }`}
    >
      <div className="flex items-start gap-3">
        {!a.is_read && (
          <span className="mt-1.5 w-2 h-2 rounded-full bg-[#c8a84e] flex-shrink-0" title="Unread" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {a.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#c8a84e]/10 text-[#a88a3a]">
                <HiOutlineBookmark className="w-3 h-3" /> Pinned
              </span>
            )}
            <h3
              className={`text-sm truncate ${
                a.is_read ? "font-semibold text-slate-700" : "font-bold text-slate-900"
              }`}
            >
              {a.title}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 announcement-snippet">
            {stripHtml(a.content)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-slate-400">
            {a.posted_by && (
              <span className="flex items-center gap-1">
                <HiOutlineUser className="w-3.5 h-3.5" /> {a.posted_by}
              </span>
            )}
            {a.published_at && (
              <span className="flex items-center gap-1">
                <HiOutlineClock className="w-3.5 h-3.5" /> {timeAgo(a.published_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function AnnouncementModal({ announcement: a, onClose }) {
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
          aria-labelledby="announcement-modal-title"
          tabIndex={-1}
          className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full focus:outline-none"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]/30 transition-colors z-10"
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
            <h2 id="announcement-modal-title" className="text-xl font-bold text-slate-900">
              {a.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-slate-400">
              {a.posted_by && (
                <span className="flex items-center gap-1">
                  <HiOutlineUser className="w-3.5 h-3.5" /> {a.posted_by}
                </span>
              )}
              {a.published_at && (
                <span className="flex items-center gap-1">
                  <HiOutlineClock className="w-3.5 h-3.5" /> {timeAgo(a.published_at)}
                </span>
              )}
            </div>

            <div
              className="announcement-content mt-4 text-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.content) }}
            />
          </div>
        </div>
      </div>

      {/* Minimal styling for rendered rich-text content. */}
      <style>{`.announcement-content h1{font-size:1.25rem;font-weight:700;margin:.5rem 0}
        .announcement-content h2{font-size:1.1rem;font-weight:700;margin:.5rem 0}
        .announcement-content h3{font-size:1rem;font-weight:600;margin:.5rem 0}
        .announcement-content p{margin:.5rem 0}
        .announcement-content ul{list-style:disc;padding-left:1.25rem;margin:.5rem 0}
        .announcement-content ol{list-style:decimal;padding-left:1.25rem;margin:.5rem 0}
        .announcement-content a{color:#1a2e5a;text-decoration:underline}
        .announcement-content blockquote{border-left:3px solid #c8a84e;padding-left:.75rem;color:#475569;margin:.5rem 0}
        .announcement-snippet{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>
    </div>
  );
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
