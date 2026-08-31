// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/verification/VerificationLogsPage.jsx
//  STYLE: Notification feed — grouped by date, latest on top
//  FEATURE: Expandable rejection reason per item; repeat failed attempts by
//           the same person collapse into a single countable row
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from "react";
import adminApi from "../../../api/adminApi";
import Pagination from "../../../components/common/Pagination";
import { useToast } from "../../../hooks/useToast";
import { periodToDateParams, PERIOD_OPTIONS } from "../../../utils/dateFilters";
import { formatDateOnly } from "../../../utils/formatters";
import { PAGINATION } from "../../../config/constants";
import Select from "../../../ui/Select";
import SearchInput from "../../../ui/SearchInput";
import Card from "../../../ui/Card";
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronDown,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";

const STATUS_OPTIONS = [
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

// ─── Date Helpers ───────────────────────────────────────
function getDateKey(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  return formatDateOnly(dateKey + "T00:00:00");
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Entry Builder ──────────────────────────────────────
// Collapses repeated rejected attempts by the same person (name + email,
// case- and whitespace-insensitive) within one date group into a single entry.
// Verified logs are never grouped — each stays its own entry. Entries come
// back newest-first, ordered by their latest attempt.
function buildEntries(items) {
  const entries = [];
  const byPerson = new Map();

  items.forEach((log) => {
    if (log.status === "verified") {
      entries.push({
        key: "log-" + log.id,
        latest: log,
        attempts: [log],
        count: 1,
      });
      return;
    }

    const signature =
      (log.name_input || "").toLowerCase().trim() +
      "|" +
      (log.email_input || "").toLowerCase().trim();

    let entry = byPerson.get(signature);
    if (!entry) {
      entry = { key: "grp-" + signature, latest: log, attempts: [], count: 0 };
      byPerson.set(signature, entry);
      entries.push(entry);
    }
    entry.attempts.push(log);
  });

  byPerson.forEach((entry) => {
    entry.attempts.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    entry.latest = entry.attempts[0];
    entry.count = entry.attempts.length;
  });

  return entries.sort(
    (a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at),
  );
}

// ─── Feed Item Component ────────────────────────────────
function FeedItem({ log }) {
  const [expanded, setExpanded] = useState(false);
  const isVerified = log.status === "verified";

  return (
    <div className="group relative">
      {/* Main Row */}
      <div
        className={`flex items-start gap-3 px-4 sm:px-5 py-3.5 transition-colors ${
          log.rejection_reason
            ? "hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer"
            : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
        }`}
        onClick={() => log.rejection_reason && setExpanded(!expanded)}
      >
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isVerified ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <HiOutlineCheckCircle className="w-4.5 h-4.5 text-emerald-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
              <HiOutlineXCircle className="w-4.5 h-4.5 text-red-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {log.name_input}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isVerified
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {isVerified ? "Verified" : "Rejected"}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <HiOutlineIdentification className="w-3 h-3" />
              {log.alumni_id_input}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <HiOutlineEnvelope className="w-3 h-3" />
              {log.email_input}
            </span>
            {log.graduation_year_input && (
              <span className="text-[11px] text-slate-500">
                Batch {log.graduation_year_input}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <HiOutlineGlobeAlt className="w-3 h-3" />
              {log.ip_address}
            </span>
          </div>

          {/* Rejection Reason Preview (collapsed) */}
          {log.rejection_reason && !expanded && (
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-[11px] text-red-400/70 truncate max-w-[300px]">
                {log.rejection_reason}
              </span>
              <HiOutlineChevronDown className="w-3 h-3 text-red-400/50 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Time */}
        <div className="flex-shrink-0 text-right">
          <span className="text-[11px] text-slate-500 font-medium">
            {formatTime(log.created_at)}
          </span>
        </div>
      </div>

      {/* Expanded Rejection Reason */}
      {log.rejection_reason && expanded && (
        <div className="mx-4 sm:mx-5 ml-[60px] sm:ml-[68px] mb-3">
          <div className="bg-red-500/[0.06] border border-red-500/10 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-red-400/60 uppercase tracking-wider mb-1">
              Rejection Reason
            </p>
            <p className="text-[13px] text-red-700 dark:text-red-300 leading-relaxed">
              {log.rejection_reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Grouped Rejection Component ────────────────────────
// Rendered only when a person has more than one failed attempt in the same
// day; a single attempt still renders through FeedItem, unchanged.
function GroupedFeedItem({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const latest = entry.latest;

  return (
    <div className="group relative">
      {/* Main Row */}
      <div
        className="flex items-start gap-3 px-4 sm:px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
            <HiOutlineXCircle className="w-4.5 h-4.5 text-red-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {latest.name_input}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
              Rejected
            </span>
            <span className="bg-amber-500/15 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {entry.count} attempts
            </span>
          </div>

          {/* Meta Info — the alumni ID and IP differ per attempt, so they live
              in the expanded sub-rows instead of here. */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <HiOutlineEnvelope className="w-3 h-3" />
              {latest.email_input}
            </span>
            {latest.graduation_year_input && (
              <span className="text-[11px] text-slate-500">
                Batch {latest.graduation_year_input}
              </span>
            )}
          </div>

          {/* Latest Rejection Reason Preview (collapsed) */}
          {latest.rejection_reason && !expanded && (
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-[11px] text-red-400/70 truncate max-w-[300px]">
                {latest.rejection_reason}
              </span>
            </div>
          )}
        </div>

        {/* Time + Chevron */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium">
            {formatTime(latest.created_at)}
          </span>
          <HiOutlineChevronDown
            className={`w-3.5 h-3.5 text-red-400/50 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded — one sub-row per attempt */}
      {expanded && (
        <div className="mx-4 sm:mx-5 ml-[60px] sm:ml-[68px] mb-3 pl-3 border-l-2 border-red-500/20 space-y-2">
          {entry.attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="bg-red-500/[0.06] border border-red-500/10 rounded-xl px-4 py-2.5"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {formatTime(attempt.created_at)}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <HiOutlineIdentification className="w-3 h-3" />
                  {attempt.alumni_id_input}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <HiOutlineGlobeAlt className="w-3 h-3" />
                  {attempt.ip_address}
                </span>
              </div>
              <p className="text-[12px] text-red-700 dark:text-red-300 leading-relaxed mt-1">
                {attempt.rejection_reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────
export default function VerificationLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [page, setPage] = useState(1);

  // ─── Fetch Logs ──────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: PAGINATION.LOGS_PER_PAGE,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...periodToDateParams(periodFilter),
      };
      const res = await adminApi.getVerificationLogs(params);
      setLogs(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load verification logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, periodFilter, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, periodFilter]);

  // ─── Group Logs by Date ──────────────────────────────
  const groupedLogs = useMemo(() => {
    const groups = {};

    logs.forEach((log) => {
      const key = getDateKey(log.created_at);
      if (!groups[key]) {
        groups[key] = { dateKey: key, items: [], verified: 0, rejected: 0 };
      }
      groups[key].items.push(log);
      if (log.status === "verified") {
        groups[key].verified++;
      } else {
        groups[key].rejected++;
      }
    });

    // Repeat failed attempts by the same person collapse within their day;
    // the per-day verified/rejected counts still reflect raw attempts.
    return Object.values(groups)
      .map((group) => ({ ...group, entries: buildEntries(group.items) }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [logs]);

  return (
    <>
      <div className="max-w-[900px] mx-auto">
        {/* ─── Page Header ───────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Alumni registration verification activity
          </p>
        </div>

        {/* ─── Filters ──────────────────────────────── */}
        <Card padding={false} className="p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              className="flex-1"
              onDebouncedChange={setSearch}
              placeholder="Search by name or email..."
            />
            <Select
              tone="dark"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Status"
              options={STATUS_OPTIONS}
            />
            <Select
              tone="dark"
              className="min-w-[140px]"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              placeholder="All Time"
              options={PERIOD_OPTIONS}
            />
          </div>
        </Card>

        {/* ─── Activity Feed ────────────────────────── */}
        {loading ? (
          <Card className="p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-gold-500 mb-3" />
              <p className="text-sm text-slate-500">Loading activity...</p>
            </div>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="p-16">
            <div className="flex flex-col items-center justify-center text-center">
              <HiOutlineClipboardDocumentCheck className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
                No verification activity
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || statusFilter || periodFilter
                  ? "Try adjusting your filters."
                  : "No registration attempts have been recorded yet."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedLogs.map((group) => (
              <Card key={group.dateKey} padding={false} className="overflow-hidden">
                {/* Date Header */}
                <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">
                      {formatDateLabel(group.dateKey)}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatDateOnly(group.dateKey + "T00:00:00")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.verified > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <HiOutlineCheckCircle className="w-3 h-3" />
                        {group.verified}
                      </span>
                    )}
                    {group.rejected > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <HiOutlineXCircle className="w-3 h-3" />
                        {group.rejected}
                      </span>
                    )}
                  </div>
                </div>

                {/* Feed Items */}
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {group.entries.map((entry) =>
                    entry.count > 1 ? (
                      <GroupedFeedItem key={entry.key} entry={entry} />
                    ) : (
                      <FeedItem key={entry.key} log={entry.latest} />
                    ),
                  )}
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {meta && (
              <Card padding={false} className="px-4 py-3">
                <Pagination meta={meta} onPageChange={setPage} />
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
