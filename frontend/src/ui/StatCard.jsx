import { memo } from "react";
import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from "react-icons/hi2";
import { cn } from "../utils/formatters";

/**
 * StatCard — shared dashboard/stat tile.
 *
 * Canonical stat card for the whole admin side (the Phase-3 dashboard cards
 * consume this instead of a page-local copy). Memoized so a parent re-render
 * doesn't re-render cards whose props are unchanged. Colors reference theme
 * tokens, not literals.
 *
 * Props:
 *   color: 'gold' | 'blue' | 'emerald' | 'amber'  (default 'gold')
 *   badge / badgeUp: optional trend pill
 *   footer: optional node rendered below the title
 */
const COLOR_MAP = {
  gold: {
    iconBg: "bg-gold-500/15",
    iconText: "text-gold-500",
    accent: "border-l-gold-500",
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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "gold",
  badge,
  badgeUp,
  footer,
}) {
  const style = COLOR_MAP[color] || COLOR_MAP.gold;

  return (
    <div
      className={cn(
        "bg-navy-800/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5 hover:bg-navy-800/55 transition-all duration-300 border-l-[3px]",
        style.accent,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            style.iconBg,
          )}
        >
          {Icon && <Icon className={cn("w-5 h-5", style.iconText)} />}
        </div>
        {badge && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
              badgeUp
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400",
            )}
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
