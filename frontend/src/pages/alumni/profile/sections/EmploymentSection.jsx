// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/sections/EmploymentSection.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import alumniApi from "../../../../api/alumniApi";
import { useToast } from "../../../../hooks/useToast";
import { formatDateOnly } from "../../../../utils/formatters";
import SkeletonCard from "../../../../components/common/SkeletonCard";
import {
  AlumniCard,
  IconChip,
  SectionHeader,
  Badge,
  Select,
} from "../../../../components/alumni/ui";
import {
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineUserCircle,
  HiOutlineBellAlert,
  HiOutlineChevronRight,
  HiOutlineXCircle,
} from "react-icons/hi2";
import StatusChoice from "../components/StatusChoice";
import EmploymentBadge from "../components/EmploymentBadge";
import {
  inputBase,
  inputOk,
  inputErr,
  fieldLabel,
  btnPrimary,
  btnGhost,
} from "../styles";

// ═══════════════════════════════════════════════════════════
//  C) EMPLOYMENT — reuses GET /employment + POST /employment
// ═══════════════════════════════════════════════════════════

const typeConfig = {
  local: { icon: HiOutlineMapPin, label: "Local" },
  international: { icon: HiOutlineGlobeAlt, label: "International" },
  self_employed: { icon: HiOutlineUserCircle, label: "Self-employed" },
};

export default function EmploymentSection({ onSaved }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await alumniApi.getEmploymentData();
      setData(res.data.data);
    } catch {
      // Section stays in its empty state on failure.
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      // Unemployed submits status only — mirrors the standalone page exactly.
      const payload =
        formData.employment_status === "unemployed"
          ? { employment_status: "unemployed" }
          : { ...formData };
      await alumniApi.submitEmployment(payload);
      await load();
      onSaved?.();
      setShowForm(false);
      resetForm();
      toast.success(
        formData.employment_status === "employed"
          ? "Employment updated! The Admin team has been notified."
          : "Status updated to Unemployed. The Admin team has been notified.",
      );
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Failed to update.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const current = data?.current_status;
  const currentJob = data?.current_job;
  const records = data?.records ?? [];
  const industries = data?.industries ?? [];
  const isEmployed = current?.employment_status === "employed";
  const hasRecords = records.length > 0;

  return (
    <AlumniCard id="section-employment" className="scroll-mt-20">
      <SectionHeader
        title="Employment Information"
        action={
          !loading && current ? (
            <EmploymentBadge
              value={current.employment_status}
              label={current.employment_label}
            />
          ) : null
        }
      />

      {loading ? (
        <SkeletonCard variant="form" count={1} />
      ) : (
        <>
          {/* Current position highlight */}
          {isEmployed && currentJob && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-4 mb-4">
              <div className="flex items-start gap-3">
                <IconChip icon={HiOutlineBuildingOffice2} color="green" />
                <div className="min-w-0">
                  <p className="text-[0.65rem] text-emerald-600 font-semibold uppercase tracking-wider">
                    Current Position
                  </p>
                  <h4 className="text-sm font-bold text-emerald-900">
                    {currentJob.job_title}
                  </h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    {currentJob.company_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[0.7rem] text-emerald-600">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlineBriefcase className="w-3.5 h-3.5" />
                      {currentJob.industry}
                    </span>
                    {currentJob.start_date && (
                      <span className="inline-flex items-center gap-1">
                        <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                        Since {formatDateOnly(currentJob.start_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update trigger / form */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[0.75rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
              Update Employment Status
            </button>
          )}

          {!showForm && !hasRecords && (
            <p className="text-[0.75rem] text-slate-400 mt-3">
              No employment information yet. Use the button above to record your
              current work status.
            </p>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Status choice */}
              <div>
                <label
                  id="emp-status-label"
                  className="block text-[0.72rem] font-semibold text-slate-600 mb-2"
                >
                  Employment Status <span className="text-red-400">*</span>
                </label>
                <div
                  role="group"
                  aria-labelledby="emp-status-label"
                  className="grid grid-cols-2 gap-3"
                >
                  <StatusChoice
                    active={formData.employment_status === "employed"}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        employment_status: "employed",
                      })
                    }
                    icon={HiOutlineBriefcase}
                    tone="emerald"
                    title="Employed"
                    subtitle="I have a job"
                  />
                  <StatusChoice
                    active={formData.employment_status === "unemployed"}
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
                    icon={HiOutlineXCircle}
                    tone="amber"
                    title="Unemployed"
                    subtitle="Currently not working"
                  />
                </div>
                {fieldErrors.employment_status && (
                  <p className="text-[0.68rem] text-red-500 mt-1">
                    {fieldErrors.employment_status[0]}
                  </p>
                )}
              </div>

              {/* Details — only when Employed */}
              {formData.employment_status === "employed" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emp-company" className={fieldLabel}>
                        Company Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="emp-company"
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
                          className={`${inputBase} pl-10 pr-3 ${fieldErrors.company_name ? inputErr : inputOk}`}
                        />
                      </div>
                      {fieldErrors.company_name && (
                        <p className="text-[0.68rem] text-red-500 mt-1">
                          {fieldErrors.company_name[0]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="emp-title" className={fieldLabel}>
                        Job Title <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="emp-title"
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
                          className={`${inputBase} pl-10 pr-3 ${fieldErrors.job_title ? inputErr : inputOk}`}
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
                    <div>
                      <label htmlFor="emp-industry" className={fieldLabel}>
                        Industry <span className="text-red-400">*</span>
                      </label>
                      <Select
                        id="emp-industry"
                        value={formData.industry}
                        onChange={(v) =>
                          setFormData({ ...formData, industry: v })
                        }
                        options={industries.map((ind) => ({
                          value: ind,
                          label: ind,
                        }))}
                        placeholder="Select industry"
                        error={!!fieldErrors.industry}
                      />
                      {fieldErrors.industry && (
                        <p className="text-[0.68rem] text-red-500 mt-1">
                          {fieldErrors.industry[0]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label id="emp-type-label" className={fieldLabel}>
                        Employment Type <span className="text-red-400">*</span>
                      </label>
                      <div
                        role="group"
                        aria-labelledby="emp-type-label"
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
                                setFormData({
                                  ...formData,
                                  employment_type: key,
                                })
                              }
                              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                                selected
                                  ? "border-blue-500 bg-blue-50 shadow-sm"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <TypeIcon
                                className={`w-4 h-4 ${selected ? "text-blue-600" : "text-slate-400"}`}
                              />
                              <span
                                className={`text-[0.65rem] font-semibold ${selected ? "text-blue-700" : "text-slate-500"}`}
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

                  <div className="max-w-xs">
                    <label htmlFor="emp-start" className={fieldLabel}>
                      Start Date{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <div className="relative">
                      <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="emp-start"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        max={new Date().toISOString().split("T")[0]}
                        className={`${inputBase} pl-10 pr-3 ${inputOk}`}
                      />
                    </div>
                  </div>
                </div>
              )}

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

              <div className="flex items-center gap-2">
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
                  className={btnPrimary}
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
                Employment History ({records.length})
              </p>
              <div className="divide-y divide-slate-100">
                {records.map((rec) => {
                  const tc =
                    typeConfig[rec.employment_type] || typeConfig.local;
                  const TypeIcon = tc.icon;
                  return (
                    <div key={rec.id} className="py-3 flex items-start gap-3">
                      <IconChip
                        icon={HiOutlineBuildingOffice2}
                        color={rec.is_current ? "green" : "slate"}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-[0.82rem] font-bold text-slate-800">
                            {rec.job_title}
                          </h5>
                          {rec.is_current && (
                            <Badge color="green">Current</Badge>
                          )}
                        </div>
                        <p className="text-[0.78rem] text-slate-600 font-medium">
                          {rec.company_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[0.7rem] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <TypeIcon className="w-3.5 h-3.5" />
                            {rec.employment_type_label}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineBriefcase className="w-3.5 h-3.5" />
                            {rec.industry}
                          </span>
                          {rec.start_date && (
                            <span className="inline-flex items-center gap-1">
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
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </AlumniCard>
  );
}
