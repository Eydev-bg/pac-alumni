import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from "react-icons/hi2";

// ─── Trend Badge ─────────────────────────────────────────
// Month-over-month pill for a card header: how many records were added
// this month compared with last month. Three states — up (green),
// down (red), unchanged (neutral).
const PILL =
  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0";
const ICON = "w-3.5 h-3.5";

export default function TrendBadge({ thisMonth = 0, lastMonth = 0 }) {
  // Nothing recorded in either month — there's no trend to show.
  if (thisMonth === 0 && lastMonth === 0) return null;

  if (thisMonth > lastMonth) {
    return (
      <span className={`${PILL} bg-emerald-50 text-emerald-700`}>
        <HiOutlineArrowTrendingUp className={ICON} />
        {`+${thisMonth} this month`}
      </span>
    );
  }

  if (thisMonth < lastMonth) {
    return (
      <span className={`${PILL} bg-red-50 text-red-700`}>
        <HiOutlineArrowTrendingDown className={ICON} />
        {`-${lastMonth - thisMonth} vs last month`}
      </span>
    );
  }

  return (
    <span
      className={`${PILL} bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400`}
    >
      No change
    </span>
  );
}
