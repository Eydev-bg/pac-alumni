// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/alumni/jobs/AlumniCareerCenterPage.jsx
//  Career Center — admin-posted job openings (apply via external link)
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import { formatDate, storageUrl } from "../../../utils/formatters";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineBuildingOffice2,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineBookmark,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";

export default function AlumniCareerCenterPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    alumniApi
      .getJobPostings({ page, ...(search && { search }) })
      .then((res) => {
        setItems(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError("Failed to load job openings."))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                Career Center
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Job Openings
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                Opportunities shared by PAC for its alumni.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━ Search ━━━━ */}
      <div className="relative">
        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          aria-label="Search job postings"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by company, position, or location..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]/20 focus:border-[#1a2e5a]/40 transition-colors"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {/* ━━━━ List ━━━━ */}
      {loading ? (
        <div className="text-slate-500 text-sm">Loading job openings…</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <HiOutlineBriefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            {search
              ? "No job openings match your search."
              : "No job openings right now. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

// Company logo with a building-icon fallback (light surface).
function CompanyLogo({ logo, name, size = "md" }) {
  const cls = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  if (logo) {
    return (
      <img
        src={storageUrl(logo)}
        alt={name}
        className={`${cls} rounded-xl object-cover border border-slate-200 flex-shrink-0`}
      />
    );
  }
  return (
    <span
      className={`${cls} rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0`}
    >
      <HiOutlineBuildingOffice2 className="w-6 h-6 text-slate-400" />
    </span>
  );
}

function JobCard({ job }) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-all hover:shadow-sm ${
        job.is_pinned
          ? "border-[#c8a84e]/40 ring-1 ring-[#c8a84e]/20"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <CompanyLogo logo={job.company_logo} name={job.company_name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {job.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#c8a84e]/15 text-[#a8893a]">
                <HiOutlineBookmark className="w-3 h-3" /> Pinned
              </span>
            )}
            <h3 className="text-sm font-bold text-slate-800 truncate">
              {job.job_position}
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-0.5 truncate">
            {job.company_name}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-slate-500">
            <span className="flex items-center gap-1">
              <HiOutlineMapPin className="w-3.5 h-3.5 text-[#1a2e5a]" />
              {job.location}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1a2e5a]/[0.08] text-[#1a2e5a] font-medium">
              {job.employment_type_label}
            </span>
            {job.salary && (
              <span className="flex items-center gap-1">
                <HiOutlineBanknotes className="w-3.5 h-3.5 text-emerald-600" />
                {job.salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HiOutlineClock className="w-3.5 h-3.5" />
              {job.application_deadline
                ? `Deadline: ${formatDate(job.application_deadline)}`
                : "Open until filled"}
            </span>
          </div>
        </div>

        <Link
          to={`/alumni/careers/${job.id}`}
          className="flex-shrink-0 self-center px-4 py-2 text-xs font-semibold text-white bg-[#1a2e5a] rounded-xl hover:bg-[#243a6e] transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
