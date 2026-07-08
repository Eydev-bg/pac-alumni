import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatDate, storageUrl } from "../../../utils/formatters";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBuildingOffice2,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

const EMPLOYER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
];

export default function EmployerListPage() {
  const [employers, setEmployers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEmployers({
        page,
        per_page: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
      });
      setEmployers(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch employers:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Employers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage HR / employer accounts and their access
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
                placeholder="Search by company name or email..."
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
              {EMPLOYER_STATUSES.map((s) => (
                <option
                  key={s.value}
                  value={s.value}
                  className="bg-[#1a2e5a] text-slate-300"
                >
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading employers...</p>
            </div>
          ) : employers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineBuildingOffice2 className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No employers found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || statusFilter
                  ? "Try adjusting your search or filters."
                  : "No employers have registered yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Company", "Contact", "Jobs", "Verified", "Status", "Registered"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                    <th className="text-right py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {employers.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-white/[0.08] overflow-hidden">
                            {e.company_logo ? (
                              <img
                                src={storageUrl(e.company_logo)}
                                alt={e.company_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <HiOutlineBuildingOffice2 className="w-4 h-4 text-[#c8a84e]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 truncate">
                              {e.company_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {e.company_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <p>{e.hr_full_name || "—"}</p>
                        <p className="text-slate-500">{e.hr_position}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {e.jobs_count ?? 0}
                      </td>
                      <td className="py-3.5 px-4">
                        {e.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <HiOutlineCheckBadge className="w-4 h-4" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={e.status} label={e.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(e.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/employers/${e.id}`}
                          className="text-[#c8a84e] hover:text-[#e0c76a] text-xs font-semibold transition-colors"
                        >
                          View →
                        </Link>
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
