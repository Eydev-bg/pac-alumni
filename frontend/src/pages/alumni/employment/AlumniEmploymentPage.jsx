// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/employment/AlumniEmploymentPage.jsx
//  Employment Module — Features 13-18
//  Update employment status, company, job title, industry,
//  employment type. Auto-triggers notifications.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import alumniApi from "../../../api/alumniApi";
import { formatDateOnly } from "../../../utils/formatters";
import {
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlineGlobeAlt,
  HiOutlineUserCircle,
  HiOutlineBellAlert,
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineXCircle,
} from "react-icons/hi2";

// ─── Toast ───────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const cfg = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      Icon: HiOutlineCheckCircle,
    },
    error: {
      bg: "bg-red-50 border-red-200 text-red-800",
      Icon: HiOutlineExclamationTriangle,
    },
  };
  const { bg, Icon } = cfg[type] || cfg.success;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${bg}`}
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

// ─── Employment Type Icons ───────────────────────────────
const typeConfig = {
  local: { icon: HiOutlineMapPin, label: "Local", color: "blue" },
  international: {
    icon: HiOutlineGlobeAlt,
    label: "International",
    color: "purple",
  },
  self_employed: {
    icon: HiOutlineUserCircle,
    label: "Self-employed",
    color: "amber",
  },
};

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AlumniEmploymentPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employment_status: "",
    company_name: "",
    job_title: "",
    industry: "",
    employment_type: "",
    start_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await alumniApi.getEmploymentData();
      setData(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load employment data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload =
        formData.employment_status === "unemployed"
          ? { employment_status: "unemployed" }
          : { ...formData };

      await alumniApi.submitEmployment(payload);
      await loadData();
      setShowForm(false);
      resetForm();
      showToast(
        formData.employment_status === "employed"
          ? "Employment updated! The Admin team has been notified."
          : "Status updated to Unemployed. The Admin team has been notified.",
      );
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        showToast(err.response?.data?.message || "Failed to update.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employment_status: "",
      company_name: "",
      job_title: "",
      industry: "",
      employment_type: "",
      start_date: "",
    });
    setFieldErrors({});
  };

  const cancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a2e5a] mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading employment data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <HiOutlineExclamationTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
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

  const { current_status, current_job, records, industries } = data;
  const isEmployed = current_status.employment_status === "employed";
  const hasRecords = records.length > 0;

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
              <HiOutlineBriefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[0.72rem] text-[#c8a84e] font-semibold tracking-wider uppercase mb-1">
                Employment Module
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Employment Status
              </h1>
              <p className="text-sm text-white/60 mt-1">
                Manage your work information and career history
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[0.68rem] text-white/40 font-medium mb-1">
                Current Status
              </p>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[0.78rem] font-semibold border ${
                  isEmployed
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}
              >
                {current_status.employment_label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━ Current Job Card ━━━━ */}
      {isEmployed && current_job && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/60 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <HiOutlineBuildingOffice2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.68rem] text-emerald-600 font-semibold uppercase tracking-wider mb-0.5">
                Current Position
              </p>
              <h3 className="text-lg font-bold text-emerald-900">
                {current_job.job_title}
              </h3>
              <p className="text-sm text-emerald-700 font-medium mt-0.5">
                {current_job.company_name}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-[0.72rem] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {(() => {
                    const tc = typeConfig[current_job.employment_type];
                    const TypeIcon = tc?.icon || HiOutlineMapPin;
                    return (
                      <>
                        <TypeIcon className="w-3.5 h-3.5" />{" "}
                        {current_job.employment_type_label}
                      </>
                    );
                  })()}
                </span>
                <span className="inline-flex items-center gap-1 text-[0.72rem] text-emerald-600">
                  <HiOutlineBriefcase className="w-3.5 h-3.5" />
                  {current_job.industry}
                </span>
                {current_job.start_date && (
                  <span className="inline-flex items-center gap-1 text-[0.72rem] text-emerald-600">
                    <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                    Since{" "}
                    {formatDateOnly(current_job.start_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━ Update Form ━━━━ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a2e5a]/[0.07] flex items-center justify-center">
              <HiOutlinePencilSquare className="w-[18px] h-[18px] text-[#1a2e5a]" />
            </div>
            <div>
              <h3 className="text-[0.82rem] font-bold text-slate-800">
                Update Employment
              </h3>
              <p className="text-[0.7rem] text-slate-400 mt-0.5">
                Record your current work status
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[0.75rem] font-semibold text-white bg-[#1a2e5a] hover:bg-[#243a6e] rounded-xl transition-colors shadow-sm"
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
              Update Status
            </button>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5">
            {/* Status Selection */}
            <div>
              <label
                id="employment-status-label"
                className="block text-[0.72rem] font-semibold text-slate-600 mb-2"
              >
                Employment Status <span className="text-red-400">*</span>
              </label>
              <div
                role="group"
                aria-labelledby="employment-status-label"
                className="grid grid-cols-2 gap-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, employment_status: "employed" })
                  }
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.employment_status === "employed"
                      ? "border-emerald-400 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      formData.employment_status === "employed"
                        ? "bg-emerald-100"
                        : "bg-slate-100"
                    }`}
                  >
                    <HiOutlineBriefcase
                      className={`w-5 h-5 ${
                        formData.employment_status === "employed"
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-bold ${formData.employment_status === "employed" ? "text-emerald-800" : "text-slate-700"}`}
                    >
                      Employed
                    </p>
                    <p
                      className={`text-[0.68rem] ${formData.employment_status === "employed" ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      I have a job
                    </p>
                  </div>
                  {formData.employment_status === "employed" && (
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

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      employment_status: "unemployed",
                      company_name: "",
                      job_title: "",
                      industry: "",
                      employment_type: "",
                      start_date: "",
                    })
                  }
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.employment_status === "unemployed"
                      ? "border-amber-300 bg-amber-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      formData.employment_status === "unemployed"
                        ? "bg-amber-100"
                        : "bg-slate-100"
                    }`}
                  >
                    <HiOutlineXCircle
                      className={`w-5 h-5 ${
                        formData.employment_status === "unemployed"
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-bold ${formData.employment_status === "unemployed" ? "text-amber-800" : "text-slate-700"}`}
                    >
                      Unemployed
                    </p>
                    <p
                      className={`text-[0.68rem] ${formData.employment_status === "unemployed" ? "text-amber-600" : "text-slate-400"}`}
                    >
                      Currently not working
                    </p>
                  </div>
                  {formData.employment_status === "unemployed" && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
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
              {fieldErrors.employment_status && (
                <p className="text-[0.68rem] text-red-500 mt-1">
                  {fieldErrors.employment_status[0]}
                </p>
              )}
            </div>

            {/* Employment Details — only when Employed */}
            {formData.employment_status === "employed" && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label
                      htmlFor="employment-company"
                      className="block text-[0.72rem] font-semibold text-slate-600 mb-1.5"
                    >
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="employment-company"
                        type="text"
                        autoComplete="organization"
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_name: e.target.value,
                          })
                        }
                        placeholder="e.g. Accenture Philippines"
                        maxLength={300}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white outline-none transition-all focus:ring-2 ${
                          fieldErrors.company_name
                            ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                            : "border-slate-200 focus:border-[#1a2e5a] focus:ring-[#1a2e5a]/10"
                        }`}
                      />
                    </div>
                    {fieldErrors.company_name && (
                      <p className="text-[0.68rem] text-red-500 mt-1">
                        {fieldErrors.company_name[0]}
                      </p>
                    )}
                  </div>

                  {/* Job Title */}
                  <div>
                    <label
                      htmlFor="employment-job-title"
                      className="block text-[0.72rem] font-semibold text-slate-600 mb-1.5"
                    >
                      Job Title <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="employment-job-title"
                        type="text"
                        autoComplete="organization-title"
                        value={formData.job_title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            job_title: e.target.value,
                          })
                        }
                        placeholder="e.g. Software Engineer"
                        maxLength={200}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white outline-none transition-all focus:ring-2 ${
                          fieldErrors.job_title
                            ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                            : "border-slate-200 focus:border-[#1a2e5a] focus:ring-[#1a2e5a]/10"
                        }`}
                      />
                    </div>
                    {fieldErrors.job_title && (
                      <p className="text-[0.68rem] text-red-500 mt-1">
                        {fieldErrors.job_title[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Industry */}
                  <div>
                    <label
                      htmlFor="employment-industry"
                      className="block text-[0.72rem] font-semibold text-slate-600 mb-1.5"
                    >
                      Industry <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="employment-industry"
                      value={formData.industry}
                      onChange={(e) =>
                        setFormData({ ...formData, industry: e.target.value })
                      }
                      className={`w-full px-3 py-2.5 border rounded-xl text-sm text-slate-800 bg-white outline-none transition-all focus:ring-2 appearance-none cursor-pointer ${
                        fieldErrors.industry
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                          : "border-slate-200 focus:border-[#1a2e5a] focus:ring-[#1a2e5a]/10"
                      }`}
                    >
                      <option value="">Select industry</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.industry && (
                      <p className="text-[0.68rem] text-red-500 mt-1">
                        {fieldErrors.industry[0]}
                      </p>
                    )}
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label
                      id="employment-type-label"
                      className="block text-[0.72rem] font-semibold text-slate-600 mb-1.5"
                    >
                      Employment Type <span className="text-red-400">*</span>
                    </label>
                    <div
                      role="group"
                      aria-labelledby="employment-type-label"
                      className="grid grid-cols-3 gap-2"
                    >
                      {Object.entries(typeConfig).map(([key, cfg]) => {
                        const TypeIcon = cfg.icon;
                        const selected = formData.employment_type === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, employment_type: key })
                            }
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                              selected
                                ? "border-[#1a2e5a] bg-[#1a2e5a]/[0.05] shadow-sm"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <TypeIcon
                              className={`w-4 h-4 ${selected ? "text-[#1a2e5a]" : "text-slate-400"}`}
                            />
                            <span
                              className={`text-[0.65rem] font-semibold ${selected ? "text-[#1a2e5a]" : "text-slate-500"}`}
                            >
                              {cfg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.employment_type && (
                      <p className="text-[0.68rem] text-red-500 mt-1">
                        {fieldErrors.employment_type[0]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div className="max-w-xs">
                  <label
                    htmlFor="employment-start-date"
                    className="block text-[0.72rem] font-semibold text-slate-600 mb-1.5"
                  >
                    Start Date{" "}
                    <span className="text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="employment-start-date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white outline-none transition-all focus:ring-2 focus:border-[#1a2e5a] focus:ring-[#1a2e5a]/10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification info */}
            {formData.employment_status && (
              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <div className="flex items-start gap-2.5">
                  <HiOutlineBellAlert className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[0.72rem] text-blue-700 leading-relaxed">
                    The <span className="font-semibold">Admin</span> team will
                    be automatically notified about this employment update.
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !formData.employment_status ||
                  (formData.employment_status === "employed" &&
                    (!formData.company_name ||
                      !formData.job_title ||
                      !formData.industry ||
                      !formData.employment_type))
                }
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[0.78rem] font-semibold text-white bg-[#1a2e5a] hover:bg-[#243a6e] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    Save Employment
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[0.78rem] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : !hasRecords ? (
          <div className="px-5 sm:px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <HiOutlineBriefcase className="w-7 h-7 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              No Employment Records
            </h4>
            <p className="text-[0.75rem] text-slate-500 max-w-sm mx-auto">
              You haven't added any employment information yet. Click "Update
              Status" above to record your current work status.
            </p>
          </div>
        ) : null}
      </div>

      {/* ━━━━ Employment History ━━━━ */}
      {hasRecords && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a2e5a]/[0.07] flex items-center justify-center">
                <HiOutlineClock className="w-[18px] h-[18px] text-[#1a2e5a]" />
              </div>
              <div>
                <h3 className="text-[0.82rem] font-bold text-slate-800">
                  Employment History
                </h3>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">
                  {records.length} record{records.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {records.map((rec) => {
              const tc = typeConfig[rec.employment_type] || typeConfig.local;
              const TypeIcon = tc.icon;
              return (
                <div
                  key={rec.id}
                  className="px-5 sm:px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        rec.is_current ? "bg-emerald-50" : "bg-slate-100"
                      }`}
                    >
                      <HiOutlineBuildingOffice2
                        className={`w-5 h-5 ${rec.is_current ? "text-emerald-600" : "text-slate-400"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[0.82rem] font-bold text-slate-800">
                          {rec.job_title}
                        </h4>
                        {rec.is_current && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.62rem] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-[0.78rem] text-slate-600 font-medium mt-0.5">
                        {rec.company_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[0.7rem] text-slate-500">
                          <TypeIcon className="w-3.5 h-3.5" />
                          {rec.employment_type_label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[0.7rem] text-slate-500">
                          <HiOutlineBriefcase className="w-3.5 h-3.5" />
                          {rec.industry}
                        </span>
                        {rec.start_date && (
                          <span className="inline-flex items-center gap-1 text-[0.7rem] text-slate-500">
                            <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                            {formatDateOnly(rec.start_date)}
                            {rec.end_date ? (
                              <>
                                {" "}
                                <HiOutlineChevronRight className="w-3 h-3" />{" "}
                                {formatDateOnly(rec.end_date)}
                              </>
                            ) : (
                              <> — Present</>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ━━━━ Info Note ━━━━ */}
      <div className="bg-gradient-to-r from-[#1a2e5a]/[0.03] to-[#c8a84e]/[0.04] rounded-2xl border border-slate-200/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c8a84e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <HiOutlineBriefcase className="w-[18px] h-[18px] text-[#c8a84e]" />
          </div>
          <div>
            <h4 className="text-[0.78rem] font-bold text-slate-800">
              About Employment Records
            </h4>
            <p className="text-[0.72rem] text-slate-500 mt-1 leading-relaxed">
              Keep your employment information up to date. When you add a new
              job, your previous position is automatically marked as ended. Your
              employment data is used for institutional reports and helps PAC
              track the career outcomes of its graduates. The Admin team is
              notified of any updates.
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
