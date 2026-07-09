// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/analytics/LevelAnalyticsTab.jsx
//  Graduate trend by year
//  Reusable for Elementary, JHS, and SHS analytics tabs
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "../../../hooks/useToast";
import { HiOutlineAcademicCap, HiOutlineChartBar } from "react-icons/hi2";

// Recharts consumes plain color strings, so the chart palette is named here.
const CHART_COLORS = {
  bar: "#c8a84e", // gold — graduate bars
  axisTick: "#64748b", // slate-500 — axis ticks
};

// Dark-themed tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800 border border-gold-500/20 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-semibold text-gold-500 mb-1.5">{label}</p>
      <div className="flex items-center gap-2 text-[11px]">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: payload[0].color }}
        />
        <span className="text-slate-400">Graduates:</span>
        <span className="text-white font-semibold">{payload[0].value}</span>
      </div>
    </div>
  );
}

export default function LevelAnalyticsTab({ level, label, fetchFn }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    adminApi
      .getGraduationYears(level)
      .then((res) => setYears(res.data.data || []))
      .catch(() => {});
  }, [level]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (yearFilter) {
      params.year_from = yearFilter;
      params.year_to = yearFilter;
    }
    fetchFn(params)
      .then((res) => setData(res.data.data))
      .catch((err) =>
        toast.error(
          err.response?.data?.message || `Failed to load ${label} analytics.`,
        ),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearFilter]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
        <p className="text-sm text-slate-500">Loading {label} analytics...</p>
      </div>
    );

  if (!data) return null;

  // Prepare chart data (ascending order for chart)
  const chartData = data.by_year
    ? [...data.by_year].sort((a, b) => a.year - b.year)
    : [];

  return (
    <div>
      {/* Year Filter */}
      <div className="flex gap-3 mb-6">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-gold-500/40 appearance-none cursor-pointer min-w-[140px]"
          style={{ colorScheme: "dark" }}
        >
          <option value="" className="bg-navy-800 text-slate-300">
            All Years
          </option>
          {years.map((y) => (
            <option key={y} value={y} className="bg-navy-800 text-slate-300">
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Total Graduates Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-5 text-center">
          <div className="w-11 h-11 rounded-xl bg-gold-500/15 flex items-center justify-center mx-auto mb-3">
            <HiOutlineAcademicCap className="w-5 h-5 text-gold-500" />
          </div>
          <p className="text-3xl font-bold text-white">{data.total_graduates}</p>
          <p className="text-[10px] text-gold-500/80 uppercase font-semibold mt-1.5 tracking-wider">
            Total {label} Graduates
          </p>
        </div>
        {chartData.length > 0 && (
          <>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                <HiOutlineChartBar className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">
                {chartData[chartData.length - 1]?.total_graduates || 0}
              </p>
              <p className="text-[10px] text-emerald-400/80 uppercase font-semibold mt-1.5 tracking-wider">
                Latest Year ({chartData[chartData.length - 1]?.year})
              </p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <HiOutlineAcademicCap className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-3xl font-bold text-white">{chartData.length}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1.5 tracking-wider">
                Years on Record
              </p>
            </div>
          </>
        )}
      </div>

      {/* Graduate Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h3 className="text-[11px] font-semibold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlineChartBar className="w-4 h-4" />
            Graduate trend by year
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: CHART_COLORS.axisTick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: CHART_COLORS.axisTick }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(200,168,78,0.06)" }}
              />
              <Bar
                dataKey="total_graduates"
                name="Graduates"
                fill={CHART_COLORS.bar}
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
