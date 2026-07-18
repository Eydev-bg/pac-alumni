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
import { HiOutlineBell, HiOutlineCheckCircle } from "react-icons/hi2";

export default function AlumniNotificationsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Mark read; job_posting notifications deep-link to the job detail page.
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
    }
  };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Updates and alerts from PAC Alumni
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <HiOutlineCheckCircle className="w-4 h-4" /> Mark All Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <SkeletonCard variant="notification" count={5} />
        ) : notifications.length === 0 ? (
          <EmptyState
            bare
            icon={HiOutlineBell}
            title="No notifications"
            message="You're all caught up!"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                  !n.is_read
                    ? "bg-[#c8a84e]/[0.06] hover:bg-[#c8a84e]/[0.1]"
                    : "hover:bg-slate-50"
                }`}
                onClick={() => handleOpen(n)}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    !n.is_read ? "bg-[#c8a84e]" : "bg-transparent"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      !n.is_read
                        ? "font-semibold text-slate-800"
                        : "text-slate-500"
                    }`}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(n.created_at)}
                  </p>
                </div>
              </div>
            ))}
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
