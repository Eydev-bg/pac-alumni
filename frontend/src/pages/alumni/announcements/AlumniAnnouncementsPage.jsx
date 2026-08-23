import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import SkeletonCard from "../../../components/common/SkeletonCard";
import EmptyState from "../../../components/common/EmptyState";
import useModalA11y from "../../../hooks/useModalA11y";
import { timeAgo, storageUrl, stripHtml } from "../../../utils/formatters";
import { IconChip } from "../../../components/alumni/ui";
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
  const [unread, setUnread] = useState(0);
  const [active, setActive] = useState(null);

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

  const loadUnread = useCallback(() => {
    alumniApi
      .getAnnouncementsUnreadCount()
      .then((res) => setUnread(res.data.data.unread_count))
      .catch((err) => {
        if (import.meta.env.DEV)
          console.error("Announcements unread count failed:", err);
      });
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
      setItems((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, is_read: true } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // Non-fatal — viewing still works even if the read receipt fails.
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ━━━━ Header ━━━━ */}
      <div className="flex items-center gap-3">
        <IconChip icon={HiOutlineMegaphone} color="blue" size="lg" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Announcements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unread > 0
              ? `You have ${unread} unread announcement${unread > 1 ? "s" : ""}.`
              : "You're all caught up."}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[0.78rem] text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ━━━━ List ━━━━ */}
      {loading ? (
        <SkeletonCard variant="announcement" count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={HiOutlineMegaphone}
          title="No announcements yet"
          message="Check back soon for news and updates from PAC."
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onOpen={() => openAnnouncement(a)}
            />
          ))}
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </div>
      )}

      {active && (
        <AnnouncementModal
          announcement={active}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

function AnnouncementCard({ announcement: a, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className={`w-full text-left block bg-white dark:bg-slate-800 rounded-xl border p-5 transition-all hover:shadow-sm dark:hover:shadow-none ${
        a.is_read
          ? "border-slate-200 dark:border-slate-700"
          : "border-blue-300 ring-1 ring-blue-100 dark:border-blue-500/50 dark:ring-blue-500/20"
      }`}
    >
      <div className="flex items-start gap-3">
        {!a.is_read && (
          <span
            className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"
            title="Unread"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {a.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <HiOutlineBookmark className="w-3 h-3" /> Pinned
              </span>
            )}
            <h3
              className={`text-sm truncate ${
                a.is_read
                  ? "font-semibold text-slate-700 dark:text-slate-200"
                  : "font-bold text-slate-900 dark:text-white"
              }`}
            >
              {a.title}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 announcement-snippet">
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
                <HiOutlineClock className="w-3.5 h-3.5" />{" "}
                {timeAgo(a.published_at)}
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
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/50 max-w-2xl w-full focus:outline-none overflow-hidden"
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

          <div className="p-6 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {a.is_pinned && (
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <HiOutlineBookmark className="w-3 h-3" /> Pinned
                </span>
              )}
            </div>
            <h2
              id="announcement-modal-title"
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
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
                  <HiOutlineClock className="w-3.5 h-3.5" />{" "}
                  {timeAgo(a.published_at)}
                </span>
              )}
            </div>

            <div
              className="announcement-content mt-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(a.content),
              }}
            />
          </div>
        </div>
      </div>

      {/* Minimal styling for rendered rich-text content. */}
      <style>{`.announcement-content{overflow-wrap:break-word;word-break:break-word}
        .announcement-content h1{font-size:1.25rem;font-weight:700;margin:.5rem 0}
        .announcement-content h2{font-size:1.1rem;font-weight:700;margin:.5rem 0}
        .announcement-content h3{font-size:1rem;font-weight:600;margin:.5rem 0}
        .announcement-content p{margin:.5rem 0}
        .announcement-content ul{list-style:disc;padding-left:1.25rem;margin:.5rem 0}
        .announcement-content ol{list-style:decimal;padding-left:1.25rem;margin:.5rem 0}
        .announcement-content a{color:#2563eb;text-decoration:underline;overflow-wrap:break-word}
        .announcement-content blockquote{border-left:3px solid #2563eb;padding-left:.75rem;color:#475569;margin:.5rem 0}
        .announcement-snippet{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .dark .announcement-content a{color:#60a5fa}
        .dark .announcement-content blockquote{color:#cbd5e1}`}</style>
    </div>
  );
}
