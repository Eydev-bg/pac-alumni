// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/alumni/notifications/AlumniNotificationsPage.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import SkeletonCard from "../../../components/common/SkeletonCard";
import EmptyState from "../../../components/common/EmptyState";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../utils/formatters";
import { PAGINATION } from "../../../config/constants";
import { IconChip } from "../../../components/alumni/ui";
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineMegaphone,
  HiOutlineCalendarDays,
  HiOutlineBriefcase,
} from "react-icons/hi2";

// Icon + hue by notification content type (inferred from the payload) —
// matches the dashboard Notifications panel.
function notificationStyle(n) {
  if (n.data?.job_posting_id) return { icon: HiOutlineBriefcase, color: "green" };
  if (n.data?.announcement_id) return { icon: HiOutlineMegaphone, color: "blue" };
  if (n.data?.event_id) return { icon: HiOutlineCalendarDays, color: "purple" };
  return { icon: HiOutlineBell, color: "slate" };
}

export default function AlumniNotificationsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  // Batch 5: mobile-only All / Unread segmented tabs. Filters the already
  // fetched page client-side (no new endpoint); the tabs are hidden on lg+
  // so the desktop list stays exactly as before.
  const [tab, setTab] = useState("all");

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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await alumniApi.getNotifications({
        page,
        per_page: PAGINATION.LOGS_PER_PAGE,
      });
      setNotifications(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleMarkAllRead = async () => {
    try {
      await alumniApi.markAllNotificationsRead();
      toast.success("All notifications marked as read.");
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as read.");
    }
  };

  // Mark read, then deep-link by content type. Jobs have a detail route;
  // announcements/events have list pages only (no detail route), so they land
  // on the list — mirroring the bell dropdown and the email links.
  const handleOpen = async (n) => {
    if (!n.is_read) {
      try {
        await alumniApi.markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
        );
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to mark as read.");
      }
    }
    if (n.data?.job_posting_id) {
      navigate(`/alumni/careers/${n.data.job_posting_id}`);
    } else if (n.data?.announcement_id) {
      navigate("/alumni/announcements");
    } else if (n.data?.event_id) {
      navigate("/alumni/events");
    }
  };

  const unreadOnPage = notifications.filter((n) => !n.is_read).length;
  const visible =
    tab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Updates and alerts from PAC Alumni
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <HiOutlineCheckCircle className="w-4 h-4" /> Mark All Read
        </button>
      </div>

      {/* Mobile-only All / Unread tabs */}
      <div className="lg:hidden flex items-center gap-6 border-b border-slate-200 dark:border-slate-700 mb-4 px-1">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: "Unread" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative -mb-px flex items-center gap-1.5 pb-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-slate-400 border-b-2 border-transparent"
            }`}
          >
            {t.label}
            {t.key === "unread" && unreadOnPage > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[0.6rem] font-bold text-white rounded-full bg-red-500">
                {unreadOnPage > 99 ? "99+" : unreadOnPage}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <SkeletonCard variant="notification" count={5} />
        ) : visible.length === 0 ? (
          <EmptyState
            bare
            icon={HiOutlineBell}
            title={tab === "unread" ? "No unread notifications" : "No notifications"}
            message="You're all caught up!"
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {visible.map((n) => {
              const style = notificationStyle(n);
              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                    !n.is_read
                      ? "bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                  onClick={() => handleOpen(n)}
                >
                  <IconChip icon={style.icon} color={style.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !n.is_read
                          ? "font-semibold text-slate-800 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {meta && (
          <div className="px-4 pb-4">
            <Pagination meta={meta} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </div>
  );
}
