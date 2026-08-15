import { memo } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineEnvelope,
  HiOutlineUserPlus,
} from "react-icons/hi2";

// ─── Automated Reminder Stats ────────────────────────────
const REMINDER_TYPE_META = {
  login_reminder: {
    icon: HiOutlineUserPlus,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
  },
  employment_update: {
    icon: HiOutlineBriefcase,
    color: "text-gold-500",
    bg: "bg-gold-500/15",
  },
};

const DEFAULT_TYPE_META = {
  icon: HiOutlineEnvelope,
  color: "text-slate-400",
  bg: "bg-slate-500/15",
};

// Memoized: re-renders only when the reminder `stats` prop changes.
function ReminderStatsSection({ stats }) {
  const totals = stats?.totals || {};
  const byType = stats?.by_type || [];

  const totalCards = [
    { label: "Sent Today", value: totals.today ?? 0 },
    { label: "This Week", value: totals.this_week ?? 0 },
    { label: "This Month", value: totals.this_month ?? 0 },
    { label: "All Time", value: totals.all_time ?? 0 },
  ];

  return (
    <div className="bg-white dark:bg-navy-800/40 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-white/[0.06] p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
            <HiOutlineEnvelope className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">
              Automated Reminders
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Re-engagement emails sent to inactive alumni
            </p>
          </div>
        </div>
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {totalCards.map((card) => (
          <div
            key={card.label}
            className="text-center p-4 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-white/[0.06]"
          >
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">
              {(card.value ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-[0.1em] font-semibold">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* By-type breakdown */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.06]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.03] text-[10px] uppercase tracking-[0.08em] text-slate-500">
              <th className="px-4 py-2.5 font-semibold">Reminder Type</th>
              <th className="px-3 py-2.5 font-semibold text-right">Today</th>
              <th className="px-3 py-2.5 font-semibold text-right">
                This Week
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">
                This Month
              </th>
              <th className="px-4 py-2.5 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {byType.map((row) => {
              const meta = REMINDER_TYPE_META[row.type] || DEFAULT_TYPE_META;
              const Icon = meta.icon;
              return (
                <tr
                  key={row.type}
                  className="border-t border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                        {row.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-slate-600 dark:text-slate-300 tabular-nums">
                    {row.today}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-slate-600 dark:text-slate-300 tabular-nums">
                    {row.this_week}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-slate-600 dark:text-slate-300 tabular-nums">
                    {row.this_month}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-slate-800 dark:text-white tabular-nums">
                    {row.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(ReminderStatsSection);
