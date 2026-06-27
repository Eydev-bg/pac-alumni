import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatDate, truncate } from "../../../utils/formatters";
import { LOGIN_ATTEMPT_STATUSES } from "../../../config/constants";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

export default function LoginLogsPage() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

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
      const res = await adminApi.getLoginLogs(params);
      setLogs(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch login logs:", err);
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

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Login Activity Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor all login attempts for security and accountability
          </p>
        </div>

        {/* Filters */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
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
              <option value="success" className="bg-[#1a2e5a] text-slate-300">
                Success
              </option>
              <option value="failed" className="bg-[#1a2e5a] text-slate-300">
                Failed
              </option>
              <option value="blocked" className="bg-[#1a2e5a] text-slate-300">
                Blocked
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

        {/* Table */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineShieldCheck className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No login activity
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                No login attempts match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Device
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Date/Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {log.email_attempted}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {log.user?.full_name || (
                          <span className="text-slate-600 italic">Unknown</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {log.ip_address}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {truncate(log.user_agent, 40)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta && (
            <div className="px-4 pb-4">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
