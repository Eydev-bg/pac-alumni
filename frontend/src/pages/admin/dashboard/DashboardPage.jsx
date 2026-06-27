import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import adminApi from "../../../api/adminApi";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { timeAgo } from "../../../utils/formatters";
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
  HiOutlineClipboardDocumentCheck,
  HiOutlineBriefcase,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

// ─── Color palette (navy + gold) ─────────────────────────
const COLORS = {
  registrations: "#c8a84e",
  activeUsers: "#3b82f6",
};

const PIE_COLORS_EMPLOYMENT = ["#c8a84e", "#ef4444", "#475569"];

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

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1a2e5a] border border-[#c8a84e]/20 rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 text-[12px]">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: d.payload.fill }}
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
    fetchDashboard();
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

  const {
    stats,
    alumni_registrations_per_month,
    latest_registered_alumni,
    recent_activity,
  } = data;

  // Employment pie data
  const employedCount = stats.employed_count || 0;
  const totalKnown =
    employedCount + Math.max(0, (stats.registered_alumni || 0) - employedCount);
  const unemployedCount = Math.max(
    0,
    totalKnown -
      employedCount -
      ((stats.registered_alumni || 0) - (stats.active_alumni || 0)),
  );
  const unknownCount = Math.max(
    0,
    (stats.registered_alumni || 0) - employedCount - unemployedCount,
  );

  const employmentPieData = [
    { name: "Employed", value: employedCount },
    { name: "Unemployed", value: unemployedCount },
    { name: "Unknown", value: unknownCount },
  ].filter((d) => d.value > 0);

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
        </div>

        {/* ═══ Stats Cards ═════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            subtitle={`${stats.active_alumni || 0} active accounts`}
            icon={HiOutlineUserGroup}
            color="blue"
            badge={
              stats.new_alumni_this_month > 0
                ? `+${stats.new_alumni_this_month}`
                : null
            }
            badgeUp={stats.alumni_growth_percent >= 0}
          />
          <StatCard
            title="Board Passers"
            value={stats.board_passers?.toLocaleString() || "0"}
            subtitle="unique board passers"
            icon={HiOutlineClipboardDocumentCheck}
            color="emerald"
          />
          <StatCard
            title="Employment Rate"
            value={`${stats.employment_rate || 0}%`}
            subtitle={`${stats.employed_count || 0} currently employed`}
            icon={HiOutlineBriefcase}
            color="amber"
          />
        </div>

        {/* ═══ Charts Row ══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Alumni Activity Bar Chart — 2 cols */}
          <div className="lg:col-span-2 bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-white">
                  Alumni Activity
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Registrations vs active users — last 12 months
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-5 text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#c8a84e] inline-block" />{" "}
                  <span className="text-slate-400">Registrations</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#3b82f6] inline-block" />{" "}
                  <span className="text-slate-400">Active Users</span>
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
                    <Bar
                      dataKey="active_users"
                      name="Active Users"
                      fill={COLORS.activeUsers}
                      radius={[6, 6, 0, 0]}
                      animationDuration={1400}
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

          {/* Employment Pie Chart — 1 col */}
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 flex flex-col">
            <div className="mb-2">
              <h2 className="text-[15px] font-bold text-white">
                Employment Overview
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Alumni employment breakdown
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
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {employmentPieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            PIE_COLORS_EMPLOYMENT[
                              index % PIE_COLORS_EMPLOYMENT.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500">No data yet.</p>
              )}
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
        </div>

        {/* ═══ Bottom Row ══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Activity Feed — 3 cols */}
          <div className="lg:col-span-3 bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-white">
                Recent Activity
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </span>
            </div>
            <div className="space-y-1">
              {!recent_activity || recent_activity.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No recent activity.
                </p>
              ) : (
                recent_activity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] rounded-xl px-3 -mx-3 transition-colors duration-150"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.status === "verified" || item.status === "success"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : item.status === "failed" ||
                              item.status === "rejected"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {item.type === "verification" ? (
                        item.status === "verified" ? (
                          <HiOutlineCheckCircle className="w-[18px] h-[18px]" />
                        ) : (
                          <HiOutlineXCircle className="w-[18px] h-[18px]" />
                        )
                      ) : item.status === "success" ? (
                        <HiOutlineShieldCheck className="w-[18px] h-[18px]" />
                      ) : (
                        <HiOutlineExclamationTriangle className="w-[18px] h-[18px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-200 leading-snug font-medium">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0 whitespace-nowrap pt-0.5 font-medium">
                      {timeAgo(item.time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Latest Registered Alumni — 2 cols */}
          <div className="lg:col-span-2 bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-white">
                Latest Registered Alumni
              </h2>
              <Link
                to="/admin/graduates"
                className="text-[11px] text-[#c8a84e] hover:text-[#e0c76a] font-semibold tracking-wide transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-1">
              {!latest_registered_alumni ||
              latest_registered_alumni.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No registered alumni yet.
                </p>
              ) : (
                latest_registered_alumni.map((alumni, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] rounded-xl px-3 -mx-3 transition-colors duration-150"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c8a84e] to-[#a88a3a] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#c8a84e]/10">
                      <span className="text-[11px] font-bold text-white">
                        {alumni.initials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-200 truncate">
                        {alumni.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {alumni.department && (
                          <span className="font-medium text-slate-400">
                            {alumni.department}
                          </span>
                        )}
                        {alumni.department && alumni.graduation_year && (
                          <span> · </span>
                        )}
                        {alumni.graduation_year && (
                          <span>Class of {alumni.graduation_year}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0 font-medium">
                      {timeAgo(alumni.registered_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
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
      <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
      <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.1em] font-semibold">
        {title}
      </p>
    </div>
  );
}
