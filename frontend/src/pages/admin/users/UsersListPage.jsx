import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import CreateUserModal from "./CreateUserModal";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatDate } from "../../../utils/formatters";
import {
  ASSIGNABLE_ROLES,
  USER_STATUSES,
  USER_STATUS_LABELS,
  PAGINATION,
} from "../../../config/constants";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineUsers,
} from "react-icons/hi2";

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PAGINATION.DEFAULT_PER_PAGE);

  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        sort_by: "created_at",
        sort_dir: "desc",
      };
      const res = await adminApi.getUsers(params);
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleUserCreated = () => {
    setShowCreateModal(false);
    fetchUsers();
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage system users and their roles
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all shadow-lg shadow-[#c8a84e]/20"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
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

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1a2e5a] text-slate-300">
                All Roles
              </option>
              {ASSIGNABLE_ROLES.map((r) => (
                <option
                  key={r.value}
                  value={r.value}
                  className="bg-[#1a2e5a] text-slate-300"
                >
                  {r.label}
                </option>
              ))}
              <option value="admin" className="bg-[#1a2e5a] text-slate-300">
                Administrator
              </option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1a2e5a] text-slate-300">
                All Status
              </option>
              {Object.entries(USER_STATUS_LABELS).map(([val, label]) => (
                <option
                  key={val}
                  value={val}
                  className="bg-[#1a2e5a] text-slate-300"
                >
                  {label}
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
              <p className="text-sm text-slate-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineUsers className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No users found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || roleFilter || statusFilter
                  ? "Try adjusting your search or filters."
                  : "No users have been created yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="text-right py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {users.map((user) => (
                    <tr
                      key={user.uuid}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a2e5a] to-[#2a4177] flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
                            <span className="text-[10px] font-bold text-[#c8a84e]">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </span>
                          </div>
                          <span className="font-medium text-slate-200">
                            {user.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {user.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={user.role}
                          label={user.role_label}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={user.status}
                          label={user.status_label}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {user.last_login_at
                          ? formatDate(user.last_login_at)
                          : "Never"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/users/${user.uuid}`}
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

          {/* Pagination */}
          {meta && (
            <div className="px-4 pb-4">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleUserCreated}
          />
        )}
      </div>
    </div>
  );
}
