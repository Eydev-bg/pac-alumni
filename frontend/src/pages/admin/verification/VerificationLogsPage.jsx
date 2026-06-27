// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/verification/VerificationLogsPage.jsx
//  STYLE: Notification feed — grouped by date, latest on top
//  FEATURE: Expandable rejection reason per item
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from "react";
import adminApi from "../../../api/adminApi";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronDown,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";

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

  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
            ? "hover:bg-white/[0.03] cursor-pointer"
            : "hover:bg-white/[0.02]"
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
            <span className="text-sm font-semibold text-slate-200">
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
            <p className="text-[13px] text-red-300 leading-relaxed">
              {log.rejection_reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────
export default function VerificationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  // ─── Period → Date Params ────────────────────────────
  const getDateParams = () => {
    if (!periodFilter) return {};
    const now = new Date();
    let dateFrom = "";
    if (periodFilter === "today") {
      dateFrom = now.toISOString().slice(0, 10);
    } else if (periodFilter === "7days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      dateFrom = d.toISOString().slice(0, 10);
    } else if (periodFilter === "30days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      dateFrom = d.toISOString().slice(0, 10);
    } else if (periodFilter === "thismonth") {
      dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    }
    return dateFrom ? { date_from: dateFrom } : {};
  };

  // ─── Fetch Logs ──────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...getDateParams(),
      };
      const res = await adminApi.getVerificationLogs(params);
      setLogs(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch verification logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, periodFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, periodFilter]);

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

    return Object.values(groups).sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey),
    );
  }, [logs]);

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[900px] mx-auto">
        {/* ─── Page Header ───────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Verification</h1>
          <p className="text-sm text-slate-400 mt-1">
            Alumni registration verification activity
          </p>
        </div>

        {/* ─── Filters ──────────────────────────────── */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1a2e5a] text-slate-300">
                All Status
              </option>
              <option value="verified" className="bg-[#1a2e5a] text-slate-300">
                Verified
              </option>
              <option value="rejected" className="bg-[#1a2e5a] text-slate-300">
                Rejected
              </option>
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer min-w-[140px]"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1a2e5a] text-slate-300">
                All Time
              </option>
              <option value="today" className="bg-[#1a2e5a] text-slate-300">
                Today
              </option>
              <option value="7days" className="bg-[#1a2e5a] text-slate-300">
                Last 7 Days
              </option>
              <option value="30days" className="bg-[#1a2e5a] text-slate-300">
                Last 30 Days
              </option>
              <option value="thismonth" className="bg-[#1a2e5a] text-slate-300">
                This Month
              </option>
            </select>
          </div>
        </div>

        {/* ─── Activity Feed ────────────────────────── */}
        {loading ? (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading activity...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-16">
            <div className="flex flex-col items-center justify-center text-center">
              <HiOutlineClipboardDocumentCheck className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No verification activity
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || statusFilter || periodFilter
                  ? "Try adjusting your filters."
                  : "No registration attempts have been recorded yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedLogs.map((group) => (
              <div
                key={group.dateKey}
                className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden"
              >
                {/* Date Header */}
                <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[13px] font-bold text-white">
                      {formatDateLabel(group.dateKey)}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(group.dateKey + "T00:00:00").toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
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
                <div className="divide-y divide-white/[0.04]">
                  {group.items.map((log) => (
                    <FeedItem key={log.id} log={log} />
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {meta && (
              <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] px-4 py-3">
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
