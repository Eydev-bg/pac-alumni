import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CustomBarTooltip } from "./tooltips";
import { COLORS } from "../constants";

// ─── Registration Trend (bar chart, full width) ──────────
// Memoized: re-renders only when its `data` slice changes.
function RegistrationTrendChart({ data }) {
  return (
    <div className="lg:col-span-2 bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-white">Registration Trend</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Alumni registrations per month — last 12 months
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-5 text-[11px]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#c8a84e] inline-block" />{" "}
            <span className="text-slate-400">Registrations</span>
          </span>
        </div>
      </div>
      <div className="h-72 mt-2">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => val.split(" ")[0]}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomBarTooltip />}
                cursor={{ fill: "rgba(200,168,78,0.06)" }}
              />
              <Bar
                dataKey="registrations"
                name="Registrations"
                fill={COLORS.registrations}
                radius={[6, 6, 0, 0]}
                animationDuration={1200}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500">No activity data yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(RegistrationTrendChart);
