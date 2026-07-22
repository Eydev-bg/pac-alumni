// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/directory/AlumniDirectoryPage.jsx
//  Alumni Directory (Phase B) — browse/search/filter fellow alumni.
//  Blue light-SaaS theme; mirrors the Career Center list pattern
//  (URL-synced page + search, debounced input, Pagination /
//  EmptyState). Filter dropdowns are fed by GET /alumni/directory
//  /filters (batch years + departments + courses); Employment and
//  Board are static enums.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import Pagination from "../../../components/common/Pagination";
import EmptyState from "../../../components/common/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { AlumniCard, Avatar, Badge, IconChip, Select } from "../../../components/alumni/ui";
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark,
} from "react-icons/hi2";

// Static enum filters (no endpoint needed) — values mirror the backend enums.
const EMPLOYMENT_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "unknown", label: "Unknown" },
];
const BOARD_OPTIONS = [
  { value: "passed", label: "Passed" },
  { value: "not_taken", label: "Not Yet Taken" },
  { value: "not_applicable", label: "Not Applicable" },
];

// The filter keys that live in the URL (everything except search + page).
const FILTER_KEYS = [
  "graduation_year",
  "department_id",
  "course_id",
  "employment_status",
  "board_status",
];

export default function AlumniDirectoryPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterData, setFilterData] = useState({
    years: [],
    departments: [],
    courses: [],
  });
  const [showFilters, setShowFilters] = useState(false); // mobile toggle

  // Page + search + filters all live in the URL so refresh and back/forward
  // restore the exact list state (mirrors the Career Center page).
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const search = (searchParams.get("search") || "").trim();
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const filters = useMemo(
    () =>
      Object.fromEntries(
        FILTER_KEYS.map((k) => [k, searchParams.get(k) || ""]),
      ),
    [searchParams],
  );
  const activeFilterCount = FILTER_KEYS.filter((k) => filters[k]).length;

  // ── Reference data for the filter dropdowns (fetched once) ──
  useEffect(() => {
    alumniApi
      .getDirectoryFilters()
      .then((res) => setFilterData(res.data.data))
      .catch(() => {
        /* Non-fatal: dropdowns stay empty, the list + search still work. */
      });
  }, []);

  // Courses shown in the Course dropdown, narrowed to the chosen department.
  const courseOptions = useMemo(() => {
    const deptId = filters.department_id;
    if (!deptId) return filterData.courses;
    return filterData.courses.filter(
      (c) => String(c.department_id) === String(deptId),
    );
  }, [filterData.courses, filters.department_id]);

  // ── Sync the debounced search input into the URL (resets to page 1) ──
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

  useEffect(() => {
    setSearchInput((cur) => (cur.trim() === search ? cur : search));
  }, [search]);

  // Patch one or more filter params; any filter change resets to page 1.
  const patchFilters = (patch) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      next.delete("page");
      return next;
    });
  };

  const clearFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      FILTER_KEYS.forEach((k) => next.delete(k));
      next.delete("page");
      return next;
    });
  };

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
    setError("");
    alumniApi
      .getDirectory({
        page,
        ...(search && { search }),
        ...Object.fromEntries(
          FILTER_KEYS.filter((k) => filters[k]).map((k) => [k, filters[k]]),
        ),
      })
      .then((res) => {
        setItems(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError("Failed to load the alumni directory."))
      .finally(() => setLoading(false));
  }, [page, search, filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ━━━━ Header ━━━━ */}
      <div className="flex items-center gap-3">
        <IconChip icon={HiOutlineUserGroup} color="blue" size="lg" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Alumni Directory
          </h1>
          <p className="text-sm text-slate-500">
            Browse and connect with fellow PAC alumni.
          </p>
        </div>
      </div>

      {/* ━━━━ Search ━━━━ */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            aria-label="Search alumni by name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search alumni by name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="sm:hidden relative inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
        >
          <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[0.6rem] font-bold text-white rounded-full bg-blue-600">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ━━━━ Filter row ━━━━ */}
      {/* Always visible on sm+; on mobile it toggles open below the search. */}
      <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <Select
            ariaLabel="Batch"
            value={filters.graduation_year}
            onChange={(v) => patchFilters({ graduation_year: v })}
            options={filterData.years.map((y) => ({
              value: String(y),
              label: String(y),
            }))}
            placeholder="All batches"
          />
          <Select
            ariaLabel="Department"
            value={filters.department_id}
            // Changing department clears an incompatible course selection.
            onChange={(v) => patchFilters({ department_id: v, course_id: "" })}
            options={filterData.departments.map((d) => ({
              value: String(d.id),
              label: d.name,
            }))}
            placeholder="All departments"
          />
          <Select
            ariaLabel="Course"
            value={filters.course_id}
            onChange={(v) => patchFilters({ course_id: v })}
            options={courseOptions.map((c) => ({
              value: String(c.id),
              label: c.code || c.name,
            }))}
            placeholder="All courses"
          />
          <Select
            ariaLabel="Employment"
            value={filters.employment_status}
            onChange={(v) => patchFilters({ employment_status: v })}
            options={EMPLOYMENT_OPTIONS}
            placeholder="All employment"
          />
          <Select
            ariaLabel="Board"
            value={filters.board_status}
            onChange={(v) => patchFilters({ board_status: v })}
            options={BOARD_OPTIONS}
            placeholder="All board status"
          />
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <HiOutlineXMark className="w-3.5 h-3.5" />
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      {/* ━━━━ Grid ━━━━ */}
      {loading ? (
        <DirectoryGridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={HiOutlineUserGroup}
          title="No alumni match your filters"
          message={
            search || activeFilterCount > 0
              ? "Try adjusting your search or filters."
              : "No alumni are listed in the directory yet."
          }
          action={
            search || activeFilterCount > 0 ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((alumni) => (
              <DirectoryCard key={alumni.uuid} alumni={alumni} />
            ))}
          </div>
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}

// ─── Directory card ─────────────────────────────────────────
function DirectoryCard({ alumni }) {
  const empColor =
    alumni.employment_status === "employed"
      ? "green"
      : alumni.employment_status === "unemployed"
        ? "orange"
        : "slate";

  const positionLine = alumni.position
    ? alumni.company
      ? `${alumni.position} at ${alumni.company}`
      : alumni.position
    : "—";

  return (
    <AlumniCard className="flex flex-col">
      <div className="flex items-start gap-3">
        <Avatar
          src={alumni.profile_picture}
          name={alumni.full_name}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-800 truncate">
            {alumni.full_name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {alumni.course?.code && (
              <Badge color="blue">{alumni.course.code}</Badge>
            )}
            {alumni.graduation_year && (
              <Badge color="slate">Batch {alumni.graduation_year}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-[0.8rem] text-slate-600">
        <div className="flex items-center gap-2">
          <HiOutlineBriefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="truncate">{positionLine}</span>
        </div>
        <div className="flex items-center gap-2">
          <HiOutlineMapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="truncate">{alumni.current_location || "—"}</span>
        </div>
        {alumni.employment_label && (
          <Badge color={empColor}>{alumni.employment_label}</Badge>
        )}
      </div>

      <Link
        to={`/alumni/directory/${alumni.uuid}`}
        className="mt-4 block text-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
      >
        View Profile
      </Link>
    </AlumniCard>
  );
}

// ─── Loading skeleton grid (matches the card dimensions) ────
function DirectoryGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 flex gap-1.5">
                <div className="h-4 w-12 rounded-full bg-slate-200" />
                <div className="h-4 w-16 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
          <div className="mt-4 h-8 w-full rounded-xl bg-slate-200" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
