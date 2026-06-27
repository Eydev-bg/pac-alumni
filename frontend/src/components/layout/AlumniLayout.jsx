// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/components/layout/AlumniLayout.jsx
//  Alumni sidebar layout — Dashboard + Profile + Board Exam
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import Header from "./Header";
import alumniApi from "../../api/alumniApi";
import {
  HiOutlineHome,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineClipboardDocumentCheck,
  HiOutlineBriefcase,
} from "react-icons/hi2";

export default function AlumniLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isBoardProgram, setIsBoardProgram] = useState(false);

  // Check if alumni's course is a board program
  useEffect(() => {
    alumniApi
      .getDashboard()
      .then((res) => {
        const course = res.data.data?.academic?.course;
        if (course?.is_board_program) {
          setIsBoardProgram(true);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      section: "Main",
      items: [
        {
          name: "Dashboard",
          path: "/alumni/dashboard",
          icon: HiOutlineHome,
        },
      ],
    },
    {
      section: "My Profile",
      items: [
        {
          name: "Edit Profile",
          path: "/alumni/profile",
          icon: HiOutlineUser,
        },
        // Only show Board Exam if course is a board program
        ...(isBoardProgram
          ? [
              {
                name: "Board Exam",
                path: "/alumni/board-exam",
                icon: HiOutlineClipboardDocumentCheck,
              },
            ]
          : []),
        {
          name: "Employment",
          path: "/alumni/employment",
          icon: HiOutlineBriefcase,
        },
      ],
    },
    // ── Future Phase Nav Items ──────────────────────────
    // {
    //   section: "Community",
    //   items: [
    //     { name: "Job Board", path: "/alumni/jobs", icon: HiOutlineNewspaper },
    //     { name: "Alumni Directory", path: "/alumni/directory", icon: HiOutlineMagnifyingGlass },
    //     { name: "Messages", path: "/alumni/messages", icon: HiOutlineChatBubbleLeftRight },
    //   ],
    // },
  ];

  const linkClasses = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-[#1a2e5a]/10 text-[#1a2e5a]"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const sidebarContent = (
    <>
      {/* ── Sidebar Header ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a2e5a] to-[#2a4177] flex items-center justify-center shadow-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-slate-800 truncate">
              PAC Alumni
            </h2>
            <p className="text-xs text-slate-400 truncate">Alumni Portal</p>
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
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navItems.map((section) => (
          <div key={section.section}>
            {sidebarOpen && (
              <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {section.section}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) => linkClasses(isActive)}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Sidebar Footer ── */}
      <div className="px-4 py-3 border-t border-slate-200">
        {sidebarOpen && (
          <p className="text-[0.6rem] text-slate-400 text-center">
            PAC Alumni Tracking System
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
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

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 flex flex-col ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
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
        />
        <main className="p-4 sm:p-6 lg:p-8 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
