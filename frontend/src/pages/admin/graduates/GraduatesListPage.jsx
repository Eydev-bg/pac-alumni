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
import { useToast } from "../../../hooks/useToast";
import Button from "../../../ui/Button";
import Select from "../../../ui/Select";
import SearchInput from "../../../ui/SearchInput";
import Card from "../../../ui/Card";
import {
  HiOutlineAcademicCap,
  HiOutlineArrowUpTray,
  HiOutlineUserCircle,
} from "react-icons/hi2";

// Grid page size for the card layout (named so it is not a magic number).
const GRADUATES_PER_PAGE = 60;

const BOARD_LABELS = {
  passed: "Passed",
  not_taken: "Not Yet Taken",
};
const EMPLOYMENT_LABELS = {
  employed: "Employed",
  unemployed: "Unemployed",
  unknown: "Unknown",
};
const BOARD_OPTIONS = [
  { value: "passed", label: "Passed" },
  { value: "not_taken", label: "Not Yet Taken" },
];
const EMPLOYMENT_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "unknown", label: "Unknown" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GraduateCard — flat by default, card box on hover
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GraduateCard({ graduate }) {
  const hasProfilePic = graduate.profile_picture;

  return (
    <Link
      to={`/admin/graduates/${graduate.id}`}
      className="group flex flex-col items-center text-center p-4 rounded-2xl border border-transparent hover:border-gold-500/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-gold-500/5 transition-all duration-300 cursor-pointer"
    >
      <div className="relative w-20 h-20 rounded-full mb-3 overflow-hidden border-2 border-white/[0.08] group-hover:border-gold-500/30 transition-colors duration-300 bg-navy-800/60 flex-shrink-0">
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
      <p className="text-sm font-semibold text-slate-200 group-hover:text-gold-500 transition-colors duration-200 leading-tight line-clamp-2">
        {graduate.full_name}
      </p>
      {graduate.course?.code && (
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          {graduate.course.code}
        </p>
      )}
      <div className="w-0 h-[2px] bg-gold-500 rounded-full mt-2.5 group-hover:w-10 transition-all duration-300" />
    </Link>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CourseSection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CourseSection({ courseName, graduates }) {
  return (
    <div className="mb-8">
      <div className="flex items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">
            {courseName}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-8 h-[3px] bg-gold-500 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
          </div>
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
  const toast = useToast();
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

  useEffect(() => {
    adminApi
      .getAllDepartments()
      .then((res) => setDepartments(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load departments filter:", err); });
    adminApi
      .getAllCourses()
      .then((res) => setCourses(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load courses filter:", err); });
    adminApi
      .getGraduationYears()
      .then((res) => setYears(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load graduation years filter:", err); });
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
        per_page: GRADUATES_PER_PAGE,
        sort_by: "last_name",
        sort_dir: "asc",
        ...(search && { search }),
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
      toast.error(err.response?.data?.message || "Failed to load graduates.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    yearFilter,
    deptFilter,
    courseFilter,
    isCollegeDept,
    boardFilter,
    showBoardFilter,
    empFilter,
    showEmpFilter,
    toast,
  ]);

  useEffect(() => {
    fetchGraduates();
  }, [fetchGraduates]);
  useEffect(() => {
    setPage(1);
  }, [search, yearFilter, deptFilter, courseFilter, boardFilter, empFilter]);

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

  const headerSubtitle = (() => {
    if (loading) return "Loading...";

    const hasAnyFilter =
      deptFilter ||
      yearFilter ||
      courseFilter ||
      boardFilter ||
      empFilter ||
      search;

    // No filters — default view showing all graduates
    if (!hasAnyFilter) return "All graduate records across education levels";

    // Search without department
    if (!deptFilter && search) {
      return `Search results for "${search}"`;
    }

    // Filters applied — build contextual label (no count)
    const parts = [];

    // Primary label: course name (more specific) or department name
    const selectedCourseName = courseFilter
      ? filteredCourses.find((c) => String(c.id) === String(courseFilter))?.name
      : null;
    parts.push(selectedCourseName || selectedDept?.name || "");

    // Batch year
    if (yearFilter) parts.push(`Batch ${yearFilter}`);

    // Qualifiers
    const qualifiers = [];
    if (boardFilter) qualifiers.push(BOARD_LABELS[boardFilter] || boardFilter);
    if (empFilter) qualifiers.push(EMPLOYMENT_LABELS[empFilter] || empFilter);
    if (search) qualifiers.push(`matching "${search}"`);

    let label = parts.filter(Boolean).join(" · ");
    if (qualifiers.length) label += ` · ${qualifiers.join(" · ")}`;

    return label;
  })();

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Graduates</h1>
            <p className="text-sm text-slate-400 mt-1">{headerSubtitle}</p>
          </div>
          <Button
            icon={HiOutlineArrowUpTray}
            onClick={() => navigate("/admin/graduates/import")}
          >
            Import Graduates
          </Button>
        </div>

        {/* Filters */}
        <Card padding={false} className="p-4 mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchInput
                className="flex-1"
                onDebouncedChange={setSearch}
                placeholder="Search by name or alumni ID..."
              />
              <Select
                tone="dark"
                className="min-w-[180px]"
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCourseFilter("");
                  setBoardFilter("");
                  setEmpFilter("");
                  setYearFilter("");
                }}
                placeholder="All Departments"
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>

            {hasDeptSelected && (
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  tone="dark"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  placeholder="All Years"
                  options={years.map((y) => ({ value: y, label: String(y) }))}
                />
                {isCollegeDept && filteredCourses.length > 0 && (
                  <Select
                    tone="dark"
                    className="min-w-[220px]"
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setBoardFilter("");
                    }}
                    placeholder="All Courses"
                    options={filteredCourses.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                )}
                {showBoardFilter && (
                  <Select
                    tone="dark"
                    value={boardFilter}
                    onChange={(e) => setBoardFilter(e.target.value)}
                    placeholder="All Board Status"
                    options={BOARD_OPTIONS}
                  />
                )}
                {showEmpFilter && (
                  <Select
                    tone="dark"
                    value={empFilter}
                    onChange={(e) => setEmpFilter(e.target.value)}
                    placeholder="All Employment"
                    options={EMPLOYMENT_OPTIONS}
                  />
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <Card className="p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
              <p className="text-sm text-slate-500">Loading graduates...</p>
            </div>
          </Card>
        ) : graduates.length === 0 ? (
          <Card className="p-16">
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
                className="mt-3 text-sm text-gold-500 hover:text-gold-300 font-medium transition-colors"
              >
                Import Graduates
              </button>
            </div>
          </Card>
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
              <Card padding={false} className="px-4 py-3 mt-4">
                <Pagination meta={meta} onPageChange={setPage} />
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
