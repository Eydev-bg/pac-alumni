// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/analytics/ReportExportModal.jsx
//  Generic report export modal with filters (department, course,
//  batch year) and format selector (Excel/CSV/PDF). The report to
//  export is chosen by the caller via `reportTitle` + `exportFn`.
//  Triggers blob download.
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import Modal from "../../../ui/Modal";
import Select from "../../../ui/Select";
import Button from "../../../ui/Button";
import Alert from "../../../ui/Alert";
import { cn } from "../../../utils/formatters";
import { HiOutlineArrowDownTray } from "react-icons/hi2";

const FORMATS = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV (.csv)" },
  { value: "pdf", label: "PDF (.pdf)" },
];

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
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      title={reportTitle}
      loading={loading}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={() => onClose()} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={HiOutlineArrowDownTray}
            onClick={handleExport}
            loading={loading}
          >
            {loading ? "Generating..." : `Export ${format.toUpperCase()}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Format selector */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  format === f.value
                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/40 dark:bg-gold-500/20 dark:text-gold-500 dark:border-gold-500/40"
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 dark:bg-white/[0.04] dark:text-slate-400 dark:border-white/[0.06] dark:hover:bg-white/[0.08]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Select
          tone="dark"
          label="Department"
          value={deptId}
          onChange={(e) => {
            setDeptId(e.target.value);
            setCourseId("");
          }}
          placeholder="All Departments"
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />

        <Select
          tone="dark"
          label="Course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={!deptId}
          placeholder={deptId ? "All Courses" : "Select Department first"}
          options={filteredCourses.map((c) => ({ value: c.id, label: c.name }))}
        />

        <Select
          tone="dark"
          label="Batch Year"
          value={batchYear}
          onChange={(e) => setBatchYear(e.target.value)}
          placeholder="All Years"
          options={years.map((y) => ({ value: y, label: `Batch ${y}` }))}
        />

        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
