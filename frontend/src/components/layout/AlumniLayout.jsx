// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/components/layout/AlumniLayout.jsx
//  Alumni shell — blue light-SaaS redesign (Phase A).
//  Flat sidebar nav + top header. Board Exam and Employment are
//  folded into the unified My Profile page (Batch 3), so they are
//  no longer standalone sidebar items; their routes still resolve.
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import MobileTabBar from "../alumni/MobileTabBar";
import { Avatar } from "../alumni/ui";
import { useAuth } from "../../hooks/useAuth";
import { UnreadProvider, useUnread } from "../../context/UnreadContext";
import {
  HiOutlineHome,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineMegaphone,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBell,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";

export default function AlumniLayout() {
  return (
    <UnreadProvider>
      <AlumniLayoutInner />
    </UnreadProvider>
  );
}

function AlumniLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // A standalone conversation thread renders full-screen (its own input bar
  // sits at the bottom), so the fixed bottom tab bar would cover it. Hide the
  // bar and drop the tab-bar bottom padding on that route only.
  const isFullScreenThread = /^\/alumni\/messages\/.+/.test(pathname);
  // Sidebar badge counts from the shared background-aware polling source.
  const { messages: unreadMessages, notifications: unreadNotifications } =
    useUnread();

  // Flat single-list nav (the redesign drops the grouped sections).
  // Settings / Help & Support have no alumni page today, so they're omitted
  // rather than pointing at a route that doesn't exist.
  const navItems = [
    { name: "Home", path: "/alumni/dashboard", icon: HiOutlineHome },
    { name: "My Profile", path: "/alumni/profile", icon: HiOutlineUser },
    {
      name: "Alumni Directory",
      path: "/alumni/directory",
      icon: HiOutlineUserGroup,
    },
    { name: "Events", path: "/alumni/events", icon: HiOutlineCalendarDays },
    {
      name: "Announcements",
      path: "/alumni/announcements",
      icon: HiOutlineMegaphone,
    },
    { name: "Jobs", path: "/alumni/careers", icon: HiOutlineBriefcase },
    {
      name: "Messages",
      path: "/alumni/messages",
      icon: HiOutlineChatBubbleLeftRight,
      badge: unreadMessages,
    },
    {
      name: "Notifications",
      path: "/alumni/notifications",
      icon: HiOutlineBell,
      badge: unreadNotifications,
    },
  ];

  const linkClasses = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const handleLogout = async () => {
    await logout();
    // Voluntary sign-out lands on the public landing page (matches Header).
    navigate("/");
  };

  const sidebarContent = (
    <>
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 px-4 py-5">
        <img
          src="/pac-logo.jpg"
          alt="PAC"
          className="flex-shrink-0 w-9 h-9 rounded-xl object-cover shadow-sm"
        />
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h2 className="text-base font-bold text-blue-700 leading-tight truncate">
              PAC Alumni
            </h2>
            <p className="text-xs text-slate-400 truncate">Community</p>
          </div>
        )}
        <button
          className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) => linkClasses(isActive)}
                title={!sidebarOpen ? item.name : undefined}
              >
                <span className="relative flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                  {/* Collapsed sidebar: show a dot indicator on the icon. */}
                  {!sidebarOpen && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                  )}
                </span>
                {sidebarOpen && <span className="flex-1">{item.name}</span>}
                {sidebarOpen && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[0.65rem] font-bold text-white rounded-full bg-blue-600">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout — grouped with nav but visually separated. */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Logout" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="flex-1 text-left">Logout</span>}
          </button>
        </div>
      </nav>

      {/* ── Promo card ── */}
      {sidebarOpen && (
        <div className="px-3 pb-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-4 text-white shadow-sm">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-white/5"></div>

            {/* Graduate Illustration */}
            <img
              src="/afterwork-rafiki.png"
              alt=""
              className="w-28 mx-auto mb-3 drop-shadow-lg select-none pointer-events-none"
            />

            <p className="text-center text-sm font-bold">
              Connect. Engage. Inspire.
            </p>

            <p className="mt-1 text-center text-xs text-blue-100 leading-relaxed">
              Building a stronger PAC Alumni Community together.
            </p>
          </div>
        </div>
      )}
    </>
  );

  // Mobile drawer content (Batch 5): a profile header replaces the brand
  // block, and nav labels always show (the desktop collapse state doesn't
  // apply to the slide-in drawer). Matches the reference's full menu.
  const mobileDrawerContent = (
    <>
      <div className="relative px-4 pt-5 pb-4">
        <button
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 pr-8">
          <Avatar src={user?.profile_picture} name={user?.full_name} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {user?.full_name}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <NavLink
              to="/alumni/profile"
              onClick={() => setMobileSidebarOpen(false)}
              className="mt-0.5 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Profile
            </NavLink>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100" />

      <nav className="flex-1 overflow-y-auto py-2 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) => linkClasses(isActive)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[0.65rem] font-bold text-white rounded-full bg-blue-600">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (drawer) */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 flex flex-col ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {mobileDrawerContent}
      </aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />
        <main
          className={`p-4 sm:p-6 lg:p-8 mt-16 ${
            isFullScreenThread ? "" : "pb-24 lg:pb-8"
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar — hidden on lg+ and on the full-screen thread */}
      {!isFullScreenThread && <MobileTabBar />}
    </div>
  );
}
