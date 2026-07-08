import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatDate } from "../../../utils/formatters";
import { JOB_TYPE_LABELS } from "../../../config/jobOptions";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBriefcase,
} from "react-icons/hi2";

const JOB_STATUSES = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function JobModerationListPage() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getJobPosts({
        page,
        per_page: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
      });
      setPosts(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch job posts:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Job Moderation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and approve job posts submitted by employers
          </p>
        </div>

        {/* Status quick tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusTab
            label="All"
            active={statusFilter === ""}
            onClick={() => setStatusFilter("")}
          />
          {JOB_STATUSES.map((s) => (
            <StatusTab
              key={s.value}
              label={s.label}
              active={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
            />
          ))}
        </div>

        {/* Search */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or company..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading job posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineBriefcase className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No job posts found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || statusFilter
                  ? "Try adjusting your search or filters."
                  : "No job posts have been submitted yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Job Title", "Company", "Type", "Applicants", "Status", "Submitted"].map(
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
                  {posts.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {p.title}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {p.company_name || p.employer?.company_name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {JOB_TYPE_LABELS[p.job_type] || p.job_type}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {p.applications_count ?? 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} label={p.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/job-posts/${p.id}`}
                          className="text-[#c8a84e] hover:text-[#e0c76a] text-xs font-semibold transition-colors"
                        >
                          Review →
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

function StatusTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
        active
          ? "bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white shadow-lg shadow-[#c8a84e]/20"
          : "bg-white/[0.06] text-slate-400 border border-white/[0.08] hover:bg-white/[0.1]"
      }`}
    >
      {label}
    </button>
  );
}
