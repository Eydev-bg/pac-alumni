// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/sections/BoardExamSection.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import alumniApi from "../../../../api/alumniApi";
import { useToast } from "../../../../hooks/useToast";
import { storageUrl, formatDateOnly } from "../../../../utils/formatters";
import StatusBadge from "../../../../components/common/StatusBadge";
import SkeletonCard from "../../../../components/common/SkeletonCard";
import {
  AlumniCard,
  IconChip,
  SectionHeader,
  Badge,
  Select,
} from "../../../../components/alumni/ui";
import {
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentCheck,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineBellAlert,
  HiOutlineClock,
  HiOutlineDocumentArrowUp,
  HiOutlinePaperClip,
  HiOutlineDocumentText,
  HiOutlineTrophy,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import { fieldLabel, btnPrimary, btnGhost } from "../styles";

// ═══════════════════════════════════════════════════════════
//  D) BOARD EXAM — reuses GET /board-exam + POST /board-exam
//  Statuses stay not_taken / passed / not_applicable. The alumni only ever
//  SUBMITS "passed"; "Not Yet Taken" is system-derived. No failed/conditional.
// ═══════════════════════════════════════════════════════════

export default function BoardExamSection({ onSaved }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [naProgram, setNaProgram] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "", exam_year: "" });
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await alumniApi.getBoardExamData();
      setData(res.data.data);
    } catch (err) {
      // 403 = course isn't a board program (shouldn't happen given the gate,
      // but handle it so the section self-hides instead of erroring).
      if (err.response?.status === 403) setNaProgram(true);
    } finally {
      setLoading(false);
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
      toast.error("Only JPEG, PNG, or PDF files are accepted.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must not exceed 5MB.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await alumniApi.submitBoardExam(formData, proofFile);
      await load();
      onSaved?.();
      setShowForm(false);
      setFormData({ status: "", exam_year: "" });
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(
        "Board exam result submitted successfully! The Admin team has been notified.",
      );
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Failed to submit.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (naProgram) return null;

  const course = data?.course;
  const current = data?.current_status;
  const records = data?.records ?? [];
  const hasRecords = records.length > 0;
  const isPassed = current?.board_status === "passed";

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear + 1; y >= 1990; y--) yearOptions.push(y);

  return (
    <AlumniCard id="section-board-exam" className="scroll-mt-20">
      <SectionHeader
        title="Board Exam Information"
        action={
          !loading && current ? (
            <StatusBadge
              status={current.board_status}
              label={current.board_label}
            />
          ) : null
        }
      />

      {loading ? (
        <SkeletonCard variant="form" count={1} />
      ) : (
        <>
          {course?.name && (
            <p className="text-[0.72rem] text-slate-400 -mt-2 mb-4">
              {course.board_exam_name || "Board Examination"} · {course.name}
            </p>
          )}

          {isPassed && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-4 mb-4">
              <div className="flex items-start gap-3">
                <IconChip icon={HiOutlineTrophy} color="green" />
                <div>
                  <h4 className="text-[0.85rem] font-bold text-emerald-800">
                    Congratulations, Licensed Professional!
                  </h4>
                  <p className="text-[0.75rem] text-emerald-600 mt-0.5 leading-relaxed">
                    You have passed the{" "}
                    {course?.board_exam_name || "board exam"}. Your achievement
                    is recorded. You may still submit additional records if
                    applicable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[0.75rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              <HiOutlineClipboardDocumentCheck className="w-4 h-4" />
              {hasRecords
                ? "Submit Another Result"
                : "Record Board Exam Result"}
            </button>
          )}

          {!showForm && !hasRecords && (
            <p className="text-[0.75rem] text-slate-400 mt-3">
              No board exam records yet. Use the button above to record your{" "}
              {course?.board_exam_name || "board exam"} result.
            </p>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Result — the alumni can only submit "passed". */}
              <div>
                <label className="block text-[0.72rem] font-semibold text-slate-600 mb-2">
                  Exam Result <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: "passed" })}
                  className={`relative flex items-center gap-3 p-4 w-full rounded-xl border-2 transition-all ${
                    formData.status === "passed"
                      ? "border-emerald-400 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.status === "passed" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                  >
                    <HiOutlineCheckCircle className="w-5 h-5" />
                  </span>
                  <span className="text-left">
                    <span
                      className={`block text-sm font-bold ${formData.status === "passed" ? "text-emerald-800" : "text-slate-700"}`}
                    >
                      Passed
                    </span>
                    <span className="block text-[0.68rem] text-slate-400">
                      I passed the exam
                    </span>
                  </span>
                </button>
                {fieldErrors.status && (
                  <p className="text-[0.68rem] text-red-500 mt-1">
                    {fieldErrors.status[0]}
                  </p>
                )}
              </div>

              {/* Exam Year */}
              <div>
                <label htmlFor="board-year" className={fieldLabel}>
                  Exam Year <span className="text-red-400">*</span>
                </label>
                <Select
                  id="board-year"
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
                  <p className="text-[0.68rem] text-red-500 mt-1">
                    {fieldErrors.exam_year[0]}
                  </p>
                )}
              </div>

              {/* Proof (optional) */}
              <div>
                <label htmlFor="board-proof" className={fieldLabel}>
                  Proof Document{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {!proofFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400/50 hover:bg-blue-50/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-2 transition-colors">
                      <HiOutlineDocumentArrowUp className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <p className="text-[0.78rem] font-medium text-slate-600">
                      Click to upload proof
                    </p>
                    <p className="text-[0.68rem] text-slate-400 mt-0.5">
                      JPEG, PNG, or PDF — Max 5MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <IconChip
                      icon={HiOutlinePaperClip}
                      color="blue"
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.78rem] font-medium text-slate-700 truncate">
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
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
                <input
                  id="board-proof"
                  ref={fileInputRef}
                  type="file"
                  accept=".jpeg,.jpg,.png,.pdf"
                  className="hidden"
                  aria-label="Upload proof document"
                  onChange={handleFileSelect}
                />
                {fieldErrors.proof_file && (
                  <p className="text-[0.68rem] text-red-500 mt-1">
                    {fieldErrors.proof_file[0]}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <div className="flex items-start gap-2.5">
                  <HiOutlineBellAlert className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[0.72rem] text-blue-700 leading-relaxed">
                    Upon submission, the{" "}
                    <span className="font-semibold">Admin</span> team will be
                    automatically notified about your board exam result.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={
                    submitting || !formData.status || !formData.exam_year
                  }
                  className={btnPrimary}
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
                  className={btnGhost}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* History */}
          {hasRecords && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[0.72rem] font-semibold text-slate-500 mb-2">
                Exam History ({records.length})
              </p>
              <div className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <div key={rec.id} className="py-3 flex items-start gap-3">
                    <IconChip
                      icon={
                        rec.status === "passed"
                          ? HiOutlineTrophy
                          : HiOutlineDocumentText
                      }
                      color={rec.status === "passed" ? "green" : "slate"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-[0.82rem] font-bold text-slate-800">
                          {rec.exam_name}
                        </h5>
                        <StatusBadge
                          status={rec.status}
                          label={rec.status_label}
                        />
                        {rec.is_current && (
                          <Badge color="purple">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap text-[0.7rem] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                          Exam Year: {rec.exam_year}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineClock className="w-3.5 h-3.5" />
                          Submitted: {formatDateOnly(rec.created_at)}
                        </span>
                        {rec.verified_at && (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      {rec.proof_file && (
                        <a
                          href={storageUrl(rec.proof_file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1.5 text-[0.72rem] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <HiOutlinePaperClip className="w-3.5 h-3.5" />
                          View Proof Document
                          <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AlumniCard>
  );
}
