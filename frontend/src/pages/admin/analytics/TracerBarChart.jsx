// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/analytics/TracerBarChart.jsx
//  Vertical grouped bar chart — per year analytics
//
//  Non-board courses: 3 bars (Graduates, Registered, Employed)
//  Board courses: 4 bars (Graduates, Registered, Board Passed, Employed)
//
//  Tooltip shows exact count on hover.
// ═══════════════════════════════════════════════════════════

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Card from "../../../ui/Card";

// ─── Colors ──────────────────────────────────────────────
// Recharts consumes plain color strings (not Tailwind classes), so the chart
// palette lives here as named constants rather than magic literals inline.
const COLORS = {
  graduates: "#3b82f6", // Blue — total imported graduates
  registered: "#10b981", // Green — registered in system
  boardPassed: "#f59e0b", // Amber — board exam passed
  employed: "#c8a84e", // Gold — employed alumni
  axisLabel: "#94a3b8", // slate-400 — x-axis labels
  axisTick: "#64748b", // slate-500 — y-axis ticks
};

// ─── Custom Tooltip ──────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 border border-gold-500/30 rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
      <p className="text-[12px] font-bold text-gold-500 mb-2 border-b border-white/10 pb-1.5">
        Batch {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] text-slate-400">{entry.name}</span>
          </div>
          <span className="text-[12px] text-white font-bold">
            {entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────
function ChartLegend({ payload }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4">
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-slate-400 font-medium">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TracerBarChart({ data, isBoardProgram, courseCode }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500">
          No graduate data found for this course.
        </p>
      </div>
    );
  }

  // Sort by year ascending for the chart
  const chartData = [...data]
    .sort((a, b) => a.batch_year - b.batch_year)
    .map((row) => ({
      year: String(row.batch_year),
      Graduates: row.total_graduates,
      Registered: row.registered,
      ...(isBoardProgram ? { "Board Passed": row.board_passers } : {}),
      Employed: row.employed,
    }));

  // Dynamic chart height based on data count
  const chartHeight = Math.max(380, Math.min(500, data.length * 60));

  return (
    <Card>
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-[16px] font-bold text-white">
          Year-by-Year Analytics
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          {isBoardProgram
            ? "Graduates, Registered, Board Passed, and Employed per batch year"
            : "Graduates, Registered, and Employed per batch year"}
        </p>
      </div>

      {/* Chart */}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: COLORS.axisLabel, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: COLORS.axisTick }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "rgba(200,168,78,0.06)" }}
            />
            <Legend content={<ChartLegend />} />

            <Bar
              dataKey="Graduates"
              fill={COLORS.graduates}
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              animationBegin={0}
            />
            <Bar
              dataKey="Registered"
              fill={COLORS.registered}
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              animationBegin={200}
            />
            {isBoardProgram && (
              <Bar
                dataKey="Board Passed"
                fill={COLORS.boardPassed}
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationBegin={400}
              />
            )}
            <Bar
              dataKey="Employed"
              fill={COLORS.employed}
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              animationBegin={isBoardProgram ? 600 : 400}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
