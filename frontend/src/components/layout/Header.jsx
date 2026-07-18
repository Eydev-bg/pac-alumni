import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUnread } from "../../context/UnreadContext";
import adminApi from "../../api/adminApi";
import alumniApi from "../../api/alumniApi";
import { timeAgo } from "../../utils/formatters";
import {
  HiOutlineBars3,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
  HiOutlineChevronDown,
  HiOutlineBell,
  HiOutlineClipboardDocumentCheck,
} from "react-icons/hi2";

/**
 * Header — top bar with menu toggle, user info, and logout.
 * Accepts variant="dark" | "light" (default: "light").
 * AdminLayout passes "dark"; all other layouts keep "light".
 */
export default function Header({
  onToggleSidebar,
  onMobileMenuClick,
  variant = "light",
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Shared alumni unread source (null in layouts without UnreadProvider,
  // e.g. the admin layout — admin keeps its own poll below).
  const unread = useUnread();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const unreadCount =
    user?.role === "alumni" ? (unread?.notifications ?? 0) : adminUnreadCount;
  // Recent notifications shown in the alumni bell dropdown (fetched on open).
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const dark = variant === "dark";

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unread notification count on mount and poll every 60 seconds.
  // Admin only — the alumni count comes from the shared UnreadContext.
  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await adminApi.getUnreadCount();
        if (active) setAdminUnreadCount(res.data.data.count ?? 0);
      } catch {
        // silently ignore — count stays at previous value
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.role]);

  // Load the few most recent notifications whenever the alumni opens the bell.
  useEffect(() => {
    if (!bellOpen || user?.role !== "alumni") return;
    let active = true;
    setRecentLoading(true);
    alumniApi
      .getNotifications({ per_page: 5 })
      .then((res) => {
        if (active) setRecent(res.data.data);
      })
      .catch(() => {})
      .finally(() => active && setRecentLoading(false));
    return () => {
      active = false;
    };
  }, [bellOpen, user?.role]);

  // Mark an alumni notification read; job_posting notifications deep-link to
  // the job detail page.
  const openAlumniNotification = async (n) => {
    setBellOpen(false);
    if (!n.is_read) {
      try {
        await alumniApi.markNotificationRead(n.id);
        unread?.decrementNotifications();
      } catch {
        // Non-fatal — navigation still proceeds.
      }
    }
    if (n.data?.job_posting_id) {
      navigate(`/alumni/careers/${n.data.job_posting_id}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 ${
        dark
          ? "bg-navy-950 border-b border-white/[0.06]"
          : "bg-white border-b border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          className={`lg:hidden p-2 rounded-lg transition-colors ${
            dark
              ? "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
          onClick={onMobileMenuClick}
        >
          <HiOutlineBars3 className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          className={`hidden lg:block p-2 rounded-lg transition-colors ${
            dark
              ? "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
          onClick={onToggleSidebar}
        >
          <HiOutlineBars3 className="w-5 h-5" />
        </button>
      </div>

      {/* Right side: notification bell + user menu */}
      <div className="flex items-center gap-2">
      {/* Notification bell — admin only (routes to admin-scoped pages) */}
      {user?.role === "admin" && (
      <div className="relative" ref={bellRef}>
        <button
          className={`relative p-2 rounded-lg transition-colors ${
            dark
              ? "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
          onClick={() => setBellOpen(!bellOpen)}
        >
          <HiOutlineBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Bell dropdown */}
        {bellOpen && (
          <div
            className={`absolute right-0 mt-2 w-56 rounded-xl py-2 z-50 ${
              dark
                ? "bg-navy-800 border border-white/[0.08] shadow-2xl"
                : "bg-white border border-slate-200 shadow-lg"
            }`}
          >
            <button
              onClick={() => {
                navigate("/admin/notifications");
                setBellOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                dark
                  ? "text-slate-300 hover:bg-white/[0.06]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <HiOutlineBell className="w-4 h-4 flex-shrink-0" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                navigate("/admin/verification/logs");
                setBellOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                dark
                  ? "text-slate-300 hover:bg-white/[0.06]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <HiOutlineClipboardDocumentCheck className="w-4 h-4 flex-shrink-0" />
              <span>Verification</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Notification bell — alumni (light theme, recent list + deep links) */}
      {user?.role === "alumni" && (
      <div className="relative" ref={bellRef}>
        <button
          className="relative p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          onClick={() => setBellOpen(!bellOpen)}
        >
          <HiOutlineBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Bell dropdown */}
        {bellOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-xl py-2 z-50 bg-white border border-slate-200 shadow-lg">
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Notifications
              </p>
              {unreadCount > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>

            {recentLoading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Loading…
              </p>
            ) : recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No notifications yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {recent.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openAlumniNotification(n)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                      !n.is_read ? "bg-[#c8a84e]/[0.06]" : ""
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        !n.is_read ? "bg-[#c8a84e]" : "bg-transparent"
                      }`}
                    />
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-sm truncate ${
                          !n.is_read
                            ? "font-semibold text-slate-800"
                            : "text-slate-600"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="block text-xs text-slate-500 truncate">
                        {n.message}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                navigate("/alumni/notifications");
                setBellOpen(false);
              }}
              className="w-full px-4 py-2.5 text-sm font-medium text-[#1a2e5a] hover:bg-slate-50 transition-colors border-t border-slate-100"
            >
              See all notifications
            </button>
          </div>
        )}
      </div>
      )}

      {/* User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
            dark ? "hover:bg-white/[0.06]" : "hover:bg-slate-100"
          }`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              dark
                ? "bg-gradient-to-br from-gold-500 to-gold-700 shadow-lg shadow-gold-500/10"
                : "bg-blue-100"
            }`}
          >
            <HiOutlineUser
              className={`w-4 h-4 ${dark ? "text-white" : "text-blue-600"}`}
            />
          </div>
          <div className="hidden sm:block text-left">
            <p
              className={`text-sm font-medium ${dark ? "text-slate-200" : "text-slate-700"}`}
            >
              {user?.full_name}
            </p>
            <p
              className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}
            >
              {user?.role_label}
            </p>
          </div>
          <HiOutlineChevronDown
            className={`w-4 h-4 hidden sm:block ${dark ? "text-slate-500" : "text-slate-400"}`}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-2 z-50 ${
              dark
                ? "bg-navy-800 border border-white/[0.08]"
                : "bg-white border border-slate-200 shadow-lg"
            }`}
          >
            <div
              className={`px-4 py-2 ${
                dark
                  ? "border-b border-white/[0.06]"
                  : "border-b border-slate-100"
              }`}
            >
              <p
                className={`text-sm font-medium ${dark ? "text-slate-200" : "text-slate-700"}`}
              >
                {user?.full_name}
              </p>
              <p
                className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}
              >
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                dark
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
