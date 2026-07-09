// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/analytics/GraduateTracerTab.jsx
//  REDESIGNED: Filter-first approach
//  FIXED: Export modal moved to parent (AnalyticsDashboardPage)
//         to avoid overflow-hidden clipping issue.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import TracerBarChart from "./TracerBarChart";
import { useToast } from "../../../hooks/useToast";
import {
  HiOutlineFunnel,
  HiOutlineAcademicCap,
  HiOutlineChartBarSquare,
} from "react-icons/hi2";

const selectClass =
  "px-3 py-2.5 bg-navy-800 border border-white/[0.1] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-gold-500/40 appearance-none cursor-pointer min-w-[200px]";
const optionClass = "bg-navy-800 text-slate-300";

// ─── Empty State Component ───────────────────────────────
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gold-500/60" />
      </div>
      <p className="text-[15px] font-semibold text-slate-300">{title}</p>
      <p className="text-[12px] text-slate-500 mt-1.5 max-w-sm text-center">
        {subtitle}
      </p>
    </div>
  );
}

export default function GraduateTracerTab() {
  const toast = useToast();

  // ─── Filter options (loaded once) ──────────────────────
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [, setYears] = useState([]);

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
    ])
      .then(([deptRes, courseRes, yearRes]) => {
        const collegeDepts = (deptRes.data.data || []).filter(
          (d) => !d.education_level || d.education_level === "college",
        );
        setDepartments(collegeDepts);
        setCourses(courseRes.data.data || []);
        setYears(yearRes.data.data || []);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load filters.");
      });
  }, [toast]);

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
      toast.error(err.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [courseFilter, deptFilter, courses, toast]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // ─── Filtered courses for dropdown ─────────────────────
  const filteredCourses = deptFilter
    ? courses.filter((c) => String(c.department_id) === String(deptFilter))
    : courses;

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
              {d.name}
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
              {c.name}
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
            className="text-xs text-slate-500 hover:text-gold-500 underline transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
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
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/15 text-gold-500 text-[12px] font-semibold rounded-full border border-gold-500/20">
              <HiOutlineAcademicCap className="w-3.5 h-3.5" />
              {selectedCourse?.name}
              {selectedCourse?.is_board_program && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded-md font-bold uppercase">
                  Board Program
                </span>
              )}
            </span>
          </div>

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
