import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "../../../hooks/useAuth";
import adminApi from "../../../api/adminApi";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineEnvelope,
  HiOutlineUserPlus,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBarSquare,
  HiOutlineIdentification,
} from "react-icons/hi2";

// ─── Color palette (navy + gold) ─────────────────────────
const COLORS = {
  registrations: "#c8a84e",
};

// Fixed color per employment status so the legend, tooltip and slices always agree.
const EMPLOYMENT_COLORS = {
  Employed: "#c8a84e",
  Unemployed: "#ef4444",
  Unknown: "#475569",
};

// Fixed color per board exam status so the legend, tooltip and slices always agree.
const BOARD_COLORS = {
  Passers: "#22c55e", // green
  Failed: "#ef4444", // red
  "Not Yet Taken": "#475569", // slate
};

// ─── Custom tooltips ─────────────────────────────────────
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2e5a] border border-[#c8a84e]/20 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-semibold text-[#c8a84e] mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload, colorMap = {} }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1a2e5a] border border-[#c8a84e]/20 rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 text-[12px]">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: colorMap[d.name] || d.payload.fill }}
        />
        <span className="text-white font-semibold">{d.name}</span>
        <span className="text-slate-400">— {d.value}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reminderStats, setReminderStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi.getDashboardData();
        setData(res.data.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Reminder stats are non-blocking — a failure here must not hide the dashboard.
    const fetchReminderStats = async () => {
      try {
        const res = await adminApi.getReminderStats();
        setReminderStats(res.data.data);
      } catch (err) {
        console.error("Reminder stats fetch error:", err);
      }
    };

    fetchDashboard();
    fetchReminderStats();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Unable to load dashboard data.</p>
      </div>
    );
  }

  const { stats, alumni_registrations_per_month, participation } = data;

  // ─── Employment pie data ───────────────────────────────
  // Employed comes straight from stats. When the participation payload is
  // present we can derive an accurate Unemployed / Unknown split from it:
  //   employment_known = employed + unemployed  →  unemployed = known − employed
  //   unknown = total_registered − known
  // Falling back to registered_alumni keeps the chart working if participation
  // is missing (non-blocking, same pattern as reminderStats).
  const employedCount = stats.employed_count || 0;
  const totalAlumni = participation?.total_registered ?? stats.registered_alumni ?? 0;
  const employmentKnown = participation?.employment_known ?? employedCount;
  const unemployedCount = Math.max(0, employmentKnown - employedCount);
  const unknownCount = Math.max(0, totalAlumni - employedCount - unemployedCount);

  const employmentBreakdown = [
    { name: "Employed", value: employedCount },
    { name: "Unemployed", value: unemployedCount },
    { name: "Unknown", value: unknownCount },
  ];
  const employmentPieData = employmentBreakdown.filter((d) => d.value > 0);
  // Legend always lists all three statuses so "Unknown" is never hidden.
  const EMPLOYMENT_LEGEND = employmentBreakdown;

  // ─── Board exam pie data ───────────────────────────────
  const boardPasserCount = stats.board_passers || 0;
  const boardFailedCount = stats.board_failed || 0;
  const boardNotTakenCount = stats.board_not_yet_taken || 0;

  const boardBreakdown = [
    { name: "Passers", value: boardPasserCount },
    { name: "Failed", value: boardFailedCount },
    { name: "Not Yet Taken", value: boardNotTakenCount },
  ];
  const boardPieData = boardBreakdown.filter((d) => d.value > 0);
  // Legend always lists all three statuses so empty slices are still shown.
  const BOARD_LEGEND = boardBreakdown;

  // Greeting based on time
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayLabel = format(now, "EEEE, MMMM d, yyyy");

  return (
    /* Dark wrapper — covers the parent's light padding with negative margins */
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] rounded-none">
      <div className="max-w-[1400px] mx-auto">
        {/* ═══ Header ═══════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {greeting}, {user?.first_name}
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-sm text-slate-400">
            Here's an overview of your alumni tracking system today.
          </p>
          <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-[0.1em] font-semibold">
            {todayLabel}
          </p>
        </div>

        {/* ═══ Stats Cards ═════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatCard
            title="Total Graduates"
            value={stats.total_graduates?.toLocaleString() || "0"}
            subtitle={`${stats.total_college_graduates?.toLocaleString() || 0} college graduates`}
            icon={HiOutlineAcademicCap}
            color="gold"
          />
          <StatCard
            title="Registered Alumni"
            value={stats.registered_alumni?.toLocaleString() || "0"}
            icon={HiOutlineUserGroup}
            color="blue"
            badge={
              stats.new_alumni_this_month > 0
                ? `+${stats.new_alumni_this_month}`
                : null
            }
            badgeUp={stats.alumni_growth_percent >= 0}
            footer={
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
                  <span className="text-slate-300 font-semibold tabular-nums">
                    {stats.active_recently ?? 0}
                  </span>
                  <span className="text-slate-500">active in last 30 days</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] flex-shrink-0" />
                  <span className="text-slate-300 font-semibold tabular-nums">
                    {stats.inactive_alumni ?? 0}
                  </span>
                  <span className="text-slate-500">inactive (30+ days no login)</span>
                </div>
              </div>
            }
          />
        </div>

        {/* ═══ Charts Row ══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Registration Trend Bar Chart — full width */}
          <div className="lg:col-span-2 bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-white">
                  Registration Trend
                </h2>
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
              {alumni_registrations_per_month &&
              alumni_registrations_per_month.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={alumni_registrations_per_month}
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
                  <p className="text-sm text-slate-500">
                    No activity data yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Employment Overview pie — left */}
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 flex flex-col">
            <div className="mb-2">
              <h2 className="text-[15px] font-bold text-white">
                Employment Overview
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Employed · Unemployed · Unknown breakdown
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              {employmentPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={employmentPieData}
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
                      {employmentPieData.map((entry) => (
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
              {EMPLOYMENT_LEGEND.map((item) => (
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
                <p className="text-xl font-bold text-[#c8a84e]">
                  {stats.employed_count || 0}
                </p>
                <p className="text-[10px] text-[#c8a84e]/70 font-medium mt-0.5">
                  Employed
                </p>
              </div>
              <div className="text-center p-3 bg-white/[0.05] rounded-xl border border-white/[0.08]">
                <p className="text-xl font-bold text-white">
                  {stats.employment_rate || 0}%
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Rate
                </p>
              </div>
            </div>
          </div>

          {/* Board Exam Overview pie — right */}
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 flex flex-col">
            <div className="mb-2">
              <h2 className="text-[15px] font-bold text-white">
                Board Exam Overview
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Passers · Failed · Not Yet Taken breakdown
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              {boardPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={boardPieData}
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
                      {boardPieData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={BOARD_COLORS[entry.name]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip colorMap={BOARD_COLORS} />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500">No data yet.</p>
              )}
            </div>

            {/* Legend — lists all three statuses so empty slices are still shown */}
            <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
              {BOARD_LEGEND.map((item) => (
                <span key={item.name} className="flex items-center gap-1.5 text-[10px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: BOARD_COLORS[item.name] }}
                  />
                  <span className="text-slate-400">
                    {item.name} · {item.value}
                  </span>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto pt-3">
              <div className="text-center p-3 bg-[#22c55e]/10 rounded-xl border border-[#22c55e]/15">
                <p className="text-xl font-bold text-[#22c55e]">
                  {stats.board_passers || 0}
                </p>
                <p className="text-[10px] text-[#22c55e]/70 font-medium mt-0.5">
                  Passers
                </p>
              </div>
              <div className="text-center p-3 bg-white/[0.05] rounded-xl border border-white/[0.08]">
                <p className="text-xl font-bold text-white">
                  {stats.board_passing_rate || 0}%
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Passing Rate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Automated Reminders (Phase 4) ═══════════════ */}
        {reminderStats && (
          <ReminderStatsSection stats={reminderStats} />
        )}

        {/* ═══ Alumni Participation ════════════════════════ */}
        {participation && <ParticipationSection participation={participation} />}
      </div>
    </div>
  );
}

// ─── Automated Reminder Stats (Phase 4) ──────────────────
const REMINDER_TYPE_META = {
  login_reminder: { icon: HiOutlineUserPlus, color: "text-blue-400", bg: "bg-blue-500/15" },
  employment_update: { icon: HiOutlineBriefcase, color: "text-[#c8a84e]", bg: "bg-[#c8a84e]/15" },
  profile_completion: { icon: HiOutlineClipboardDocumentList, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  announcement: { icon: HiOutlineEnvelope, color: "text-violet-400", bg: "bg-violet-500/15" },
};

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
    <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c8a84e]/15 flex items-center justify-center">
            <HiOutlineEnvelope className="w-5 h-5 text-[#c8a84e]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-white">
              Automated Reminders
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
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
            className="text-center p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]"
          >
            <p className="text-2xl font-extrabold text-white tracking-tight leading-none">
              {(card.value ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-[0.1em] font-semibold">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* By-type breakdown */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.03] text-[10px] uppercase tracking-[0.08em] text-slate-500">
              <th className="px-4 py-2.5 font-semibold">Reminder Type</th>
              <th className="px-3 py-2.5 font-semibold text-right">Today</th>
              <th className="px-3 py-2.5 font-semibold text-right">This Week</th>
              <th className="px-3 py-2.5 font-semibold text-right">This Month</th>
              <th className="px-4 py-2.5 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {byType.map((row) => {
              const meta = REMINDER_TYPE_META[row.type] || REMINDER_TYPE_META.announcement;
              const Icon = meta.icon;
              return (
                <tr
                  key={row.type}
                  className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </span>
                      <span className="text-[13px] font-medium text-slate-200">
                        {row.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-slate-300 tabular-nums">
                    {row.today}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-slate-300 tabular-nums">
                    {row.this_week}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-slate-300 tabular-nums">
                    {row.this_month}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-white tabular-nums">
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

// ─── Alumni Participation (tracer-study engagement) ──────
function clampPercent(value) {
  const n = Number(value) || 0;
  return Math.min(100, Math.max(0, n));
}

function ParticipationMetric({ icon: Icon, label, rate, caption }) {
  const pct = clampPercent(rate);
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-lg bg-[#c8a84e]/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#c8a84e]" />
        </span>
        <span className="text-[12px] font-semibold text-slate-200 leading-tight">
          {label}
        </span>
      </div>

      <p className="text-[32px] font-extrabold text-white tracking-tight leading-none">
        {pct}
        <span className="text-lg text-slate-400 font-bold">%</span>
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c8a84e] to-[#e0c76a] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-500 mt-2.5">{caption}</p>
    </div>
  );
}

function ParticipationSection({ participation }) {
  const {
    total_registered = 0,
    employment_known = 0,
    employment_known_rate = 0,
    profile_complete = 0,
    profile_complete_rate = 0,
  } = participation;

  return (
    <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c8a84e]/15 flex items-center justify-center">
            <HiOutlineChartBarSquare className="w-5 h-5 text-[#c8a84e]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-white">
              Alumni Participation
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              How complete is your alumni tracer data — higher rates mean more
              reliable analytics
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParticipationMetric
          icon={HiOutlineBriefcase}
          label="Employment Data Reported"
          rate={employment_known_rate}
          caption={`${employment_known.toLocaleString()} of ${total_registered.toLocaleString()} reported their employment status`}
        />
        <ParticipationMetric
          icon={HiOutlineIdentification}
          label="Profile Completion"
          rate={profile_complete_rate}
          caption={`${profile_complete.toLocaleString()} of ${total_registered.toLocaleString()} completed their profile`}
        />
      </div>

      {/* Caption */}
      <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
        Higher participation means more complete, reliable tracer-study data.
        Alumni still marked “Unknown” have not yet reported their status.
      </p>
    </div>
  );
}

// ─── Reusable Stat Card ──────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  badge,
  badgeUp,
  footer,
}) {
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
