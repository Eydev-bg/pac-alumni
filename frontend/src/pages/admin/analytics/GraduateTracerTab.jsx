// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/analytics/GraduateTracerTab.jsx
//  REDESIGNED: Filter-first approach
//  FIXED: Export modal moved to parent (AnalyticsDashboardPage)
//         to avoid overflow-hidden clipping issue.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import TracerBarChart from "./TracerBarChart";
import {
  HiOutlineFunnel,
  HiOutlineArrowDownTray,
  HiOutlineAcademicCap,
  HiOutlineChartBarSquare,
} from "react-icons/hi2";

const selectClass =
  "px-3 py-2.5 bg-[#1a2e5a] border border-white/[0.1] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer min-w-[200px]";
const optionClass = "bg-[#1a2e5a] text-slate-300";

export default function GraduateTracerTab({ onOpenExport }) {
  // ─── Filter options (loaded once) ──────────────────────
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);

  // ─── Filter state ──────────────────────────────────────
  const [deptFilter, setDeptFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  // ─── Data state ────────────────────────────────────────
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── Selected course info ──────────────────────────────
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ─── Load filter options ───────────────────────────────
  useEffect(() => {
    Promise.all([
      adminApi.getAllDepartments(),
      adminApi.getAllCourses(),
      adminApi.getGraduationYears("college"),
    ]).then(([deptRes, courseRes, yearRes]) => {
      const collegeDepts = (deptRes.data.data || []).filter(
        (d) => !d.education_level || d.education_level === "college",
      );
      setDepartments(collegeDepts);
      setCourses(courseRes.data.data || []);
      setYears(yearRes.data.data || []);
    });
  }, []);

  // ─── Fetch chart data when course is selected ──────────
  const fetchChartData = useCallback(async () => {
    if (!courseFilter) {
      setChartData(null);
      setSelectedCourse(null);
      return;
    }

    setLoading(true);
    try {
      const params = { course_id: courseFilter };
      if (deptFilter) params.department_id = deptFilter;

      const res = await adminApi.getTracerByCourse(params);
      setChartData(res.data.data);

      const course = courses.find((c) => String(c.id) === String(courseFilter));
      setSelectedCourse(course || null);
    } catch (err) {
      console.error("Tracer chart error:", err);
    } finally {
      setLoading(false);
    }
  }, [courseFilter, deptFilter, courses]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // ─── Filtered courses for dropdown ─────────────────────
  const filteredCourses = deptFilter
    ? courses.filter((c) => String(c.department_id) === String(deptFilter))
    : courses;

  // ─── Summary totals (across all years for selected course)
  const totals =
    chartData && chartData.length > 0
      ? chartData.reduce(
          (acc, row) => ({
            graduates: acc.graduates + (row.total_graduates || 0),
            registered: acc.registered + (row.registered || 0),
            employed: acc.employed + (row.employed || 0),
            boardPassers: acc.boardPassers + (row.board_passers || 0),
          }),
          { graduates: 0, registered: 0, employed: 0, boardPassers: 0 },
        )
      : null;

  // ─── Handle export button click ────────────────────────
  const handleExportClick = () => {
    onOpenExport({
      courseId: courseFilter,
      batchYear: "",
      departmentId: deptFilter,
      departments,
      courses,
      years,
    });
  };

  return (
    <div className="space-y-6">
      {/* ═══ FILTERS ═══ */}
      <div className="flex flex-wrap items-center gap-3">
        <HiOutlineFunnel className="w-4 h-4 text-slate-500" />

        {/* Department */}
        <select
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setCourseFilter("");
            setChartData(null);
            setSelectedCourse(null);
          }}
          className={selectClass}
          style={{ colorScheme: "dark" }}
        >
          <option value="" className={optionClass}>
            Select Department
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id} className={optionClass}>
              {d.code} — {d.name}
            </option>
          ))}
        </select>

        {/* Course — enabled only when department is selected */}
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className={`${selectClass} ${!deptFilter ? "opacity-50 cursor-not-allowed" : ""}`}
          style={{ colorScheme: "dark" }}
          disabled={!deptFilter}
        >
          <option value="" className={optionClass}>
            Select Course
          </option>
          {filteredCourses.map((c) => (
            <option key={c.id} value={c.id} className={optionClass}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {(deptFilter || courseFilter) && (
          <button
            onClick={() => {
              setDeptFilter("");
              setCourseFilter("");
              setChartData(null);
              setSelectedCourse(null);
            }}
            className="text-xs text-slate-500 hover:text-[#c8a84e] underline transition-colors"
          >
            Clear filters
          </button>
        )}

        {/* Export button */}
        <button
          onClick={handleExportClick}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#c8a84e] bg-[#c8a84e]/10 border border-[#c8a84e]/20 rounded-xl hover:bg-[#c8a84e]/20 transition-colors"
        >
          <HiOutlineArrowDownTray className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* ═══ CONTENT ═══ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </div>
      ) : !deptFilter ? (
        <EmptyState
          icon={HiOutlineAcademicCap}
          title="Select a Department"
          subtitle="Choose a department to get started with graduate tracer analytics"
        />
      ) : !courseFilter ? (
        <EmptyState
          icon={HiOutlineChartBarSquare}
          title="Select a Course"
          subtitle={`Choose a course under ${departments.find((d) => String(d.id) === deptFilter)?.name || "the selected department"} to view year-by-year analytics`}
        />
      ) : chartData && chartData.length > 0 ? (
        <div className="space-y-6">
          {/* Course badge */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#c8a84e]/15 text-[#c8a84e] text-[12px] font-semibold rounded-full border border-[#c8a84e]/20">
              <HiOutlineAcademicCap className="w-3.5 h-3.5" />
              {selectedCourse?.code} — {selectedCourse?.name}
              {selectedCourse?.is_board_program && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded-md font-bold uppercase">
                  Board Program
                </span>
              )}
            </span>
          </div>

          {/* Summary totals across all years */}
          {totals && (
            <div
              className={`grid gap-4 ${selectedCourse?.is_board_program ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"}`}
            >
              <TotalCard
                label="Total Graduates"
                value={totals.graduates}
                color="text-blue-400"
                subColor="bg-blue-500/15"
              />
              <TotalCard
                label="Total Registered"
                value={totals.registered}
                color="text-emerald-400"
                subColor="bg-emerald-500/15"
                rate={
                  totals.graduates > 0
                    ? ((totals.registered / totals.graduates) * 100).toFixed(1)
                    : 0
                }
                rateLabel="of graduates"
              />
              {selectedCourse?.is_board_program && (
                <TotalCard
                  label="Total Board Passers"
                  value={totals.boardPassers}
                  color="text-amber-400"
                  subColor="bg-amber-500/15"
                  rate={
                    totals.graduates > 0
                      ? (
                          (totals.boardPassers / totals.graduates) *
                          100
                        ).toFixed(1)
                      : 0
                  }
                  rateLabel="passing rate"
                />
              )}
              <TotalCard
                label="Total Employed"
                value={totals.employed}
                color="text-[#c8a84e]"
                subColor="bg-[#c8a84e]/15"
                rate={
                  totals.registered > 0
                    ? ((totals.employed / totals.registered) * 100).toFixed(1)
                    : 0
                }
                rateLabel="of registered"
              />
            </div>
          )}

          {/* Bar Chart */}
          <TracerBarChart
            data={chartData}
            isBoardProgram={selectedCourse?.is_board_program || false}
            courseCode={selectedCourse?.code || ""}
          />
        </div>
      ) : (
        <EmptyState
          icon={HiOutlineChartBarSquare}
          title="No Graduate Data"
          subtitle={`No graduates found for ${selectedCourse?.code || "this course"}. Import graduates first.`}
        />
      )}
    </div>
  );
}

// ─── Empty State Component ───────────────────────────────
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-[#c8a84e]/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#c8a84e]/60" />
      </div>
      <p className="text-[15px] font-semibold text-slate-300">{title}</p>
      <p className="text-[12px] text-slate-500 mt-1.5 max-w-sm text-center">
        {subtitle}
      </p>
    </div>
  );
}

// ─── Total Card Component ────────────────────────────────
function TotalCard({ label, value, color, subColor, rate, rateLabel }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1.5 ${color}`}>
        {value.toLocaleString()}
      </p>
      {rate !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${subColor} ${color}`}
          >
            {rate}%
          </span>
          <span className="text-[10px] text-slate-500">{rateLabel}</span>
        </div>
      )}
    </div>
  );
}
