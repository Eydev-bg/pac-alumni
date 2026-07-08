import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import {
  JOB_TYPE_LABELS,
  APPLICATION_STATUS_STYLES,
  formatSalaryRange,
} from "../../../config/jobOptions";
import { formatDateOnly, storageUrl } from "../../../utils/formatters";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
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
    <div className="fixed top-20 right-4 z-50">
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

export default function AlumniJobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    alumniApi
      .getJob(id)
      .then((res) => setJob(res.data.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load this job.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async () => {
    if (!window.confirm("Submit your interest for this job? The employer will be able to view your profile.")) {
      return;
    }
    setApplying(true);
    try {
      await alumniApi.applyToJob(id);
      setToast({ type: "success", message: "Application submitted! The employer has been notified." });
      // Reflect the new state locally without a full reload.
      setJob((prev) => ({ ...prev, has_applied: true, my_application_status: "pending" }));
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Could not submit your application.",
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto text-slate-500 text-sm">Loading job…</div>;
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <BackLink />
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
          {error || "Job not found."}
        </div>
      </div>
    );
  }

  const salary = formatSalaryRange(job.salary_range_min, job.salary_range_max);
  const applied = job.has_applied;
  const canApply = job.is_open && !applied;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <BackLink />

      {/* ━━━━ Job header ━━━━ */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.employer?.company_logo ? (
              <img
                src={storageUrl(job.employer.company_logo)}
                alt={job.company_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <HiOutlineBuildingOffice2 className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800">{job.title}</h1>
            <p className="text-sm text-slate-500">{job.company_name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {JOB_TYPE_LABELS[job.job_type] || job.job_type}
              </span>
              {!job.is_open && (
                <span className="text-[0.62rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  Closed
                </span>
              )}
              {applied && job.my_application_status && (
                <span
                  className={`text-[0.62rem] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    APPLICATION_STATUS_STYLES[job.my_application_status] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {job.my_application_status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[0.8rem] text-slate-600">
          {job.location && (
            <p className="flex items-center gap-2">
              <HiOutlineMapPin className="w-4 h-4 text-slate-400" /> {job.location}
            </p>
          )}
          {salary && (
            <p className="flex items-center gap-2">
              <HiOutlineBanknotes className="w-4 h-4 text-slate-400" /> {salary}
            </p>
          )}
          {job.expires_at && (
            <p className="flex items-center gap-2">
              <HiOutlineClock className="w-4 h-4 text-slate-400" /> Apply before{" "}
              {formatDateOnly(job.expires_at)}
            </p>
          )}
          {job.employer?.company_website && (
            <a
              href={job.employer.company_website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <HiOutlineGlobeAlt className="w-4 h-4" /> Company website
            </a>
          )}
        </div>

        {/* Apply action */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          {applied ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <HiOutlineCheckCircle className="w-5 h-5" />
              You've expressed interest in this job.
            </div>
          ) : !job.is_open ? (
            <p className="text-sm text-slate-500">
              This job is no longer accepting applications.
            </p>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying || !canApply}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-[0.82rem] font-bold rounded-lg shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <HiOutlineCheckCircle className="w-5 h-5" />
              {applying ? "Submitting…" : "I'm Interested"}
            </button>
          )}
        </div>
      </div>

      {/* ━━━━ Description ━━━━ */}
      <Section title="Job Description">
        <p className="whitespace-pre-line text-[0.82rem] leading-relaxed text-slate-600">
          {job.description}
        </p>
      </Section>

      {job.qualifications && (
        <Section title="Qualifications">
          <p className="whitespace-pre-line text-[0.82rem] leading-relaxed text-slate-600">
            {job.qualifications}
          </p>
        </Section>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/alumni/jobs"
      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
    >
      <HiOutlineArrowLeft className="w-4 h-4" /> Back to Job Board
    </Link>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-bold text-slate-800 mb-3">{title}</h2>
      {children}
    </div>
  );
}
