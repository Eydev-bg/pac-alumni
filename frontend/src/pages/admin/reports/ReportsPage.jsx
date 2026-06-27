// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/reports/ReportsPage.jsx
//  Features 40-46: All report exports
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import adminApi from "../../../api/adminApi";
import {
  HiOutlineArrowDownTray,
  HiOutlineDocumentChartBar,
} from "react-icons/hi2";

const reports = [
  // {
  //   key: "continuation",
  //   title: "Continuation Report",
  //   desc: "Elem → JHS → SHS → College continuation rates",
  //   feature: "40",
  //   fetchFn: (p) => adminApi.getReportContinuation(p),
  // },
  {
    key: "board",
    title: "Board Passing Report",
    desc: "Board exam results per department per year",
    
    fetchFn: (p) => adminApi.getReportBoardPassing(p),
  },
  {
    key: "employment",
    title: "Employment Report",
    desc: "Employment status of graduates",
    
    fetchFn: (p) => adminApi.getReportEmployment(p),
  },
  {
    key: "dept-summary",
    title: "Department Summary",
    desc: "Per-department overview with key metrics",
    
    fetchFn: () => adminApi.getReportDeptSummary(),
  },
  {
    key: "alumni-list",
    title: "Alumni Master List",
    desc: "Complete list of all college alumni",
    
    fetchFn: (p) => adminApi.getReportAlumniMasterList(p),
  },
  {
    key: "verification",
    title: "Verification Logs",
    desc: "All registration verification attempts",
    
    fetchFn: () => adminApi.getReportVerificationLogs(),
  },
  {
    key: "alumni-ids",
    title: "Alumni ID List",
    desc: "All generated Alumni IDs",
    
    fetchFn: () => adminApi.getReportAlumniIdList(),
  },
];

export default function ReportsPage() {
  const [loadingKey, setLoadingKey] = useState(null);

  const handleExport = async (report) => {
    setLoadingKey(report.key);
    try {
      const res = await report.fetchFn({});
      const data = res.data.data;

      // Convert to CSV
      if (!data || data.length === 0) {
        alert("No data to export.");
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((h) => {
              const val = row[h] ?? "";
              return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(","),
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.key}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate report.");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Reports & Export</h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate and download institutional reports
          </p>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report.key}
              className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5 flex flex-col hover:bg-[#1a2e5a]/55 transition-all duration-300"
            >
              <div className="flex items-start gap-3 mb-4 flex-1">
                <div className="w-11 h-11 rounded-xl bg-[#c8a84e]/15 text-[#c8a84e] flex items-center justify-center flex-shrink-0">
                  <HiOutlineDocumentChartBar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    {report.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{report.desc}</p>
                  <span className="text-[10px] text-slate-600 mt-1 inline-block">
                    {report.feature}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleExport(report)}
                disabled={loadingKey === report.key}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#c8a84e] bg-[#c8a84e]/10 border border-[#c8a84e]/20 rounded-xl hover:bg-[#c8a84e]/20 transition-colors disabled:opacity-50"
              >
                <HiOutlineArrowDownTray className="w-4 h-4" />
                {loadingKey === report.key ? "Generating..." : "Download CSV"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
