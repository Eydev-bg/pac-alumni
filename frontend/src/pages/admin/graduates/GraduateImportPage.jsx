import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import {
  HiOutlineArrowUpTray,
  HiOutlineDocumentText,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

const EDUCATION_LEVELS = [
  { value: "elementary", label: "Elementary" },
  { value: "jhs", label: "Junior High School (JHS)" },
  { value: "shs", label: "Senior High School (SHS)" },
  { value: "college", label: "College" },
];

// Import now runs on the server queue; poll the batch until it finishes.
const POLL_INTERVAL_MS = 2000;
const FINAL_STATUSES = ["completed", "failed"];

export default function GraduateImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [educationLevel, setEducationLevel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Stop polling if the user navigates away mid-import.
  useEffect(() => stopPolling, []);

  const startPolling = (batchId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await adminApi.getImportDetail(batchId);
        const batch = res.data.data;
        setResult(batch);
        if (FINAL_STATUSES.includes(batch.status)) {
          stopPolling();
        }
      } catch {
        // Transient polling error — keep trying until a final status arrives.
      }
    }, POLL_INTERVAL_MS);
  };

  const handleFileSelect = (selectedFile) => {
    const allowed = ["xlsx", "xls", "csv"];
    const ext = selectedFile.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError("Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must not exceed 10MB.");
      return;
    }
    setFile(selectedFile);
    setError("");
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !educationLevel) {
      setError("Please select a file and education level.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("education_level", educationLevel);

      const res = await adminApi.importGraduates(formData);
      const batch = res.data.data;
      setResult(batch);

      // The endpoint returns immediately with a queued/processing batch;
      // poll import-detail until it reaches a final status.
      if (!FINAL_STATUSES.includes(batch.status)) {
        startPolling(batch.id);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors;
        setError(Object.values(errs).flat().join(" "));
      } else {
        setError(err.response?.data?.message || "Import failed.");
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    stopPolling();
    setFile(null);
    setEducationLevel("");
    setResult(null);
    setError("");
  };

  const isProcessing = result && !FINAL_STATUSES.includes(result.status);

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Import Graduates</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload an Excel file with the official graduate list
          </p>
        </div>

        {/* Result Card */}
        {result && (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              {isProcessing ? (
                <div className="w-12 h-12 rounded-2xl bg-[#c8a84e]/15 flex items-center justify-center">
                  <svg
                    className="animate-spin h-7 w-7 text-[#c8a84e]"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              ) : result.status === "completed" ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                  <HiOutlineCheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center">
                  <HiOutlineExclamationTriangle className="w-7 h-7 text-red-400" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-white">
                  Import{" "}
                  {isProcessing
                    ? "Processing…"
                    : result.status === "completed"
                      ? "Completed"
                      : "Failed"}
                </h2>
                <p className="text-sm text-slate-400">
                  {isProcessing
                    ? "Your file is being processed. This can take a moment for large files."
                    : result.file_name}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {result.total_records ?? 0}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-semibold">
                  Total Rows
                </p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {result.imported_count ?? 0}
                </p>
                <p className="text-[10px] text-emerald-500 uppercase tracking-wider mt-1 font-semibold">
                  Imported
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {result.duplicate_count ?? 0}
                </p>
                <p className="text-[10px] text-amber-500 uppercase tracking-wider mt-1 font-semibold">
                  Duplicates
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {result.error_count ?? 0}
                </p>
                <p className="text-[10px] text-red-500 uppercase tracking-wider mt-1 font-semibold">
                  Errors
                </p>
              </div>
            </div>

            {/* Error details */}
            {result.error_details && result.error_details.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
                <p className="text-sm font-semibold text-red-400 mb-2">
                  Error Details:
                </p>
                <ul className="text-sm text-red-300/80 space-y-1 max-h-40 overflow-y-auto">
                  {result.error_details.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isProcessing && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-colors"
                >
                  Import Another
                </button>
                <button
                  onClick={() => navigate("/admin/graduates")}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all shadow-lg shadow-[#c8a84e]/20"
                >
                  View Graduates
                </button>
                <button
                  onClick={() => navigate("/admin/graduates/import-history")}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-colors"
                >
                  Import History
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Form */}
        {!result && (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
            {/* Education Level */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#c8a84e] mb-3 uppercase tracking-wider text-[11px]">
                Education Level *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EDUCATION_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setEducationLevel(level.value)}
                    className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${
                      educationLevel === level.value
                        ? "border-[#c8a84e] bg-[#c8a84e]/10 text-[#c8a84e] shadow-lg shadow-[#c8a84e]/10"
                        : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:border-white/[0.15] hover:text-slate-300"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File Drop Zone */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#c8a84e] mb-3 uppercase tracking-wider text-[11px]">
                Graduate List File *
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-[#c8a84e] bg-[#c8a84e]/10"
                    : file
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                      <HiOutlineDocumentText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                    >
                      <HiOutlineXMark className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-[#c8a84e]/10 border border-[#c8a84e]/20 flex items-center justify-center mx-auto mb-4">
                      <HiOutlineArrowUpTray className="w-7 h-7 text-[#c8a84e]" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Supports .xlsx, .xls, .csv (max 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) =>
                  e.target.files[0] && handleFileSelect(e.target.files[0])
                }
                className="hidden"
              />
            </div>

            {/* Required Format Info */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-[#c8a84e] mb-3 uppercase tracking-wider text-[11px]">
                Required Excel Columns:
              </p>
              <div className="text-sm text-slate-400 space-y-1.5">
                <p>
                  •{" "}
                  <span className="font-semibold text-slate-200">
                    first_name
                  </span>{" "}
                  — First name
                </p>
                <p>
                  •{" "}
                  <span className="font-semibold text-slate-200">
                    last_name
                  </span>{" "}
                  — Last name
                </p>
                <p>
                  •{" "}
                  <span className="font-semibold text-slate-200">
                    graduation_year
                  </span>{" "}
                  — Year graduated
                </p>
                <p>
                  •{" "}
                  <span className="font-semibold text-slate-200">
                    middle_name
                  </span>{" "}
                  — Middle name (optional)
                </p>
                <p>
                  • <span className="font-semibold text-slate-200">suffix</span>{" "}
                  — Jr, Sr, III (optional)
                </p>
                {educationLevel === "college" && (
                  <>
                    <p>
                      •{" "}
                      <span className="font-semibold text-[#c8a84e]">
                        course_code
                      </span>{" "}
                      — Course code e.g., BSIT, BSCS, BSN (required for college)
                    </p>
                    <p>
                      •{" "}
                      <span className="font-semibold text-emerald-400">
                        alumni_id
                      </span>{" "}
                      — Existing Alumni ID (optional — leave blank to
                      auto-generate)
                    </p>
                  </>
                )}
              </div>

              {educationLevel === "college" && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-lg">
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    Alumni ID Auto-Generation
                  </p>
                  <p className="text-xs text-emerald-300/80 leading-relaxed">
                    If the <span className="font-semibold">alumni_id</span>{" "}
                    column is filled, the system will use the existing ID (for
                    old graduates). If left blank, the system will automatically
                    generate an Alumni ID in the format{" "}
                    <span className="font-mono font-semibold">
                      PAC-[YEAR]-[0001]
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || !educationLevel || uploading}
              className="w-full py-3 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#c8a84e]/20"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Importing...
                </span>
              ) : (
                "Upload & Import"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
