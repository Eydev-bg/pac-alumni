// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/alumni/AlumniSearchPage.jsx
//  Features 31-35: Search directory with advanced filters
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import { HiOutlineMagnifyingGlass, HiOutlineUserGroup } from "react-icons/hi2";

// Reusable dark select style classes (so dropdown options also render dark)
const selectClass =
  "px-3 py-2 bg-[#1a2e5a] border border-white/[0.1] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer";
const optionClass = "bg-[#1a2e5a] text-slate-300";

export default function AlumniSearchPage() {
  const [results, setResults] = useState([]);
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
      .then((res) => {
        // Alumni accounts are college-only — filter out Elementary/JHS/SHS
        const collegeDepts = (res.data.data || []).filter(
          (d) => !d.education_level || d.education_level === "college",
        );
        setDepartments(collegeDepts);
      })
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load departments filter:", err); });
    adminApi
      .getAllCourses()
      .then((res) => setCourses(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load courses filter:", err); });
    adminApi
      .getGraduationYears("college")
      .then((res) => setYears(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load graduation years filter:", err); });
  }, []);

  const filteredCourses = deptFilter
    ? courses.filter((c) => String(c.department_id) === String(deptFilter))
    : courses;

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(yearFilter && { graduation_year: yearFilter }),
        ...(deptFilter && { department_id: deptFilter }),
        ...(courseFilter && { course_id: courseFilter }),
        ...(boardFilter && { board_status: boardFilter }),
        ...(empFilter && { employment_status: empFilter }),
      };
      const res = await adminApi.searchAlumni(params);
      setResults(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    yearFilter,
    deptFilter,
    courseFilter,
    boardFilter,
    empFilter,
  ]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);
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

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Alumni Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Search and filter alumni records with advanced filters
          </p>
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
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className={selectClass}
                style={{ colorScheme: "dark" }}
              >
                <option value="" className={optionClass}>
                  All Years
                </option>
                {years.map((y) => (
                  <option key={y} value={y} className={optionClass}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCourseFilter("");
                }}
                className={selectClass}
                style={{ colorScheme: "dark" }}
              >
                <option value="" className={optionClass}>
                  All Departments
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className={optionClass}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className={selectClass}
                style={{ colorScheme: "dark" }}
              >
                <option value="" className={optionClass}>
                  All Courses
                </option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id} className={optionClass}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={boardFilter}
                onChange={(e) => setBoardFilter(e.target.value)}
                className={selectClass}
                style={{ colorScheme: "dark" }}
              >
                <option value="" className={optionClass}>
                  All Board Status
                </option>
                <option value="passed" className={optionClass}>
                  Passed
                </option>
                <option value="not_taken" className={optionClass}>
                  Not Yet Taken
                </option>
                <option value="not_applicable" className={optionClass}>
                  Not Applicable
                </option>
              </select>
              <select
                value={empFilter}
                onChange={(e) => setEmpFilter(e.target.value)}
                className={selectClass}
                style={{ colorScheme: "dark" }}
              >
                <option value="" className={optionClass}>
                  All Employment
                </option>
                <option value="employed" className={optionClass}>
                  Employed
                </option>
                <option value="unemployed" className={optionClass}>
                  Unemployed
                </option>
                <option value="unknown" className={optionClass}>
                  Unknown
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Searching alumni...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineUserGroup className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No alumni found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Alumni ID
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Department
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Year
                    </th>
                    <th className="text-right py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {results.map((g) => (
                    <tr
                      key={g.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        {g.alumni_id_number ? (
                          <span className="font-mono text-[11px] font-semibold text-[#c8a84e] bg-[#c8a84e]/10 px-2 py-1 rounded-lg border border-[#c8a84e]/20">
                            {g.alumni_id_number}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {g.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {g.department?.code || (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-semibold">
                        {g.graduation_year}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/alumni/${g.id}`}
                          className="text-[#c8a84e] hover:text-[#e0c76a] text-xs font-semibold transition-colors"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && (
            <div className="px-4 pb-4">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
