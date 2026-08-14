// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/alumni/jobs/AlumniCareerCenterPage.jsx
//  Career Center — job openings posted by PAC admins and by fellow alumni.
//  "My Posts" lists the signed-in alumni's own postings with edit/delete.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import { useToast } from "../../../hooks/useToast";
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
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

const TABS = [
  { value: "all", label: "All Jobs" },
  { value: "mine", label: "My Posts" },
];

export default function AlumniCareerCenterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 5A: page, search and tab live in the URL so refresh and back/forward
  // restore the list position, query and selected tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const search = (searchParams.get("search") || "").trim();
  const tab = searchParams.get("tab") === "mine" ? "mine" : "all";
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

  const handleTabChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "mine") next.set("tab", "mine");
      else next.delete("tab");
      next.delete("page");
      return next;
    });
  };

  // Toggling All Jobs ↔ My Posts re-runs the effect below. Results are kept
  // per tab+page+search so flipping back is instant instead of re-hitting the
  // API. The cache lives in a ref, so it dies with the component — navigating
  // to the post form and back always refetches. Mutations clear it explicitly.
  const cacheRef = useRef(new Map());
  const cacheKey = `${tab}|${page}|${search}`;

  const load = useCallback(
    ({ force = false } = {}) => {
      const key = `${tab}|${page}|${search}`;

      if (!force) {
        const cached = cacheRef.current.get(key);
        if (cached) {
          setItems(cached.items);
          setMeta(cached.meta);
          setError("");
          setLoading(false);
          return Promise.resolve();
        }
      }

      setLoading(true);
      setError("");
      const params = { page, ...(search && { search }) };
      const request =
        tab === "mine"
          ? alumniApi.getMyJobPosts(params)
          : alumniApi.getJobPostings(params);

      return request
        .then((res) => {
          const items = res.data.data;
          const meta = res.data.meta;
          cacheRef.current.set(key, { items, meta });
          setItems(items);
          setMeta(meta);
        })
        .catch(() =>
          setError(
            tab === "mine"
              ? "Failed to load your job postings."
              : "Failed to load job openings.",
          ),
        )
        .finally(() => setLoading(false));
    },
    [page, search, tab],
  );

  useEffect(() => {
    load();
    // cacheKey is derived from load's own deps — listed so a tab/page/search
    // change re-reads the cache rather than reusing the previous render's rows.
  }, [load, cacheKey]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await alumniApi.deleteMyJobPost(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Job posting deleted.");
      // The deleted row also disappears from All Jobs and shifts pagination,
      // so drop every cached page rather than just the current one.
      cacheRef.current.clear();
      load({ force: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to delete job posting.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const isMineTab = tab === "mine";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ━━━━ Header ━━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconChip icon={HiOutlineBriefcase} color="blue" size="lg" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              Job Openings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Opportunities shared by PAC and your fellow alumni.
            </p>
          </div>
        </div>
        <Link
          to="/alumni/careers/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <HiOutlinePlus className="w-4 h-4" /> Post a Job
        </Link>
      </div>

      {/* ━━━━ Tabs ━━━━ */}
      <div
        role="tablist"
        aria-label="Job list filter"
        className="flex gap-2 border-b border-slate-200 dark:border-slate-700"
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => handleTabChange(t.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.value
                ? "border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ━━━━ Search ━━━━ */}
      <div className="relative">
        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          aria-label="Search job postings"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by company, position, or location..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[0.78rem] text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ━━━━ List ━━━━ */}
      {loading ? (
        <SkeletonCard variant="job" count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={HiOutlineBriefcase}
          title={
            search
              ? "No matching job openings"
              : isMineTab
                ? "You haven't posted a job yet"
                : "No job openings yet"
          }
          message={
            search
              ? "No job openings match your search."
              : isMineTab
                ? "Share an opening with your fellow alumni — use Post a Job above."
                : "No job openings right now. Check back soon."
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              showOwnerActions={isMineTab}
              onEdit={() => navigate(`/alumni/careers/${job.id}/edit`)}
              onDelete={() => setDeleteTarget(job)}
            />
          ))}
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </div>
      )}

      <DeletePostDialog
        job={deleteTarget}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
        className={`${cls} rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0`}
      />
    );
  }
  return (
    <span
      className={`${cls} rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0`}
    >
      <HiOutlineBuildingOffice2 className="w-6 h-6 text-slate-400" />
    </span>
  );
}

/**
 * "Posted by [name] · [course], [batch_year]" — shown only on alumni-posted
 * jobs. Admin-posted jobs are the default and show nothing extra.
 */
function PosterAttribution({ job }) {
  if (job.source !== "alumni" || !job.posted_by_alumni_name) return null;

  const credentials = [
    job.posted_by_alumni_course,
    job.posted_by_alumni_batch_year,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <p className="mt-1 inline-flex items-center gap-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
      <HiOutlineUserCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <span className="truncate">
        Posted by {job.posted_by_alumni_name}
        {credentials && ` · ${credentials}`}
      </span>
    </p>
  );
}

function JobCard({ job, showOwnerActions, onEdit, onDelete }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border p-5 transition-all hover:shadow-sm ${
        job.is_pinned
          ? "border-amber-300 ring-1 ring-amber-100 dark:border-amber-500/50 dark:ring-amber-500/20"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-4">
        <CompanyLogo logo={job.company_logo} name={job.company_name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {job.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <HiOutlineBookmark className="w-3 h-3" /> Pinned
              </span>
            )}
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {job.job_position}
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 truncate">
            {job.company_name}
          </p>

          <PosterAttribution job={job} />

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <HiOutlineMapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {job.location}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-medium">
              {job.employment_type_label}
            </span>
            {job.salary && (
              <span className="flex items-center gap-1">
                <HiOutlineBanknotes className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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

        <div className="flex-shrink-0 self-center flex items-center gap-1">
          {showOwnerActions && (
            <>
              <button
                onClick={onEdit}
                title="Edit"
                aria-label={`Edit ${job.job_position}`}
                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/15 transition-colors"
              >
                <HiOutlinePencilSquare className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                title="Delete"
                aria-label={`Delete ${job.job_position}`}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </>
          )}
          <Link
            to={`/alumni/careers/${job.id}`}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Delete confirmation for an alumni's own post. Light-theme dialog to match
 * the Career Center (the shared ConfirmDialog renders on the admin's dark
 * navy panel).
 */
function DeletePostDialog({ job, deleting, onConfirm, onCancel }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!job) return;
    panelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && !deleting && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [job, deleting, onCancel]);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !deleting && onCancel()}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-post-title"
          tabIndex={-1}
          className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-slate-900/50 max-w-md w-full p-6 focus:outline-none"
        >
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-300" />
            </span>
            <div className="min-w-0">
              <h3
                id="delete-post-title"
                className="text-base font-bold text-slate-800 dark:text-slate-100"
              >
                Delete Job Posting
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Delete &ldquo;{job.job_position} at {job.company_name}&rdquo;?
                Alumni will no longer see it in the Career Center. This cannot
                be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
