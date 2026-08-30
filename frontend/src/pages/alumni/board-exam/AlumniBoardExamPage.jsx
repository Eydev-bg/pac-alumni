// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/board-exam/AlumniBoardExamPage.jsx
//  Board Exam Module — Features 9-12
//  Mark board status, enter exam year, upload proof,
//  auto-trigger notifications to Admin.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import alumniApi from "../../../api/alumniApi";
import { storageUrl, formatDateOnly } from "../../../utils/formatters";
import StatusBadge from "../../../components/common/StatusBadge";
import SkeletonCard from "../../../components/common/SkeletonCard";
import EmptyState from "../../../components/common/EmptyState";
import { Select } from "../../../components/alumni/ui";
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineDocumentArrowUp,
  HiOutlineAcademicCap,
  HiOutlineTrophy,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineBellAlert,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlinePaperClip,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";

// ─── Toast ───────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const cfg = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300",
      Icon: HiOutlineCheckCircle,
    },
    error: {
      bg: "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-300",
      Icon: HiOutlineExclamationTriangle,
    },
  };
  const { bg, Icon } = cfg[type] || cfg.success;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg dark:shadow-slate-900/50 max-w-sm ${bg}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="hover:opacity-70">
          <HiOutlineXMark className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AlumniBoardExamPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "", exam_year: "" });
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  // ─── Load data ──────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await alumniApi.getBoardExamData();
      setData(res.data.data);
    } catch (err) {
      const code = err.response?.status;
      if (code === 403) {
        setError("not_board_program");
      } else {
        setError(
          err.response?.data?.message || "Failed to load board exam data.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit board exam ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await alumniApi.submitBoardExam(formData, proofFile);
      await loadData();
      setShowForm(false);
      setFormData({ status: "", exam_year: "" });
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast(
        "Board exam result submitted successfully! The Admin team has been notified.",
      );
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        showToast(err.response?.data?.message || "Failed to submit.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      showToast("Only JPEG, PNG, or PDF files are accepted.", "error");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("File must not exceed 5MB.", "error");
      e.target.value = "";
      return;
    }
    setProofFile(file);
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({ status: "", exam_year: "" });
    setProofFile(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm dark:shadow-none p-8">
          <SkeletonCard variant="form" count={1} />
        </div>
      </div>
    );
  }

  // ─── Not a board program ────────────────────────────────
  if (error === "not_board_program") {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={HiOutlineClipboardDocumentCheck}
          title="Not Applicable"
          message="Your course does not require a board exam. This module is only available for alumni from board exam programs such as Nursing, Engineering, and other licensure-required courses."
        />
      </div>
    );
  }

  // ─── Generic error ──────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-3">
            <HiOutlineExclamationTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {error}
          </p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1a2e5a] rounded-lg hover:bg-[#243a6e] transition-colors"
          >
            <HiOutlineArrowPath className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { course, current_status, records } = data;
  const hasRecords = records.length > 0;
  const isPassed = current_status.board_status === "passed";

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear + 1; y >= 1990; y--) yearOptions.push(y);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ━━━━ Header ━━━━ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e5a] via-[#243a6e] to-[#1e3466] rounded-2xl shadow-lg">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-[#c8a84e]/[0.06]" />

        <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
              <HiOutlineClipboardDocumentCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[0.72rem] text-[#c8a84e] font-semibold tracking-wider uppercase mb-1">
                Board Exam Module
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {course.board_exam_name || "Board Examination"}
              </h1>
              <p className="text-sm text-white/60 mt-1">{course.name}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[0.68rem] text-white/40 font-medium mb-1">
                Current Status
              </p>
              <StatusBadge
                status={current_status.board_status}
                label={current_status.board_label}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━ Passed Congrats Banner ━━━━ */}
      {isPassed && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl border border-emerald-200/60 dark:border-emerald-500/25 p-5 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <HiOutlineTrophy className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="text-[0.85rem] font-bold text-emerald-800 dark:text-emerald-300">
                Congratulations, Licensed Professional!
              </h3>
              <p className="text-[0.75rem] text-emerald-600 dark:text-emerald-300 mt-1 leading-relaxed">
                You have passed the {course.board_exam_name || "board exam"}.
                Your achievement has been recorded in the system. You may still
                submit additional exam records if applicable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━ Submit New Record ━━━━ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#1a2e5a]/[0.07] dark:bg-[#1a2e5a]/[0.15] flex items-center justify-center">
              <HiOutlineDocumentArrowUp className="w-[18px] h-[18px] text-[#1a2e5a] dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-[0.82rem] font-bold text-slate-800 dark:text-slate-100">
                Submit Board Exam Result
              </h3>
              <p className="text-[0.7rem] text-slate-400 mt-0.5">
                Record your licensure examination result
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2 text-[0.75rem] font-semibold text-white bg-[#1a2e5a] hover:bg-[#243a6e] rounded-xl transition-colors shadow-sm"
            >
              <HiOutlineClipboardDocumentCheck className="w-4 h-4" />
              {hasRecords ? "Submit Another" : "Submit Result"}
            </button>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5">
            {/* Status Selection */}
            <div>
              <label className="block text-[0.72rem] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Exam Result <span className="text-red-400">*</span>
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: "passed" })}
                  className={`relative flex min-w-0 items-center gap-3 p-4 w-full rounded-xl border-2 transition-all duration-200 ${
                    formData.status === "passed"
                      ? "border-emerald-400 bg-emerald-50 shadow-sm dark:shadow-none dark:border-emerald-500 dark:bg-emerald-500/15"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      formData.status === "passed"
                        ? "bg-emerald-100 dark:bg-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-700"
                    }`}
                  >
                    <HiOutlineCheckCircle
                      className={`w-5 h-5 ${
                        formData.status === "passed"
                          ? "text-emerald-600 dark:text-emerald-300"
                          : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-bold ${formData.status === "passed" ? "text-emerald-800 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}
                    >
                      Passed
                    </p>
                    <p
                      className={`text-[0.68rem] ${formData.status === "passed" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400"}`}
                    >
                      I passed the exam
                    </p>
                  </div>
                  {formData.status === "passed" && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
              {fieldErrors.status && (
                <p className="text-[0.68rem] text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.status[0]}
                </p>
              )}
            </div>

            {/* Exam Year */}
            <div>
              <label
                htmlFor="board-exam-year"
                className="block text-[0.72rem] font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Exam Year <span className="text-red-400">*</span>
              </label>
              <Select
                id="board-exam-year"
                value={formData.exam_year}
                onChange={(v) => setFormData({ ...formData, exam_year: v })}
                options={yearOptions.map((y) => ({
                  value: String(y),
                  label: String(y),
                }))}
                placeholder="Select exam year"
                error={!!fieldErrors.exam_year}
                leftIcon={HiOutlineCalendarDays}
              />
              {fieldErrors.exam_year && (
                <p className="text-[0.68rem] text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.exam_year[0]}
                </p>
              )}
            </div>

            {/* Proof Upload (Optional) */}
            <div>
              <label
                htmlFor="board-exam-proof"
                className="block text-[0.72rem] font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Proof Document{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              {!proofFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-[#1a2e5a]/30 hover:bg-[#1a2e5a]/[0.02] dark:hover:bg-[#1a2e5a]/[0.08] transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-[#1a2e5a]/10 dark:group-hover:bg-[#1a2e5a]/20 flex items-center justify-center mx-auto mb-2 transition-colors">
                    <HiOutlineDocumentArrowUp className="w-5 h-5 text-slate-400 group-hover:text-[#1a2e5a] dark:group-hover:text-blue-400" />
                  </div>
                  <p className="text-[0.78rem] font-medium text-slate-600 dark:text-slate-300">
                    Click to upload proof
                  </p>
                  <p className="text-[0.68rem] text-slate-400 mt-0.5">
                    JPEG, PNG, or PDF — Max 5MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-9 h-9 rounded-lg bg-[#1a2e5a]/10 dark:bg-[#1a2e5a]/20 flex items-center justify-center flex-shrink-0">
                    <HiOutlinePaperClip className="w-4 h-4 text-[#1a2e5a] dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.78rem] font-medium text-slate-700 dark:text-slate-200 break-all">
                      {proofFile.name}
                    </p>
                    <p className="text-[0.65rem] text-slate-400">
                      {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProofFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="w-8 h-8 flex-shrink-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/15 flex items-center justify-center transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )}
              <input
                id="board-exam-proof"
                ref={fileInputRef}
                type="file"
                accept=".jpeg,.jpg,.png,.pdf"
                className="hidden"
                aria-label="Upload proof document"
                onChange={handleFileSelect}
              />
              {fieldErrors.proof_file && (
                <p className="text-[0.68rem] text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.proof_file[0]}
                </p>
              )}
            </div>

            {/* Notification info */}
            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl px-4 py-3 border border-blue-100 dark:border-blue-500/25">
              <div className="flex items-start gap-2.5">
                <HiOutlineBellAlert className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-[0.72rem] text-blue-700 dark:text-blue-300 leading-relaxed">
                  Upon submission, the{" "}
                  <span className="font-semibold">Admin</span> team will be
                  automatically notified about your board exam result.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting || !formData.status || !formData.exam_year}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 text-[0.78rem] font-semibold text-white bg-[#1a2e5a] hover:bg-[#243a6e] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    Submit Result
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                disabled={submitting}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 text-[0.78rem] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : !hasRecords ? (
          <div className="px-5 sm:px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
              <HiOutlineClock className="w-7 h-7 text-amber-500 dark:text-amber-300" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              No Records Yet
            </h4>
            <p className="text-[0.75rem] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You haven't submitted any board exam results yet. Click the button
              above to record your {course.board_exam_name || "board exam"}{" "}
              result.
            </p>
          </div>
        ) : null}
      </div>

      {/* ━━━━ Exam History ━━━━ */}
      {hasRecords && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a2e5a]/[0.07] dark:bg-[#1a2e5a]/[0.15] flex items-center justify-center">
                <HiOutlineDocumentText className="w-[18px] h-[18px] text-[#1a2e5a] dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-[0.82rem] font-bold text-slate-800 dark:text-slate-100">
                  Exam History
                </h3>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">
                  {records.length} record{records.length > 1 ? "s" : ""} on file
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="px-5 sm:px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      rec.status === "passed"
                        ? "bg-emerald-50 dark:bg-emerald-500/15"
                        : "bg-slate-50 dark:bg-slate-700"
                    }`}
                  >
                    {rec.status === "passed" ? (
                      <HiOutlineTrophy className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <HiOutlineXCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="min-w-0 text-[0.82rem] font-bold text-slate-800 dark:text-slate-100 break-words">
                        {rec.exam_name}
                      </h4>
                      <StatusBadge
                        status={rec.status}
                        label={rec.status_label}
                      />
                      {rec.is_current && (
                        <span className="inline-flex items-center rounded-full bg-[#c8a84e]/15 dark:bg-[#c8a84e]/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-[#8a6d1f] dark:text-[#c8a84e]">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-1.5 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[0.7rem] text-slate-500 dark:text-slate-400">
                        <HiOutlineCalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                        Exam Year: {rec.exam_year}
                      </span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[0.7rem] text-slate-500 dark:text-slate-400">
                        <HiOutlineClock className="w-3.5 h-3.5 flex-shrink-0" />
                        Submitted: {formatDateOnly(rec.created_at)}
                      </span>
                      {rec.verified_at && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[0.7rem] text-emerald-600 dark:text-emerald-300">
                          <HiOutlineShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          Verified
                        </span>
                      )}
                    </div>
                    {rec.proof_file && (
                      <a
                        href={storageUrl(rec.proof_file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-[0.72rem] font-medium text-[#1a2e5a] dark:text-blue-400 hover:text-[#2a4a8a] dark:hover:text-blue-300 transition-colors"
                      >
                        <HiOutlinePaperClip className="w-3.5 h-3.5 flex-shrink-0" />
                        View Proof Document
                        <HiOutlineArrowTopRightOnSquare className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━━ Info Note ━━━━ */}
      <div className="bg-gradient-to-r from-[#1a2e5a]/[0.03] to-[#c8a84e]/[0.04] dark:from-[#1a2e5a]/[0.15] dark:to-[#c8a84e]/[0.08] rounded-2xl border border-slate-200/60 dark:border-slate-700 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c8a84e]/10 dark:bg-[#c8a84e]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <HiOutlineAcademicCap className="w-[18px] h-[18px] text-[#c8a84e]" />
          </div>
          <div>
            <h4 className="text-[0.78rem] font-bold text-slate-800 dark:text-slate-100">
              About Board Exam Records
            </h4>
            <p className="text-[0.72rem] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Your board exam results are shared with the Admin for
              institutional tracking. Uploading proof documents (certificate,
              rating sheet) is optional but recommended for faster verification.
              You may submit multiple records if you have taken the exam more
              than once.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
