// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/job-posts/JobPostsPage.jsx
//  Features 47-49: Job post moderation
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatDate } from "../../../utils/formatters";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBriefcase,
  HiOutlineTrash,
  HiOutlineFlag,
} from "react-icons/hi2";

const selectClass =
  "px-3 py-2 bg-[#1a2e5a] border border-white/[0.1] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer";
const optionClass = "bg-[#1a2e5a] text-slate-300";

export default function JobPostsPage() {
  const [tab, setTab] = useState("all");
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    id: null,
    title: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tab === "reported") {
        res = await adminApi.getReportedJobPosts({ page, per_page: 15 });
      } else {
        res = await adminApi.getJobPosts({
          page,
          per_page: 15,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(statusFilter && { status: statusFilter }),
        });
      }
      setPosts(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await adminApi.deleteJobPost(confirmDelete.id);
      setConfirmDelete({ open: false, id: null, title: "" });
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete.");
    } finally {
      setActionLoading(false);
    }
  };

  const statusMap = {
    active: "success",
    filled: "blocked",
    expired: "blocked",
    deleted: "failed",
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Job Post Moderation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor and moderate job posts from alumni
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              tab === "all"
                ? "bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white shadow-lg shadow-[#c8a84e]/20"
                : "bg-white/[0.06] text-slate-400 border border-white/[0.08] hover:bg-white/[0.1]"
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setTab("reported")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              tab === "reported"
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-white/[0.06] text-slate-400 border border-white/[0.08] hover:bg-white/[0.1]"
            }`}
          >
            <HiOutlineFlag className="w-3.5 h-3.5" /> Reported
          </button>
        </div>

        {/* Filters (all tab only) */}
        {tab === "all" && (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or company..."
                  className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
                style={{ colorScheme: "dark" }}
              >
                <option value="" className={optionClass}>
                  All Status
                </option>
                <option value="active" className={optionClass}>
                  Active
                </option>
                <option value="filled" className={optionClass}>
                  Filled
                </option>
                <option value="expired" className={optionClass}>
                  Expired
                </option>
                <option value="deleted" className={optionClass}>
                  Deleted
                </option>
              </select>
            </div>
          </div>
        )}

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
                {tab === "reported" ? "No reported posts" : "No job posts"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {tab === "reported"
                  ? "No job posts have been reported."
                  : "No job posts match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Company
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Posted By
                    </th>
                    {tab === "reported" && (
                      <th className="text-center py-3.5 px-4 font-semibold text-red-400 text-[11px] uppercase tracking-wider">
                        Reports
                      </th>
                    )}
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Date
                    </th>
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
                        {p.job_title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {p.company_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs capitalize text-slate-400">
                          {p.job_type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {p.posted_by?.full_name || (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      {tab === "reported" && (
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg text-xs">
                            {p.reports_count}
                          </span>
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={statusMap[p.status] || "default"}
                          label={p.status}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              open: true,
                              id: p.id,
                              title: p.job_title,
                            })
                          }
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
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

        <ConfirmDialog
          open={confirmDelete.open}
          title="Delete Job Post"
          message={`Delete "${confirmDelete.title}"? This will remove it from the system.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() =>
            setConfirmDelete({ open: false, id: null, title: "" })
          }
        />
      </div>
    </div>
  );
}
