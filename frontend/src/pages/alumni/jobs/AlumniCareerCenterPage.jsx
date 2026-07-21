// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/alumni/jobs/AlumniCareerCenterPage.jsx
//  Career Center — admin-posted job openings (apply via external link)
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import SkeletonCard from "../../../components/common/SkeletonCard";
import EmptyState from "../../../components/common/EmptyState";
import { formatDate, storageUrl } from "../../../utils/formatters";
import { IconChip } from "../../../components/alumni/ui";
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
  // 5A: page and search live in the URL so refresh and back/forward
  // restore the list position and query.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const search = (searchParams.get("search") || "").trim();
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync the debounced input to the URL. Typing replaces the history entry
  // (no per-keystroke entries); a new search resets to page 1 by dropping
  // the page param. The stale-guard skips writes while the debounced value
  // lags the input (e.g. right after back/forward re-synced it).
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === search) return;
    if (trimmed !== searchInput.trim()) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set("search", trimmed);
        else next.delete("search");
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, searchInput, search, setSearchParams]);

  // Back/forward can change the URL search independently — reflect it in
  // the input. Kept as-is while it trims to the same value so a trailing
  // space mid-typing isn't eaten.
  useEffect(() => {
    setSearchInput((cur) => (cur.trim() === search ? cur : search));
  }, [search]);

  const handlePageChange = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      <div className="flex items-center gap-3">
        <IconChip icon={HiOutlineBriefcase} color="blue" size="lg" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Job Openings
          </h1>
          <p className="text-sm text-slate-500">
            Opportunities shared by PAC for its alumni.
          </p>
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
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {/* ━━━━ List ━━━━ */}
      {loading ? (
        <SkeletonCard variant="job" count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={HiOutlineBriefcase}
          title={search ? "No matching job openings" : "No job openings yet"}
          message={
            search
              ? "No job openings match your search."
              : "No job openings right now. Check back soon."
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          <Pagination meta={meta} onPageChange={handlePageChange} />
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
          ? "border-amber-300 ring-1 ring-amber-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <CompanyLogo logo={job.company_logo} name={job.company_name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {job.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
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
              <HiOutlineMapPin className="w-3.5 h-3.5 text-blue-600" />
              {job.location}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
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
          className="flex-shrink-0 self-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
