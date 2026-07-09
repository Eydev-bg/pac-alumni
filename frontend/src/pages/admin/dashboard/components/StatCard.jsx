import { memo } from "react";
import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from "react-icons/hi2";

// ─── Reusable Stat Card ──────────────────────────────────
// Memoized so a parent re-render (e.g. reminder stats arriving) doesn't
// re-render cards whose props are unchanged.
function StatCard({ title, value, subtitle, icon: Icon, color, badge, badgeUp, footer }) {
  const colorMap = {
    gold: {
      iconBg: "bg-[#c8a84e]/15",
      iconText: "text-[#c8a84e]",
      accent: "border-l-[#c8a84e]",
    },
    blue: {
      iconBg: "bg-blue-500/15",
      iconText: "text-blue-400",
      accent: "border-l-blue-500",
    },
    emerald: {
      iconBg: "bg-emerald-500/15",
      iconText: "text-emerald-400",
      accent: "border-l-emerald-500",
    },
    amber: {
      iconBg: "bg-amber-500/15",
      iconText: "text-amber-400",
      accent: "border-l-amber-500",
    },
  };
  const style = colorMap[color] || colorMap.gold;

  return (
    <div
      className={`bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5 hover:bg-[#1a2e5a]/55 transition-all duration-300 border-l-[3px] ${style.accent}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${style.iconText}`} />
        </div>
        {badge && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              badgeUp
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {badgeUp ? (
              <HiOutlineArrowTrendingUp className="w-3 h-3" />
            ) : (
              <HiOutlineArrowTrendingDown className="w-3 h-3" />
            )}
            {badge}
          </span>
        )}
      </div>
      <p className="text-[28px] font-extrabold text-white tracking-tight leading-none">
        {value}
      </p>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
      <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.1em] font-semibold">
        {title}
      </p>
      {footer}
    </div>
  );
}

export default memo(StatCard);
