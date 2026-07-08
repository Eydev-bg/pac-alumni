import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import employerApi from "../../../api/employerApi";
import {
  JOB_TYPE_LABELS,
  JOB_STATUS_STYLES,
} from "../../../config/jobOptions";
import {
  HiOutlinePlusCircle,
  HiOutlineUsers,
  HiOutlinePencilSquare,
  HiOutlineLockClosed,
  HiOutlineTrash,
} from "react-icons/hi2";

export default function EmployerJobListPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    employerApi
      .getJobs()
      .then((res) => setJobs(res.data.data))
      .catch(() => setError("Failed to load jobs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClose = async (id) => {
    if (!window.confirm("Close this job? It will stop accepting applications.")) return;
    setBusyId(id);
    try {
      await employerApi.closeJob(id);
      load();
    } catch {
      setError("Failed to close job.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job post permanently?")) return;
    setBusyId(id);
    try {
      await employerApi.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch {
      setError("Failed to delete job.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Jobs</h1>
          <p className="text-sm text-slate-500">Manage your job posts and applicants.</p>
        </div>
        <Link
          to="/employer/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-[0.8rem] font-bold rounded-lg shadow-md hover:-translate-y-0.5 transition-all"
        >
          <HiOutlinePlusCircle className="w-5 h-5" /> Post a Job
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading jobs…</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 text-sm mb-4">You haven't posted any jobs yet.</p>
          <Link
            to="/employer/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2e5a] text-white text-[0.8rem] font-semibold rounded-lg"
          >
            <HiOutlinePlusCircle className="w-5 h-5" /> Create your first job
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{job.title}</h3>
                  <span
                    className={`text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      JOB_STATUS_STYLES[job.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {job.status}
                  </span>
                  {!job.is_open && (
                    <span className="text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Closed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {JOB_TYPE_LABELS[job.job_type] || job.job_type} · {job.location} ·{" "}
                  {job.applications_count ?? 0} applicants
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to={`/employer/jobs/${job.id}/applicants`}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                  title="View applicants"
                >
                  <HiOutlineUsers className="w-4 h-4" />
                </Link>
                <Link
                  to={`/employer/jobs/${job.id}/edit`}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                  title="Edit"
                >
                  <HiOutlinePencilSquare className="w-4 h-4" />
                </Link>
                {job.is_open && (
                  <button
                    onClick={() => handleClose(job.id)}
                    disabled={busyId === job.id}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 disabled:opacity-50"
                    title="Close"
                  >
                    <HiOutlineLockClosed className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(job.id)}
                  disabled={busyId === job.id}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
