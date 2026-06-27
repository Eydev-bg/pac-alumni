// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/analytics/AnalyticsDashboardPage.jsx
//  FIXED: Export modal rendered outside overflow-hidden container
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import adminApi from "../../../api/adminApi";
import LevelAnalyticsTab from "./LevelAnalyticsTab";
import GraduateTracerTab from "./GraduateTracerTab";
import TracerExportModal from "./TracerExportModal";

const TABS = [
  { key: "tracer", label: "Graduate Tracer" },
  { key: "elementary", label: "Elementary" },
  { key: "jhs", label: "JHS" },
  { key: "shs", label: "SHS" },
];

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState("tracer");

  // ─── Export modal state (lifted from GraduateTracerTab) ──
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDefaults, setExportDefaults] = useState({
    courseId: "",
    batchYear: "",
    departmentId: "",
    departments: [],
    courses: [],
    years: [],
  });

  // Called by GraduateTracerTab to open the modal with current filters
  const handleOpenExport = (defaults) => {
    setExportDefaults(defaults);
    setExportOpen(true);
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Graduate tracer analytics and institutional data
          </p>
        </div>

        {/* Tabs Container */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "text-[#c8a84e]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full bg-[#c8a84e] shadow-[0_0_8px_rgba(200,168,78,0.4)]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "tracer" && (
              <GraduateTracerTab onOpenExport={handleOpenExport} />
            )}
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
        </div>
      </div>

      {/* ═══ EXPORT MODAL — rendered OUTSIDE the overflow-hidden container ═══ */}
      <TracerExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        departments={exportDefaults.departments}
        courses={exportDefaults.courses}
        years={exportDefaults.years}
        defaultCourseId={exportDefaults.courseId}
        defaultBatchYear={exportDefaults.batchYear}
        defaultDepartmentId={exportDefaults.departmentId}
      />
    </div>
  );
}
