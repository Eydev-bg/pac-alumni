import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "../../../hooks/useAuth";
import adminApi from "../../../api/adminApi";
import { HiOutlineUserGroup, HiOutlineAcademicCap } from "react-icons/hi2";
import StatCard from "./components/StatCard";
import RegistrationTrendChart from "./components/RegistrationTrendChart";
import EmploymentOverviewCard from "./components/EmploymentOverviewCard";
import BoardExamOverviewCard from "./components/BoardExamOverviewCard";
import ReminderStatsSection from "./components/ReminderStatsSection";
import ParticipationSection from "./components/ParticipationSection";

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

  // ─── Employment pie data (memoized) ────────────────────
  // Employed comes straight from stats. When the participation payload is
  // present we can derive an accurate Unemployed / Unknown split from it:
  //   employment_known = employed + unemployed  →  unemployed = known − employed
  //   unknown = total_registered − known
  // Falling back to registered_alumni keeps the chart working if participation
  // is missing (non-blocking, same pattern as reminderStats). Recomputes only
  // when the dashboard payload changes.
  const employmentChart = useMemo(() => {
    if (!data) return null;
    const { stats, participation } = data;
    const employedCount = stats.employed_count || 0;
    const totalAlumni =
      participation?.total_registered ?? stats.registered_alumni ?? 0;
    const employmentKnown = participation?.employment_known ?? employedCount;
    const unemployedCount = Math.max(0, employmentKnown - employedCount);
    const unknownCount = Math.max(0, totalAlumni - employedCount - unemployedCount);

    const breakdown = [
      { name: "Employed", value: employedCount },
      { name: "Unemployed", value: unemployedCount },
      { name: "Unknown", value: unknownCount },
    ];

    return {
      // Legend always lists all three statuses so "Unknown" is never hidden.
      legend: breakdown,
      pieData: breakdown.filter((d) => d.value > 0),
      employedCount,
      employmentRate: stats.employment_rate || 0,
    };
  }, [data]);

  // ─── Board exam pie data (memoized) ────────────────────
  const boardChart = useMemo(() => {
    if (!data) return null;
    const { stats } = data;

    const breakdown = [
      { name: "Passers", value: stats.board_passers || 0 },
      { name: "Failed", value: stats.board_failed || 0 },
      { name: "Not Yet Taken", value: stats.board_not_yet_taken || 0 },
    ];

    return {
      // Legend always lists all three statuses so empty slices are still shown.
      legend: breakdown,
      pieData: breakdown.filter((d) => d.value > 0),
      passers: stats.board_passers || 0,
      passingRate: stats.board_passing_rate || 0,
    };
  }, [data]);

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
          <RegistrationTrendChart data={alumni_registrations_per_month} />

          {/* Employment Overview pie — left */}
          <EmploymentOverviewCard
            pieData={employmentChart.pieData}
            legend={employmentChart.legend}
            employedCount={employmentChart.employedCount}
            employmentRate={employmentChart.employmentRate}
          />

          {/* Board Exam Overview pie — right */}
          <BoardExamOverviewCard
            pieData={boardChart.pieData}
            legend={boardChart.legend}
            passers={boardChart.passers}
            passingRate={boardChart.passingRate}
          />
        </div>

        {/* ═══ Automated Reminders ═════════════════════════ */}
        {reminderStats && <ReminderStatsSection stats={reminderStats} />}

        {/* ═══ Alumni Participation ════════════════════════ */}
        {participation && <ParticipationSection participation={participation} />}
      </div>
    </div>
  );
}
