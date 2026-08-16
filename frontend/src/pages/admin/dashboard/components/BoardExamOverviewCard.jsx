import { memo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CustomPieTooltip } from "./tooltips";
import TrendBadge from "./TrendBadge";
import { BOARD_COLORS } from "../constants";

// ─── Board Exam Overview (pie) ───────────────────────────
// Memoized: re-renders only when its derived props change.
function BoardExamOverviewCard({
  pieData,
  legend,
  passed,
  passingRate,
  newThisMonth = 0,
  newLastMonth = 0,
}) {
  return (
    <div className="bg-white dark:bg-navy-800/40 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-white/[0.06] p-6 flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">
            Board Exam Overview
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Passed · Not Yet Taken · Pass Rate
          </p>
        </div>
        <TrendBadge thisMonth={newThisMonth} lastMonth={newLastMonth} />
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                animationDuration={1000}
                stroke="none"
                label={false}
                labelLine={false}
              >
                {pieData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={BOARD_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip colorMap={BOARD_COLORS} />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500">No data yet.</p>
        )}
      </div>

      {/* Legend — lists each status so empty slices are still shown */}
      <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
        {legend.map((item) => (
          <span key={item.name} className="flex items-center gap-1.5 text-[10px]">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: BOARD_COLORS[item.name] }}
            />
            <span className="text-slate-500 dark:text-slate-400">
              {item.name} · {item.value}
            </span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto pt-3">
        <div className="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/15">
          <p className="text-xl font-bold text-green-500">{passed}</p>
          <p className="text-[10px] text-green-500/70 font-medium mt-0.5">
            Passed
          </p>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-white/[0.05] rounded-xl border border-slate-200 dark:border-white/[0.08]">
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {passingRate}%
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Pass Rate
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            of board-program grads
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(BoardExamOverviewCard);
