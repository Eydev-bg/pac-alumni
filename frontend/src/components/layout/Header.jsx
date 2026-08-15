import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUnread } from "../../context/UnreadContext";
import { useAdminUnread } from "../../context/AdminUnreadContext";
import alumniApi from "../../api/alumniApi";
import { timeAgo } from "../../utils/formatters";
import { useDebounce } from "../../hooks/useDebounce";
import Avatar from "../alumni/ui/Avatar";
import {
  HiOutlineBars3,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
  HiOutlineChevronDown,
  HiOutlineBell,
  HiOutlineClipboardDocumentCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineSun,
  HiOutlineMoon,
} from "react-icons/hi2";
import { useTheme } from "../../hooks/useTheme";

/**
 * Header — shared header across Admin and Alumni layouts.
 * Adapts to the global light/dark theme via Tailwind dark: variants.
 * Role-based differences (bell dropdown, search bar, avatar) are driven
 * by user.role, not a variant prop.
 */
export default function Header({
  onToggleSidebar,
  onMobileMenuClick,
  sidebarOpen,
}) {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  // Shared alumni unread source (null in layouts without UnreadProvider,
  // e.g. the admin layout).
  const unread = useUnread();
  // Shared admin unread source — same count NotificationsPage decrements
  // when an admin marks a notification read, so the bell badge updates
  // instantly instead of waiting for the next 60s poll.
  const adminUnread = useAdminUnread();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  // Mobile-only: the global search collapses to an icon and expands to a
  // full-width overlay under the header (desktop keeps the inline input).
  const [searchOpen, setSearchOpen] = useState(false);
  const unreadCount =
    user?.role === "alumni"
      ? (unread?.notifications ?? 0)
      : (adminUnread?.notifications ?? 0);
  const isAlumni = user?.role === "alumni";
  const isAdmin = user?.role === "admin";
  const unreadMessages = unread?.messages ?? 0;
  // Recent notifications shown in the alumni bell dropdown (fetched on open).
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const bellButtonRef = useRef(null);
  // Alumni global search (desktop input + mobile overlay share this state) —
  // debounced directory lookup + results dropdown.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Alumni get a blue top bar on mobile (matches the approved mobile design);
  // lg+ keeps the white desktop header untouched. Admin is unaffected.
  const alumniBlueBar = isAlumni;
  // Icon-button colouring: white on the alumni mobile blue bar, reverting to
  // the slate desktop treatment at lg. Everyone else keeps the slate treatment
  // with dark: overrides.
  const iconBtnClass = alumniBlueBar
    ? "text-white hover:bg-white/10 lg:text-slate-500 lg:hover:text-slate-700 lg:hover:bg-slate-100 lg:dark:text-slate-400 lg:dark:hover:text-white lg:dark:hover:bg-white/10"
    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10";
  // The header is fixed to the viewport (left-0) and the sidebar (z-30) sits
  // on top of its left edge. When a layout tells us the sidebar's expanded
  // state, pad the header content past the sidebar on lg+ so left-aligned
  // content (e.g. the alumni search) clears it instead of hiding underneath.
  const contentOffset =
    sidebarOpen === undefined ? "" : sidebarOpen ? "lg:pl-64" : "lg:pl-20";

  // Real-time push for admins now lives in AdminUnreadContext (shared with
  // NotificationsPage); alumni already get this via UnreadContext.

  // Close the bell dropdown on Escape and return focus to the bell button.
  useEffect(() => {
    if (!bellOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setBellOpen(false);
        bellButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [bellOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
      const inDesktopSearch = searchWrapRef.current?.contains(e.target);
      const inMobileSearch = mobileSearchRef.current?.contains(e.target);
      if (!inDesktopSearch && !inMobileSearch) {
        setSearchResultsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Admin unread count fetch/poll now lives in AdminUnreadContext.

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
      .catch((err) => {
        if (import.meta.env.DEV)
          console.error("Bell notifications preview failed:", err);
      })
      .finally(() => active && setRecentLoading(false));
    return () => {
      active = false;
    };
  }, [bellOpen, user?.role]);

  // Alumni desktop search — fetch directory matches on the debounced query
  // (min 2 chars). Reuses the visibility-scoped directory endpoint; no backend
  // changes. Results are capped at 6 for the dropdown.
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!isAlumni || q.length < 2) {
      setSearchResults([]);
      setSearchResultsOpen(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    alumniApi
      .getDirectory({ search: q, page: 1 })
      .then((res) => {
        if (!cancelled) {
          setSearchResults((res.data.data || []).slice(0, 6));
          setSearchActiveIndex(-1);
          setSearchResultsOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isAlumni]);

  // Open a search result: go to the public profile, then clear + close both the
  // results dropdown and the mobile overlay (harmless no-op on desktop).
  const openSearchResult = (alumni) => {
    navigate(`/alumni/directory/${alumni.uuid}`);
    setSearchQuery("");
    setSearchResults([]);
    setSearchResultsOpen(false);
    setSearchActiveIndex(-1);
    setSearchOpen(false);
  };

  // Fully close the mobile search overlay and reset search so the next open
  // starts fresh (used by the overlay's X button and its Escape key).
  const closeSearchOverlay = () => {
    setSearchOpen(false);
    setSearchResultsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchActiveIndex(-1);
  };

  // Shared arrow/enter navigation for the results dropdown: ↑/↓ move the
  // highlight, Enter opens the highlighted result.
  const handleSearchNavKeys = (e) => {
    if (!searchResultsOpen || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchActiveIndex((i) => (i + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchActiveIndex((i) => (i <= 0 ? searchResults.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (searchActiveIndex >= 0 && searchActiveIndex < searchResults.length) {
        e.preventDefault();
        openSearchResult(searchResults[searchActiveIndex]);
      }
    }
  };

  // Desktop input: Escape closes the results and blurs the input.
  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchResultsOpen(false);
      searchInputRef.current?.blur();
      return;
    }
    handleSearchNavKeys(e);
  };

  // Mobile overlay input: Escape closes the results AND the overlay.
  const handleMobileSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      closeSearchOverlay();
      return;
    }
    handleSearchNavKeys(e);
  };

  // Results list shared by the desktop dropdown and the mobile overlay. The
  // caller supplies the positioned container; this renders only the contents.
  const renderSearchResults = () => {
    if (searchLoading) {
      return <p className="px-4 py-2 text-sm text-slate-400">Searching…</p>;
    }
    if (searchResults.length === 0) {
      return (
        <p className="px-4 py-2 text-sm text-slate-400">No alumni found</p>
      );
    }
    return searchResults.map((alumni, idx) => (
      <button
        key={alumni.uuid}
        type="button"
        onClick={() => openSearchResult(alumni)}
        onMouseEnter={() => setSearchActiveIndex(idx)}
        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
          idx === searchActiveIndex
            ? "bg-slate-50 dark:bg-slate-700"
            : "hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
      >
        <Avatar
          src={alumni.profile_picture}
          name={alumni.full_name}
          size="sm"
        />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-slate-800 truncate dark:text-slate-100">
            {alumni.full_name}
          </span>
          <span className="block text-xs text-slate-400 truncate dark:text-slate-400">
            {[
              alumni.course?.code,
              alumni.graduation_year && `Batch ${alumni.graduation_year}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </button>
    ));
  };

  // Mark an alumni notification read, then deep-link by content type. Jobs have
  // a detail route; announcements/events have list pages only (no detail route),
  // so they land on the list — mirroring the email links.
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
    } else if (n.data?.announcement_id) {
      navigate("/alumni/announcements");
    } else if (n.data?.event_id) {
      navigate("/alumni/events");
    }
  };

  // Flip between light and dark from whatever is currently resolved (so it
  // works the same whether the stored preference is explicit or 'system').
  const cycleTheme = () => {
    const next = resolvedTheme === "light" ? "dark" : "light";
    setTheme(next);
  };

  const handleLogout = async () => {
    await logout();
    // Voluntary sign-out lands on the public landing page (not /login — that's
    // reserved for the 401/token-expired redirect in the axios interceptor).
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 border-b ${contentOffset} ${
        isAdmin
          ? "bg-white border-slate-200 dark:bg-navy-950 dark:border-white/[0.06]"
          : alumniBlueBar
            ? "bg-blue-600 border-blue-600 lg:bg-white lg:border-slate-200 lg:dark:bg-slate-800 lg:dark:border-slate-700"
            : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
      }`}
    >
      {/* Mobile search overlay (alumni) — covers the header when expanded.
          Shares the same search state + results as the desktop input. */}
      {isAlumni && searchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden absolute inset-0 z-30 flex items-center gap-2 bg-white px-4 dark:bg-slate-800"
        >
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="search"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleMobileSearchKeyDown}
            placeholder="Search alumni by name…"
            aria-label="Search alumni"
            className="flex-1 h-10 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            onClick={closeSearchOverlay}
            aria-label="Close search"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>

          {searchResultsOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-40 py-2 max-h-80 overflow-y-auto dark:bg-slate-800 dark:border-slate-700 dark:shadow-slate-900/50">
              {renderSearchResults()}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          className={`lg:hidden p-2 rounded-lg transition-colors ${iconBtnClass}`}
          onClick={onMobileMenuClick}
          aria-label="Open menu"
        >
          <HiOutlineBars3 className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          className="hidden lg:block p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
          onClick={onToggleSidebar}
        >
          <HiOutlineBars3 className="w-5 h-5" />
        </button>

        {/* Global search — alumni only. Present but not yet wired to a search
            backend (there is no global-search API this phase). */}
        {isAlumni && (
          <div ref={searchWrapRef} className="hidden md:block relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setSearchResultsOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search alumni by name..."
              aria-label="Search alumni"
              className="w-64 lg:w-96 h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            />

            {searchResultsOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2 max-h-96 overflow-y-auto dark:bg-slate-800 dark:border-slate-700 dark:shadow-slate-900/50">
                {renderSearchResults()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: notification bell + user menu */}
      <div className="flex items-center gap-2">
        {/* Mobile search trigger — alumni only (desktop uses the inline input) */}
        {isAlumni && (
          <button
            aria-label="Search"
            className={`md:hidden p-2 rounded-lg transition-colors ${iconBtnClass}`}
            onClick={() => setSearchOpen(true)}
          >
            <HiOutlineMagnifyingGlass className="w-5 h-5" />
          </button>
        )}
        {/* Messages — alumni only (light theme, unread badge) */}
        {isAlumni && (
          <button
            aria-label={`Messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ""}`}
            className={`relative p-2 rounded-lg transition-colors ${iconBtnClass}`}
            onClick={() => navigate("/alumni/messages")}
          >
            <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 text-white text-[0.625rem] leading-none font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </button>
        )}
        {/* Admin icon bar — bell, verification and theme each navigate/act
            directly; no dropdowns. */}
        {user?.role === "admin" && (
          <>
            {/* Notification bell — navigates directly */}
            <button
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              className={`relative p-2 rounded-lg transition-colors ${iconBtnClass}`}
              onClick={() => navigate("/admin/notifications")}
            >
              <HiOutlineBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 text-white text-[0.625rem] leading-none font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-navy-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Verification — standalone icon */}
            <button
              aria-label="Verification logs"
              className={`relative p-2 rounded-lg transition-colors ${iconBtnClass}`}
              onClick={() => navigate("/admin/verification/logs")}
            >
              <HiOutlineClipboardDocumentCheck className="w-5 h-5" />
            </button>

            {/* Theme toggle — standalone icon */}
            <button
              aria-label={
                resolvedTheme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className={`relative p-2 rounded-lg transition-colors ${iconBtnClass}`}
              onClick={cycleTheme}
            >
              {resolvedTheme === "dark" ? (
                <HiOutlineSun className="w-5 h-5" />
              ) : (
                <HiOutlineMoon className="w-5 h-5" />
              )}
            </button>
          </>
        )}

        {/* Notification bell — alumni (light theme, recent list + deep links) */}
        {user?.role === "alumni" && (
          <div className="relative" ref={bellRef}>
            <button
              ref={bellButtonRef}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={bellOpen}
              aria-haspopup="true"
              className={`relative p-2 rounded-lg transition-colors ${iconBtnClass}`}
              onClick={() => setBellOpen(!bellOpen)}
            >
              <HiOutlineBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 text-white text-[0.625rem] leading-none font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Bell dropdown */}
            {bellOpen && (
              <div
                role="menu"
                className="fixed left-2 right-2 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1rem)] sm:max-w-none rounded-xl py-2 z-50 bg-white border border-slate-200 shadow-lg dark:bg-slate-800 dark:border-slate-700 dark:shadow-slate-900/50"
              >
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Notifications
                  </p>
                  {unreadCount > 0 && (
                    <span className="min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 text-white text-[0.625rem] leading-none font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
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
                        role="menuitem"
                        onClick={() => openAlumniNotification(n)}
                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${
                          !n.is_read ? "bg-blue-50 dark:bg-blue-500/10" : ""
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            !n.is_read
                              ? "bg-blue-600 dark:bg-blue-400"
                              : "bg-transparent"
                          }`}
                        />
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block text-sm truncate ${
                              !n.is_read
                                ? "font-semibold text-slate-800 dark:text-slate-100"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="block text-xs text-slate-500 truncate dark:text-slate-400">
                            {n.message}
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-0.5 dark:text-slate-400">
                            {timeAgo(n.created_at)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  role="menuitem"
                  onClick={() => {
                    navigate("/alumni/notifications");
                    setBellOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100 dark:text-blue-400 dark:hover:bg-slate-700 dark:border-slate-700"
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
              alumniBlueBar
                ? "hover:bg-white/10 lg:hover:bg-slate-100 lg:dark:hover:bg-white/10"
                : "hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            }`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {isAlumni ? (
              <Avatar
                src={user?.profile_picture}
                name={user?.full_name}
                size="sm"
                className="w-8 h-8"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isAdmin
                    ? "bg-blue-100 dark:bg-gradient-to-br dark:from-gold-500 dark:to-gold-700 dark:shadow-lg dark:shadow-gold-500/10"
                    : "bg-blue-100"
                }`}
              >
                <HiOutlineUser
                  className={`w-4 h-4 ${isAdmin ? "text-blue-600 dark:text-white" : "text-blue-600"}`}
                />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p
                className={`text-sm font-medium ${
                  alumniBlueBar
                    ? "text-white lg:text-slate-700 lg:dark:text-slate-200"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {user?.full_name}
              </p>
              <p
                className={`text-[11px] ${
                  alumniBlueBar
                    ? "text-blue-100 lg:text-slate-400 lg:dark:text-slate-500"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {user?.role_label}
              </p>
            </div>
            <HiOutlineChevronDown
              className={`w-4 h-4 hidden sm:block ${
                alumniBlueBar
                  ? "text-blue-100 lg:text-slate-400 lg:dark:text-slate-500"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-2 z-50 ${
                isAdmin
                  ? "bg-white border border-slate-200 shadow-lg dark:bg-navy-800 dark:border-white/[0.08] dark:shadow-2xl"
                  : "bg-white border border-slate-200 shadow-lg dark:bg-slate-800 dark:border-slate-700 dark:shadow-slate-900/50"
              }`}
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                <p className="text-sm font-medium text-slate-700 dark:text-white">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
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
