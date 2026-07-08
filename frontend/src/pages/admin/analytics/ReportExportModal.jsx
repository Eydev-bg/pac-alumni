// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/analytics/ReportExportModal.jsx
//  Generic report export modal with filters (department, course,
//  batch year) and format selector (Excel/CSV/PDF). The report to
//  export is chosen by the caller via `reportTitle` + `exportFn`.
//  Triggers blob download.
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineDocumentChartBar,
} from "react-icons/hi2";

const selectClass =
  "w-full px-3 py-2.5 bg-[#1a2e5a] border border-white/[0.1] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer";
const optionClass = "bg-[#1a2e5a] text-slate-300";

export default function ReportExportModal({
  isOpen,
  onClose,
  reportTitle,
  exportFn,
  departments,
  courses,
  years,
}) {
  const [format, setFormat] = useState("xlsx");
  const [deptId, setDeptId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const filteredCourses = deptId
    ? courses.filter((c) => String(c.department_id) === String(deptId))
    : [];

  const handleExport = async () => {
    if (!exportFn) return;

    setLoading(true);
    setError("");

    try {
      const params = { format };
      if (deptId) params.department_id = deptId;
      if (courseId) params.course_id = courseId;
      if (batchYear) params.batch_year = batchYear;

      const res = await exportFn(params);

      // Create blob download
      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition or build one
      const disposition = res.headers["content-disposition"];
      const fallbackName = `${(reportTitle || "report")
        .toLowerCase()
        .replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.${format}`;
      let filename = fallbackName;
      if (disposition) {
        const match = disposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (match?.[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      }

      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError(
        err.response?.status === 422
          ? "Invalid filter combination. Please check your selections."
          : "Failed to generate export. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0f172a] border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c8a84e]/15 flex items-center justify-center">
              <HiOutlineDocumentChartBar className="w-5 h-5 text-[#c8a84e]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white">
                {reportTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure filters and download
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Format selector */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "xlsx", label: "Excel (.xlsx)" },
                { value: "csv", label: "CSV (.csv)" },
                { value: "pdf", label: "PDF (.pdf)" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    format === f.value
                      ? "bg-[#c8a84e]/20 text-[#c8a84e] border border-[#c8a84e]/40"
                      : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={deptId}
              onChange={(e) => {
                setDeptId(e.target.value);
                setCourseId("");
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
          </div>

          {/* Course filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={`${selectClass} ${!deptId ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ colorScheme: "dark" }}
              disabled={!deptId}
            >
              <option value="" className={optionClass}>
                {deptId ? "All Courses" : "Select Department first"}
              </option>
              {filteredCourses.map((c) => (
                <option key={c.id} value={c.id} className={optionClass}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Year filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              Batch Year
            </label>
            <select
              value={batchYear}
              onChange={(e) => setBatchYear(e.target.value)}
              className={selectClass}
              style={{ colorScheme: "dark" }}
            >
              <option value="" className={optionClass}>
                All Years
              </option>
              {years.map((y) => (
                <option key={y} value={y} className={optionClass}>
                  Batch {y}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-400 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#c8a84e] bg-[#c8a84e]/10 border border-[#c8a84e]/20 rounded-xl hover:bg-[#c8a84e]/20 transition-colors disabled:opacity-50"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
            {loading ? "Generating..." : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
