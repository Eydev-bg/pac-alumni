// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/notifications/NotificationsPage.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import Pagination from "../../../components/common/Pagination";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import { formatDate } from "../../../utils/formatters";
import { HiOutlineBell, HiOutlineCheckCircle } from "react-icons/hi2";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getNotifications({ page, per_page: 20 });
      setNotifications(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await adminApi.markNotificationRead(id);
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-slate-400 mt-1">
              System notifications and alerts
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-colors"
          >
            <HiOutlineCheckCircle className="w-4 h-4" /> Mark All Read
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineBell className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No notifications
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                    !n.is_read
                      ? "bg-[#c8a84e]/[0.05] hover:bg-[#c8a84e]/[0.08]"
                      : "hover:bg-white/[0.03]"
                  }`}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
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
                          ? "font-semibold text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {meta && (
            <div className="px-4 pb-4">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
