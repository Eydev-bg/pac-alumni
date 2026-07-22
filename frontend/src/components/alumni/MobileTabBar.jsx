// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/components/alumni/MobileTabBar.jsx
//  Fixed bottom navigation — mobile/tablet only (hidden on lg+).
//  The five primary alumni destinations (Phase B re-enabled the
//  "Alumni" directory tab that was deferred while the feature
//  didn't exist).
// ═══════════════════════════════════════════════════════════

import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineUser,
} from "react-icons/hi2";

const TABS = [
  { name: "Home", to: "/alumni/dashboard", icon: HiOutlineHome },
  { name: "Events", to: "/alumni/events", icon: HiOutlineCalendarDays },
  { name: "Alumni", to: "/alumni/directory", icon: HiOutlineUserGroup },
  { name: "Jobs", to: "/alumni/careers", icon: HiOutlineBriefcase },
  { name: "Profile", to: "/alumni/profile", icon: HiOutlineUser },
];

export default function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-1px_4px_rgba(15,23,42,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`
              }
            >
              <t.icon className="w-6 h-6" />
              <span>{t.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
