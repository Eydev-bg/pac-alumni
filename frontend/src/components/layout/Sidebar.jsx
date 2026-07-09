import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineDocumentArrowUp,
  HiOutlineUserGroup,
  HiOutlineCog6Tooth,
  HiOutlinePresentationChartBar,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineMegaphone,
  HiOutlineXMark,
} from "react-icons/hi2";

const navItems = [
  {
    section: "Main",
    items: [
      { name: "Dashboard", path: "/admin/dashboard", icon: HiOutlineHome },
    ],
  },
  {
    section: "Academic",
    items: [
      {
        name: "Departments",
        path: "/admin/departments",
        icon: HiOutlineAcademicCap,
      },
      { name: "Graduates", path: "/admin/graduates", icon: HiOutlineUserGroup },
      {
        name: "Import Graduates",
        path: "/admin/graduates/import",
        icon: HiOutlineDocumentArrowUp,
      },
    ],
  },
  {
    section: "Analytics",
    items: [
      {
        name: "Analytics Dashboard",
        path: "/admin/analytics",
        icon: HiOutlinePresentationChartBar,
      },
    ],
  },
  {
    section: "Employers & Jobs",
    items: [
      {
        name: "Employers",
        path: "/admin/employers",
        icon: HiOutlineBuildingOffice2,
      },
      {
        name: "Job Moderation",
        path: "/admin/job-posts",
        icon: HiOutlineBriefcase,
      },
    ],
  },
  {
    section: "Communication",
    items: [
      {
        name: "Announcements",
        path: "/admin/announcements",
        icon: HiOutlineMegaphone,
      },
    ],
  },
  {
    section: "Settings",
    items: [
      {
        name: "Settings",
        path: "/admin/settings",
        icon: HiOutlineCog6Tooth,
      },
    ],
  },
];

// Sidebar surface gradient — references theme tokens (exposed as CSS vars by
// Tailwind v4) instead of hardcoded hex, so it stays in sync with the palette.
const SIDEBAR_BACKGROUND =
  "linear-gradient(180deg, var(--color-slate-900) 0%, var(--color-navy-850) 50%, var(--color-slate-900) 100%)";

/**
 * Sidebar — collapsible navigation for admin.
 * Design: Dark navy with gold accent, school branding.
 */
export default function Sidebar({ open, mobileOpen, onMobileClose }) {
  const location = useLocation();

  const linkClasses = (isActive) =>
    `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative ${
      isActive
        ? "bg-gradient-to-r from-gold-500/15 to-gold-500/5 text-gold-500"
        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
    }`;

  const content = (
    <>
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20">
          <svg
            width="18"
            height="18"
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
        {open && (
          <div className="overflow-hidden">
            <h2 className="text-[13px] font-bold text-white tracking-wide truncate">
              PAC Alumni
            </h2>
            <p className="text-[10px] text-gold-500/70 font-medium tracking-wider uppercase truncate">
              Admin Panel
            </p>
          </div>
        )}

        {/* Mobile close button */}
        <button
          className="ml-auto lg:hidden text-slate-500 hover:text-white transition-colors"
          onClick={onMobileClose}
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navItems.map((section) => (
          <div key={section.section}>
            {open && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                {section.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onMobileClose}
                    className={({ isActive }) => linkClasses(isActive)}
                    title={!open ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gold-500" />
                        )}
                        <item.icon
                          className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
                            isActive
                              ? "text-gold-500"
                              : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        />
                        {open && <span>{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom branding */}
      {open && (
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] text-slate-500 font-medium">
              System Online
            </p>
          </div>
          <p className="text-[9px] text-slate-600 mt-1 tracking-wide">
            © {new Date().getFullYear()} Philippine Advent College
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
          open ? "w-64" : "w-20"
        }`}
        style={{ background: SIDEBAR_BACKGROUND }}
      >
        {content}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: SIDEBAR_BACKGROUND }}
      >
        {content}
      </aside>
    </>
  );
}
