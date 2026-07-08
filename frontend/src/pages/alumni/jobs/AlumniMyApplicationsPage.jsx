import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_STYLES,
  JOB_TYPE_LABELS,
} from "../../../config/jobOptions";
import { formatDateOnly } from "../../../utils/formatters";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMapPin,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineArrowRight,
} from "react-icons/hi2";

export default function AlumniMyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    alumniApi
      .getMyApplications({ page, status: status || undefined })
      .then((res) => {
        setApplications(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError("Failed to load your applications."))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ━━━━ Header ━━━━ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e5a] via-[#243a6e] to-[#1e3466] rounded-2xl shadow-lg">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.03]" />
        <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
              <HiOutlineClipboardDocumentList className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[0.72rem] text-[#c8a84e] font-semibold tracking-wider uppercase mb-1">
                Career Opportunities
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">My Applications</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Track the status of jobs you've applied to.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━ Status filter ━━━━ */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="All" active={status === ""} onClick={() => handleStatusChange("")} />
        {APPLICATION_STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            label={s.label}
            active={status === s.value}
            onClick={() => handleStatusChange(s.value)}
          />
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {/* ━━━━ Applications ━━━━ */}
      {loading ? (
        <div className="text-slate-500 text-sm">Loading applications…</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 text-sm mb-4">
            {status
              ? "No applications with this status."
              : "You haven't applied to any jobs yet."}
          </p>
          <Link
            to="/alumni/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2e5a] text-white text-[0.8rem] font-semibold rounded-lg"
          >
            Browse the Job Board <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[0.72rem] font-semibold transition-colors ${
        active
          ? "bg-[#1a2e5a] text-white"
          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function ApplicationCard({ app }) {
  const job = app.job || {};

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 truncate">
              {job.title || "Job"}
            </h3>
            <span
              className={`text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full ${
                APPLICATION_STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"
              }`}
            >
              {app.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{job.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-slate-500">
            {job.location && (
              <span className="flex items-center gap-1">
                <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
              </span>
            )}
            {job.job_type && (
              <span>{JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>
            )}
            {app.applied_at && <span>Applied {formatDateOnly(app.applied_at)}</span>}
          </div>
          {app.employer_notes && (
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 text-[0.72rem] text-slate-600">
              <HiOutlineChatBubbleBottomCenterText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{app.employer_notes}</span>
            </div>
          )}
        </div>
        {job.id && (
          <Link
            to={`/alumni/jobs/${job.id}`}
            className="text-[0.72rem] font-semibold text-blue-600 hover:underline flex-shrink-0 whitespace-nowrap"
          >
            View job
          </Link>
        )}
      </div>
    </div>
  );
}
