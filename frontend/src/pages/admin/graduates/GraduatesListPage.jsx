// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/graduates/GraduatesListPage.jsx
//  Card-based layout grouped by course with profile pictures.
//  Cards are flat/borderless by default — card box appears on hover.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import { storageUrl } from "../../../utils/formatters";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineAcademicCap,
  HiOutlineArrowUpTray,
  HiOutlineUserCircle,
} from "react-icons/hi2";

const selectClass =
  "px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GraduateCard — flat by default, card box on hover
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GraduateCard({ graduate }) {
  const hasProfilePic = graduate.profile_picture;

  return (
    <Link
      to={`/admin/graduates/${graduate.id}`}
      className="group flex flex-col items-center text-center p-4 rounded-2xl border border-transparent hover:border-[#c8a84e]/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-[#c8a84e]/5 transition-all duration-300 cursor-pointer"
    >
      <div className="relative w-20 h-20 rounded-full mb-3 overflow-hidden border-2 border-white/[0.08] group-hover:border-[#c8a84e]/30 transition-colors duration-300 bg-[#1a2e5a]/60 flex-shrink-0">
        {hasProfilePic ? (
          <img
            src={storageUrl(graduate.profile_picture)}
            alt={graduate.full_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center ${hasProfilePic ? "hidden" : "flex"}`}
        >
          <HiOutlineUserCircle className="w-10 h-10 text-slate-500" />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-200 group-hover:text-[#c8a84e] transition-colors duration-200 leading-tight line-clamp-2">
        {graduate.full_name}
      </p>
      {graduate.course?.code && (
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          {graduate.course.code}
        </p>
      )}
      <div className="w-0 h-[2px] bg-[#c8a84e] rounded-full mt-2.5 group-hover:w-10 transition-all duration-300" />
    </Link>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CourseSection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CourseSection({ courseName, graduates }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">
            {courseName}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-8 h-[3px] bg-[#c8a84e] rounded-full" />
            <div className="w-1.5 h-1.5 bg-[#c8a84e] rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-xl">
          <HiOutlineAcademicCap className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-400">
            {graduates.length}{" "}
            {graduates.length === 1 ? "graduate" : "graduates"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
        {graduates.map((g) => (
          <GraduateCard key={g.id} graduate={g} />
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Main Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function GraduatesListPage() {
  const navigate = useNavigate();
  const [graduates, setGraduates] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [boardFilter, setBoardFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    adminApi
      .getAllDepartments()
      .then((res) => setDepartments(res.data.data))
      .catch(() => {});
    adminApi
      .getAllCourses()
      .then((res) => setCourses(res.data.data))
      .catch(() => {});
    adminApi
      .getGraduationYears()
      .then((res) => setYears(res.data.data))
      .catch(() => {});
  }, []);

  const selectedDept = departments.find(
    (d) => String(d.id) === String(deptFilter),
  );
  const isCollegeDept = selectedDept?.education_level === "college";
  const hasDeptSelected = !!deptFilter;

  const filteredCourses = deptFilter
    ? courses.filter((c) => String(c.department_id) === String(deptFilter))
    : courses;

  const selectedCourse = courses.find(
    (c) => String(c.id) === String(courseFilter),
  );
  const showBoardFilter =
    isCollegeDept &&
    (courseFilter
      ? selectedCourse?.is_board_program
      : filteredCourses.some((c) => c.is_board_program));
  const showEmpFilter = isCollegeDept;

  useEffect(() => {
    if (!isCollegeDept) {
      setBoardFilter("");
      setEmpFilter("");
    }
  }, [isCollegeDept]);

  useEffect(() => {
    if (courseFilter && selectedCourse && !selectedCourse.is_board_program)
      setBoardFilter("");
  }, [courseFilter, selectedCourse]);

  const fetchGraduates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 60,
        sort_by: "last_name",
        sort_dir: "asc",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(yearFilter && { graduation_year: yearFilter }),
        ...(deptFilter && { department_id: deptFilter }),
        ...(courseFilter && isCollegeDept && { course_id: courseFilter }),
        ...(boardFilter && showBoardFilter && { board_status: boardFilter }),
        ...(empFilter && showEmpFilter && { employment_status: empFilter }),
      };
      const res = await adminApi.getGraduates(params);
      setGraduates(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch graduates:", err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    yearFilter,
    deptFilter,
    courseFilter,
    isCollegeDept,
    boardFilter,
    showBoardFilter,
    empFilter,
    showEmpFilter,
  ]);

  useEffect(() => {
    fetchGraduates();
  }, [fetchGraduates]);
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    yearFilter,
    deptFilter,
    courseFilter,
    boardFilter,
    empFilter,
  ]);

  const groupedByCourse = graduates.reduce((groups, g) => {
    const key = g.course?.code || g.department?.code || "Other";
    const name =
      g.course?.name ||
      g.department?.name ||
      (g.education_level === "college"
        ? "Uncategorized"
        : g.education_level_label);
    if (!groups[key])
      groups[key] = { courseName: name, courseCode: key, graduates: [] };
    groups[key].graduates.push(g);
    return groups;
  }, {});
  const courseGroups = Object.values(groupedByCourse).sort((a, b) =>
    a.courseName.localeCompare(b.courseName),
  );

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Graduates</h1>
            <p className="text-sm text-slate-400 mt-1">
              All graduate records across education levels
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/graduates/import")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all shadow-lg shadow-[#c8a84e]/20"
          >
            <HiOutlineArrowUpTray className="w-4 h-4" />
            Import Graduates
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or alumni ID..."
                  className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors"
                />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCourseFilter("");
                  setBoardFilter("");
                  setEmpFilter("");
                  setYearFilter("");
                }}
                className={`${selectClass} min-w-[180px]`}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {hasDeptSelected && (
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="">All Years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {isCollegeDept && filteredCourses.length > 0 && (
                  <select
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setBoardFilter("");
                    }}
                    className={`${selectClass} min-w-[220px]`}
                  >
                    <option value="">All Courses</option>
                    {filteredCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {showBoardFilter && (
                  <select
                    value={boardFilter}
                    onChange={(e) => setBoardFilter(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All Board Status</option>
                    <option value="passer">Board Passer</option>
                    <option value="failed">Board Failed</option>
                    <option value="not_taken">Not Yet Taken</option>
                  </select>
                )}
                {showEmpFilter && (
                  <select
                    value={empFilter}
                    onChange={(e) => setEmpFilter(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All Employment</option>
                    <option value="employed">Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="unknown">Unknown</option>
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Count */}
        {!loading && meta && (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c8a84e]/15 text-[#c8a84e] flex items-center justify-center flex-shrink-0">
              <HiOutlineAcademicCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{meta.total}</p>
              <p className="text-xs text-slate-400">
                {!deptFilter &&
                !yearFilter &&
                !courseFilter &&
                !debouncedSearch &&
                !boardFilter &&
                !empFilter
                  ? "Total Graduates"
                  : `Graduates ${selectedDept ? `in ${selectedDept.name}` : ""}${courseFilter ? ` — ${filteredCourses.find((c) => String(c.id) === String(courseFilter))?.code || ""}` : ""}${yearFilter ? ` (${yearFilter})` : ""}${boardFilter ? ` · ${boardFilter.replace("_", " ")}` : ""}${empFilter ? ` · ${empFilter}` : ""}${debouncedSearch ? ` matching "${debouncedSearch}"` : ""}`}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading graduates...</p>
            </div>
          </div>
        ) : graduates.length === 0 ? (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-16">
            <div className="flex flex-col items-center justify-center text-center">
              <HiOutlineAcademicCap className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No graduates found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || yearFilter || deptFilter || boardFilter || empFilter
                  ? "Try adjusting your filters."
                  : "Import graduate records to get started."}
              </p>
              <button
                onClick={() => navigate("/admin/graduates/import")}
                className="mt-3 text-sm text-[#c8a84e] hover:text-[#e0c76a] font-medium transition-colors"
              >
                Import Graduates
              </button>
            </div>
          </div>
        ) : (
          <div>
            {courseGroups.map((group) => (
              <CourseSection
                key={group.courseCode}
                courseName={group.courseName}
                graduates={group.graduates}
              />
            ))}
            {meta && (
              <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] px-4 py-3 mt-4">
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
