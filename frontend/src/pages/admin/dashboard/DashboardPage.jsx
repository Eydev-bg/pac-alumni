import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import adminApi from "../../../api/adminApi";
import useVisibilityPolling from "../../../hooks/useVisibilityPolling";
import { HiOutlineUserGroup, HiOutlineAcademicCap } from "react-icons/hi2";
import StatCard from "../../../ui/StatCard";
import EmploymentTypeChart from "./components/EmploymentTypeChart";
import EmploymentOverviewCard from "./components/EmploymentOverviewCard";
import BoardExamOverviewCard from "./components/BoardExamOverviewCard";
import ReminderStatsSection from "./components/ReminderStatsSection";

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [reminderStats, setReminderStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // `silent=true` on poll ticks — the loading spinner should only ever show
  // once, on first mount, not flash on every 30s background refresh.
  const fetchDashboard = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await adminApi.getDashboardData();
        setData(res.data.data);
      } catch (err) {
        // A failed background poll shouldn't nag the admin with a toast
        // every 30s — only surface the error on the initial, blocking load.
        if (!silent) {
          toast.error(
            err.response?.data?.message || "Failed to load dashboard data.",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    // Reminder stats are non-blocking — a failure here must not hide the
    // dashboard, so it fails silently (the section simply doesn't render).
    const fetchReminderStats = async () => {
      try {
        const res = await adminApi.getReminderStats();
        setReminderStats(res.data.data);
      } catch {
        // Intentionally ignored — secondary widget, non-blocking.
      }
    };

    fetchDashboard();
    fetchReminderStats();
  }, [fetchDashboard]);

  // Keep "active in last 30 days" / "inactive" (and the rest of the stats
  // card) fresh without a manual refresh — silent, tab-visibility-aware
  // poll every 60s. Same pattern as the messaging feature's inbox/thread
  // polling: pauses while the tab is hidden, catches up immediately on
  // return.
  useVisibilityPolling(() => fetchDashboard(true), 60000);

  // ─── Employment pie data (memoized) ────────────────────
  // Employed comes straight from stats. Without a participation payload we
  // can't split reported "Unemployed" from "Unknown", so everyone who isn't
  // counted as employed falls into Unknown:
  //   unemployed = 0
  //   unknown = registered_alumni − employed
  // Recomputes only when the dashboard payload changes.
  const employmentChart = useMemo(() => {
    if (!data) return null;
    const { stats } = data;
    const employedCount = stats.employed_count || 0;
    const totalAlumni = stats.registered_alumni ?? 0;
    const unemployedCount = stats.unemployed_count || 0;
    const unknownCount = Math.max(
      0,
      totalAlumni - employedCount - unemployedCount,
    );

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
      // Context for the rate: how many profiles actually reported a status.
      knownCount: stats.employment_known_count ?? 0,
      totalProfiles: stats.employment_total_profiles ?? 0,
    };
  }, [data]);

  // ─── Board exam pie data (memoized) ────────────────────
  const boardChart = useMemo(() => {
    if (!data) return null;
    const { stats } = data;

    const breakdown = [
      { name: "Passed", value: stats.board_passers || 0 },
      { name: "Not Yet Taken", value: stats.board_not_yet_taken || 0 },
    ];

    return {
      // Legend always lists all three statuses so empty slices are still shown.
      legend: breakdown,
      pieData: breakdown.filter((d) => d.value > 0),
      passed: stats.board_passers || 0,
      // Population-based: passed / total board-program graduates (meaningful,
      // unlike the record-based AnalyticsService rate removed in Phase 2.2).
      passingRate: stats.board_passing_rate || 0,
    };
  }, [data]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-gold-500 mb-3" />
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

  const { stats, employment_type_breakdown } = data;

  // Greeting based on time
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayLabel = format(now, "EEEE, MMMM d, yyyy");

  return (
    /* Dark wrapper — covers the parent's light padding with negative margins */
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* ═══ Header ═══════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {greeting}, {user?.first_name}
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-semibold tabular-nums">
                    {stats.active_recently ?? 0}
                  </span>
                  <span className="text-slate-500">active in last 30 days</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-semibold tabular-nums">
                    {stats.inactive_alumni ?? 0}
                  </span>
                  <span className="text-slate-500">
                    inactive (30+ days no login)
                  </span>
                </div>
              </div>
            }
          />
        </div>

        {/* ═══ Charts Row ══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Employment Type Distribution — horizontal bar (full width) */}
          <EmploymentTypeChart
            data={employment_type_breakdown?.types ?? employment_type_breakdown}
            totalAlumni={
              (employment_type_breakdown?.total ?? stats.registered_alumni) || 1
            }
          />

          {/* Employment Overview pie — left */}
          <EmploymentOverviewCard
            pieData={employmentChart.pieData}
            legend={employmentChart.legend}
            employedCount={employmentChart.employedCount}
            employmentRate={employmentChart.employmentRate}
            knownCount={employmentChart.knownCount}
            totalProfiles={employmentChart.totalProfiles}
          />

          {/* Board Exam Overview pie — right */}
          <BoardExamOverviewCard
            pieData={boardChart.pieData}
            legend={boardChart.legend}
            passed={boardChart.passed}
            passingRate={boardChart.passingRate}
          />
        </div>

        {/* ═══ Automated Reminders ═════════════════════════ */}
        {reminderStats && <ReminderStatsSection stats={reminderStats} />}
      </div>
    </>
  );
}
