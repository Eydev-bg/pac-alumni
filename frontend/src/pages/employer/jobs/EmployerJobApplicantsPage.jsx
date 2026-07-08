import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import employerApi from "../../../api/employerApi";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_STYLES,
} from "../../../config/jobOptions";
import {
  HiOutlineArrowLeft,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
} from "react-icons/hi2";

export default function EmployerJobApplicantsPage() {
  const { id } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    employerApi
      .getApplicants(id)
      .then((res) => setApplicants(res.data.data))
      .catch(() => setError("Failed to load applicants."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (appId, status, notes) => {
    setSavingId(appId);
    try {
      const res = await employerApi.updateApplicationStatus(appId, {
        status,
        employer_notes: notes || "",
      });
      const updated = res.data.data;
      setApplicants((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, ...updated } : a))
      );
    } catch {
      setError("Failed to update application status.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/employer/jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Applicants</h1>
        <p className="text-sm text-slate-500">
          Review alumni who applied. Their profile is their application.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading applicants…</div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
          No applicants yet.
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => (
            <ApplicantCard
              key={app.id}
              app={app}
              saving={savingId === app.id}
              onUpdate={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantCard({ app, saving, onUpdate }) {
  const a = app.alumni || {};
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.employer_notes || "");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800">{a.full_name || "Alumni"}</h3>
            <span
              className={`text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full ${
                APPLICATION_STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"
              }`}
            >
              {app.status}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
            {a.email && (
              <p className="flex items-center gap-1.5">
                <HiOutlineEnvelope className="w-4 h-4 text-slate-400" /> {a.email}
              </p>
            )}
            {a.contact_number && (
              <p className="flex items-center gap-1.5">
                <HiOutlinePhone className="w-4 h-4 text-slate-400" /> {a.contact_number}
              </p>
            )}
            {(a.course || a.course_code) && (
              <p className="flex items-center gap-1.5">
                <HiOutlineAcademicCap className="w-4 h-4 text-slate-400" />
                {a.course_code || a.course}
                {a.graduation_year ? ` · ${a.graduation_year}` : ""}
              </p>
            )}
            {a.current_employment && (
              <p className="flex items-center gap-1.5">
                <HiOutlineBriefcase className="w-4 h-4 text-slate-400" />
                {a.current_employment.job_title} @ {a.current_employment.company_name}
              </p>
            )}
          </div>
          {a.department && (
            <p className="mt-1 text-[0.7rem] text-slate-400">{a.department}</p>
          )}
        </div>
      </div>

      {/* Review controls */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3">
        <div>
          <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-[0.78rem] outline-none focus:border-blue-500"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">
            Notes (optional)
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes for this applicant"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[0.78rem] outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => onUpdate(app.id, status, notes)}
          disabled={saving}
          className="px-4 py-2 bg-[#1a2e5a] text-white text-[0.78rem] font-semibold rounded-lg hover:bg-[#2a4177] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Update"}
        </button>
      </div>
    </div>
  );
}
