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
import {
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineBuildingOffice2,
  HiOutlineFunnel,
} from "react-icons/hi2";

// Dark-themed tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2e5a] border border-[#c8a84e]/20 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-semibold text-[#c8a84e] mb-1.5">{label}</p>
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

export default function CollegeAnalyticsTab() {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const [gradData, setGradData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load departments
  useEffect(() => {
    adminApi
      .getAllDepartments()
      .then((res) => {
        const collegeDepts = (res.data.data || []).filter(
          (d) => !d.education_level || d.education_level === "college",
        );
        setDepartments(collegeDepts);
      })
      .catch(() => {});
  }, []);

  // Load courses when department changes
  useEffect(() => {
    if (!deptFilter) {
      setCourses([]);
      setCourseFilter("");
      return;
    }
    adminApi
      .getAllCourses(deptFilter)
      .then((res) => setCourses(res.data.data || []))
      .catch(() => setCourses([]));
    setCourseFilter("");
  }, [deptFilter]);

  // Fetch graduate data
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (courseFilter) {
      params.course_id = courseFilter;
    } else if (deptFilter) {
      params.department_id = deptFilter;
    }

    adminApi
      .getCollegeAnalytics(params)
      .then((res) => setGradData(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [deptFilter, courseFilter]);

  const chartData = gradData?.by_year
    ? [...gradData.by_year].sort(
        (a, b) => a.graduation_year - b.graduation_year,
      )
    : [];

  const selectedDept = departments.find(
    (d) => String(d.id) === String(deptFilter),
  );
  const selectedCourse = courses.find(
    (c) => String(c.id) === String(courseFilter),
  );

  // Show chart only when a specific course is selected
  const showChart = !!courseFilter && chartData.length > 0;

  return (
    <div className="space-y-6">
      {/* ═══ FILTERS ═══ */}
      <div className="flex flex-wrap items-center gap-3">
        <HiOutlineFunnel className="w-4 h-4 text-slate-500" />

        {/* Department dropdown */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 bg-[#1a2e5a] border border-white/[0.1] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer min-w-[200px]"
          style={{ colorScheme: "dark" }}
        >
          <option value="" className="bg-[#1a2e5a] text-slate-300">
            All Departments
          </option>
          {departments.map((d) => (
            <option
              key={d.id}
              value={d.id}
              className="bg-[#1a2e5a] text-slate-300"
            >
              {d.code} — {d.name}
            </option>
          ))}
        </select>

        {/* Course dropdown — only visible when department is selected */}
        {deptFilter && courses.length > 0 && (
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 bg-[#1a2e5a] border border-[#c8a84e]/40 rounded-xl text-sm font-medium text-[#c8a84e] focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer min-w-[180px]"
            style={{ colorScheme: "dark" }}
          >
            <option value="" className="bg-[#1a2e5a] text-[#c8a84e]">
              All Courses
            </option>
            {courses.map((c) => (
              <option
                key={c.id}
                value={c.id}
                className="bg-[#1a2e5a] text-[#c8a84e]"
              >
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        )}

        {(deptFilter || courseFilter) && (
          <button
            onClick={() => {
              setDeptFilter("");
              setCourseFilter("");
            }}
            className="text-xs text-slate-500 hover:text-[#c8a84e] underline transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active filter indicator */}
      {(selectedDept || selectedCourse) && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedDept && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/15 text-purple-300 text-[11px] font-semibold rounded-full border border-purple-500/20">
              {selectedDept.code}
            </span>
          )}
          {selectedCourse && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#c8a84e]/15 text-[#c8a84e] text-[11px] font-semibold rounded-full border border-[#c8a84e]/20">
              {selectedCourse.code} — {selectedCourse.name}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
          <p className="text-sm text-slate-500">Loading college analytics...</p>
        </div>
      ) : (
        <>
          {/* ═══ STAT CARDS ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Graduates"
              value={gradData?.total_graduates || 0}
              icon={HiOutlineAcademicCap}
              variant="purple"
            />
            {chartData.length > 0 && (
              <StatCard
                title={`Latest Year (${chartData[chartData.length - 1]?.graduation_year})`}
                value={chartData[chartData.length - 1]?.count || 0}
                icon={HiOutlineChartBar}
                variant="emerald"
              />
            )}
            <StatCard
              title={
                courseFilter
                  ? "Filtered Course"
                  : deptFilter
                    ? "Courses in Dept"
                    : "Departments"
              }
              value={
                courseFilter
                  ? selectedCourse?.code || "—"
                  : deptFilter
                    ? courses.length
                    : gradData?.by_department?.length || 0
              }
              icon={HiOutlineBuildingOffice2}
              variant="gold"
            />
          </div>

          {/* ═══ GRADUATE TREND CHART — only when course is selected ═══ */}
          {showChart && (
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-[11px] font-semibold text-[#c8a84e] uppercase tracking-wider mb-1 flex items-center gap-2">
                <HiOutlineChartBar className="w-4 h-4" />
                Graduate trend by year
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {selectedCourse?.code} — {selectedCourse?.name}
              </p>
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
                    dataKey="graduation_year"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(200,168,78,0.06)" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Graduates"
                    fill="#c8a84e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ═══ HINT: Select a course to see trend ═══ */}
          {deptFilter && !courseFilter && chartData.length > 0 && (
            <div className="bg-[#c8a84e]/[0.08] border border-[#c8a84e]/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#c8a84e]/15 flex items-center justify-center mx-auto mb-3">
                <HiOutlineChartBar className="w-6 h-6 text-[#c8a84e]" />
              </div>
              <p className="text-sm font-semibold text-[#c8a84e]">
                Select a specific course to view the graduate trend chart
              </p>
              <p className="text-xs text-[#c8a84e]/70 mt-1">
                Choose from the course dropdown above ({courses.length} courses
                available)
              </p>
            </div>
          )}

          {/* ═══ NO DEPARTMENT SELECTED: Show department breakdown ═══ */}
          {!deptFilter &&
            gradData?.by_department &&
            gradData.by_department.length > 0 && (
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
                  <HiOutlineBuildingOffice2 className="w-4 h-4 text-[#c8a84e]" />
                  <h3 className="text-[11px] font-semibold text-[#c8a84e] uppercase tracking-wider">
                    Graduates by department
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {gradData.by_department.map((d, i) => {
                    const max = Math.max(
                      ...gradData.by_department.map((x) => x.count),
                    );
                    const pct = max > 0 ? (d.count / max) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="cursor-pointer hover:bg-white/[0.04] rounded-xl p-2 -mx-2 transition-colors"
                        onClick={() => setDeptFilter(String(d.id))}
                      >
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-200">
                            <span className="font-mono text-[11px] bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded-lg border border-white/[0.06] mr-2">
                              {d.code}
                            </span>
                            {d.name}
                          </span>
                          <span className="font-bold text-white">
                            {d.count}
                          </span>
                        </div>
                        <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* ═══ DEPARTMENT SELECTED, NO COURSE: Show course breakdown ═══ */}
          {deptFilter && !courseFilter && courses.length > 0 && (
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
                <HiOutlineAcademicCap className="w-4 h-4 text-[#c8a84e]" />
                <h3 className="text-[11px] font-semibold text-[#c8a84e] uppercase tracking-wider">
                  Courses under {selectedDept?.code || "department"}
                </h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#c8a84e]/[0.05] cursor-pointer transition-colors"
                    onClick={() => setCourseFilter(String(c.id))}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {c.code}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.name}</p>
                    </div>
                    <span className="text-xs text-[#c8a84e] font-semibold">
                      View trend →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, variant }) {
  const variantStyles = {
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      iconBg: "bg-purple-500/15",
      iconText: "text-purple-400",
      titleText: "text-purple-400/80",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/15",
      iconText: "text-emerald-400",
      titleText: "text-emerald-400/80",
    },
    gold: {
      bg: "bg-[#c8a84e]/10",
      border: "border-[#c8a84e]/20",
      iconBg: "bg-[#c8a84e]/15",
      iconText: "text-[#c8a84e]",
      titleText: "text-[#c8a84e]/80",
    },
  };
  const style = variantStyles[variant] || variantStyles.gold;

  return (
    <div className={`${style.bg} ${style.border} border rounded-2xl p-5`}>
      <div
        className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center mb-3`}
      >
        <Icon className={`w-5 h-5 ${style.iconText}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p
        className={`text-[10px] ${style.titleText} uppercase tracking-wider font-semibold mt-1.5`}
      >
        {title}
      </p>
    </div>
  );
}
