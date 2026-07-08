import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import employerApi from "../../../api/employerApi";
import {
  HiOutlineBriefcase,
  HiOutlineLockOpen,
  HiOutlineUsers,
  HiOutlineClock,
} from "react-icons/hi2";

const STAT_CARDS = [
  { key: "total_jobs", label: "Total Jobs", icon: HiOutlineBriefcase, color: "bg-blue-50 text-blue-600" },
  { key: "open_jobs", label: "Open Jobs", icon: HiOutlineLockOpen, color: "bg-emerald-50 text-emerald-600" },
  { key: "total_applications", label: "Applications", icon: HiOutlineUsers, color: "bg-violet-50 text-violet-600" },
  { key: "pending_applications", label: "Pending Review", icon: HiOutlineClock, color: "bg-amber-50 text-amber-600" },
];

export default function EmployerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employerApi
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-500 text-sm">Loading dashboard…</div>;
  }

  const stats = data?.stats || {};
  const recentJobs = data?.recent_jobs || [];
  const recentApplications = data?.recent_applications || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your job posts and applicants.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color} mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats[c.key] ?? 0}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700">Recent Jobs</h2>
            <Link to="/employer/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-slate-400">No jobs posted yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/employer/jobs/${job.id}/applicants`}
                      className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-slate-400">{job.location}</p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 ml-3">
                    {job.applications_count ?? 0} applicants
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Recent Applicants</h2>
          {recentApplications.length === 0 ? (
            <p className="text-sm text-slate-400">No applicants yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentApplications.map((app) => (
                <li key={app.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {app.alumni?.full_name || "Alumni"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{app.job?.title}</p>
                  </div>
                  <span className="text-[0.65rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 ml-3">
                    {app.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
