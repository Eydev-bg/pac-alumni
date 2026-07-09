// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/analytics/AnalyticsDashboardPage.jsx
//  Consolidated report exports live in the header "Export Report"
//  dropdown → ReportExportModal (rendered outside overflow-hidden).
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import adminApi from "../../../api/adminApi";
import LevelAnalyticsTab from "./LevelAnalyticsTab";
import GraduateTracerTab from "./GraduateTracerTab";
import ReportExportModal from "./ReportExportModal";
import { useToast } from "../../../hooks/useToast";
import Card from "../../../ui/Card";
import { HiOutlineChevronDown, HiOutlineArrowDownTray } from "react-icons/hi2";

const TABS = [
  { key: "tracer", label: "Graduate Tracer" },
  { key: "elementary", label: "Elementary" },
  { key: "jhs", label: "JHS" },
  { key: "shs", label: "SHS" },
];

const REPORTS = [
  {
    key: "board",
    title: "Board Passing Report",
    exportFn: adminApi.exportBoardPassingReport,
  },
  {
    key: "employment",
    title: "Employment Report",
    exportFn: adminApi.exportEmploymentReport,
  },
  {
    key: "alumni-ids",
    title: "Alumni ID List",
    exportFn: adminApi.exportAlumniIdListReport,
  },
];

export default function AnalyticsDashboardPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("tracer");

  // ─── Export dropdown + modal state ───────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null); // { title, exportFn }
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const dropdownRef = useRef(null);

  // Load dropdown data once, for the modal filters
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
        // Keep only courses that belong to a college department so elem/JHS/SHS
        // courses can never appear in any export dropdown.
        const collegeDeptIds = new Set(collegeDepts.map((d) => d.id));
        const collegeCourses = (courseRes.data.data || []).filter((c) =>
          collegeDeptIds.has(c.department_id),
        );
        setDepartments(collegeDepts);
        setCourses(collegeCourses);
        setYears(yearRes.data.data || []);
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.message || "Failed to load export filters.",
        );
      });
  }, [toast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectReport = (report) => {
    // Default: all college departments + college courses.
    let filteredDepts = departments;
    let filteredCourses = courses;

    // Board Passing Report is limited to board-program courses and the
    // departments that offer at least one.
    if (report.key === "board") {
      filteredCourses = courses.filter((c) => c.is_board_program);
      const boardDeptIds = new Set(filteredCourses.map((c) => c.department_id));
      filteredDepts = departments.filter((d) => boardDeptIds.has(d.id));
    }

    setActiveReport({
      ...report,
      departments: filteredDepts,
      courses: filteredCourses,
    });
    setDropdownOpen(false);
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Graduate tracer analytics and institutional data
            </p>
          </div>

          {/* Export Report dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gold-500 bg-gold-500/10 border border-gold-500/20 rounded-xl hover:bg-gold-500/20 transition-colors"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              Export Report
              <HiOutlineChevronDown
                className={`w-4 h-4 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-40">
                {REPORTS.map((report) => (
                  <button
                    key={report.key}
                    onClick={() => handleSelectReport(report)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:bg-gold-500/10 hover:text-gold-500 transition-colors"
                  >
                    {report.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs Container */}
        <Card padding={false} className="mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "text-gold-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full bg-gold-500 shadow-[0_0_8px_rgba(200,168,78,0.4)]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "tracer" && <GraduateTracerTab />}
            {activeTab === "elementary" && (
              <LevelAnalyticsTab
                level="elementary"
                label="Elementary"
                fetchFn={adminApi.getElementaryAnalytics}
              />
            )}
            {activeTab === "jhs" && (
              <LevelAnalyticsTab
                level="jhs"
                label="JHS"
                fetchFn={adminApi.getJhsAnalytics}
              />
            )}
            {activeTab === "shs" && (
              <LevelAnalyticsTab
                level="shs"
                label="SHS"
                fetchFn={adminApi.getShsAnalytics}
              />
            )}
          </div>
        </Card>
      </div>

      {/* ═══ EXPORT MODAL — rendered OUTSIDE the overflow-hidden container ═══ */}
      <ReportExportModal
        isOpen={!!activeReport}
        onClose={() => setActiveReport(null)}
        reportTitle={activeReport?.title || ""}
        exportFn={activeReport?.exportFn}
        departments={activeReport?.departments || []}
        courses={activeReport?.courses || []}
        years={years}
      />
    </>
  );
}
