import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import {
  JOB_TYPES,
  JOB_TYPE_LABELS,
  formatSalaryRange,
} from "../../../config/jobOptions";
import { timeAgo, storageUrl } from "../../../utils/formatters";
import {
  HiOutlineBriefcase,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function AlumniJobBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);

  // The applied filters that actually drive the request. Separate from the
  // input state so typing doesn't fire a request on every keystroke.
  const [applied, setApplied] = useState({ search: "", job_type: "", location: "" });

  const load = useCallback(() => {
    setLoading(true);
    alumniApi
      .getJobs({
        page,
        search: applied.search || undefined,
        job_type: applied.job_type || undefined,
        location: applied.location || undefined,
      })
      .then((res) => {
        setJobs(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError("Failed to load jobs."))
      .finally(() => setLoading(false));
  }, [page, applied]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied({ search, job_type: jobType, location });
  };

  const clearFilters = () => {
    setSearch("");
    setJobType("");
    setLocation("");
    setPage(1);
    setApplied({ search: "", job_type: "", location: "" });
  };

  const hasFilters = applied.search || applied.job_type || applied.location;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ━━━━ Header ━━━━ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e5a] via-[#243a6e] to-[#1e3466] rounded-2xl shadow-lg">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-[#c8a84e]/[0.06]" />
        <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
              <HiOutlineBriefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[0.72rem] text-[#c8a84e] font-semibold tracking-wider uppercase mb-1">
                Career Opportunities
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Job Board</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Browse openings posted by partner employers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━ Filters ━━━━ */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3"
      >
        <div className="sm:col-span-5">
          <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">
            Search
          </label>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Job title, company, keyword…"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">
            Job Type
          </label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[0.7rem] font-semibold text-slate-600 mb-1">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] outline-none focus:border-blue-500"
          />
        </div>
        <div className="sm:col-span-2 flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-[#1a2e5a] text-white text-[0.8rem] font-semibold rounded-lg hover:bg-[#2a4177]"
          >
            Search
          </button>
        </div>
        {hasFilters && (
          <div className="sm:col-span-12">
            <button
              type="button"
              onClick={clearFilters}
              className="text-[0.72rem] font-semibold text-slate-500 hover:text-blue-600"
            >
              Clear filters
            </button>
          </div>
        )}
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {/* ━━━━ Job list ━━━━ */}
      {loading ? (
        <div className="text-slate-500 text-sm">Loading jobs…</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
          {hasFilters
            ? "No jobs match your filters."
            : "No job openings available right now. Check back soon."}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

function JobCard({ job }) {
  const salary = formatSalaryRange(job.salary_range_min, job.salary_range_max);

  return (
    <Link
      to={`/alumni/jobs/${job.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {job.employer?.company_logo ? (
            <img
              src={storageUrl(job.employer.company_logo)}
              alt={job.company_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <HiOutlineBuildingOffice2 className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 truncate">{job.title}</h3>
            <span className="text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {JOB_TYPE_LABELS[job.job_type] || job.job_type}
            </span>
            {job.has_applied && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                <HiOutlineCheckCircle className="w-3 h-3" /> Applied
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{job.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-slate-500">
            {job.location && (
              <span className="flex items-center gap-1">
                <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
              </span>
            )}
            {salary && (
              <span className="flex items-center gap-1">
                <HiOutlineBanknotes className="w-3.5 h-3.5 text-slate-400" /> {salary}
              </span>
            )}
          </div>
        </div>
        {job.created_at && (
          <span className="text-[0.65rem] text-slate-400 flex-shrink-0">
            {timeAgo(job.created_at)}
          </span>
        )}
      </div>
    </Link>
  );
}
