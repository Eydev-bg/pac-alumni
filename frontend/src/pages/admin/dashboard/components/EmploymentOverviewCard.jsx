import { memo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CustomPieTooltip } from "./tooltips";
import { EMPLOYMENT_COLORS } from "../constants";

// ─── Employment Overview (pie) ───────────────────────────
// Memoized: re-renders only when its derived props change.
function EmploymentOverviewCard({ pieData, legend, employedCount, employmentRate }) {
  return (
    <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 flex flex-col">
      <div className="mb-2">
        <h2 className="text-[15px] font-bold text-white">Employment Overview</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Employed · Unemployed · Unknown breakdown
        </p>
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
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={EMPLOYMENT_COLORS[entry.name]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip colorMap={EMPLOYMENT_COLORS} />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500">No data yet.</p>
        )}
      </div>

      {/* Legend — surfaces the Unknown (not-yet-reported) slice explicitly */}
      <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
        {legend.map((item) => (
          <span key={item.name} className="flex items-center gap-1.5 text-[10px]">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: EMPLOYMENT_COLORS[item.name] }}
            />
            <span className="text-slate-400">
              {item.name} · {item.value}
            </span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto pt-3">
        <div className="text-center p-3 bg-[#c8a84e]/10 rounded-xl border border-[#c8a84e]/15">
          <p className="text-xl font-bold text-[#c8a84e]">{employedCount}</p>
          <p className="text-[10px] text-[#c8a84e]/70 font-medium mt-0.5">
            Employed
          </p>
        </div>
        <div className="text-center p-3 bg-white/[0.05] rounded-xl border border-white/[0.08]">
          <p className="text-xl font-bold text-white">{employmentRate}%</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Rate</p>
        </div>
      </div>
    </div>
  );
}

export default memo(EmploymentOverviewCard);
