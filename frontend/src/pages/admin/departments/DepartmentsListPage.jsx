// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/departments/DepartmentsListPage.jsx
//  FIXED: Removed Type + Graduates columns
//  FIXED: Replaced Board filter with Education Level filter
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import CreateDepartmentModal from "./CreateDepartmentModal";
import EditDepartmentModal from "./EditDepartmentModal";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineAcademicCap,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

const educationLevelLabels = {
  college: "College",
  elementary: "Elementary",
  jhs: "Junior High School",
  shs: "Senior High School",
};

export default function DepartmentsListPage() {
  const [departments, setDepartments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    dept: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(levelFilter && { education_level: levelFilter }),
      };
      const res = await adminApi.getDepartments(params);
      setDepartments(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, levelFilter]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, levelFilter]);

  const handleDelete = async () => {
    if (!confirmDelete.dept) return;
    setActionLoading(true);
    try {
      await adminApi.deleteDepartment(confirmDelete.dept.id);
      setConfirmDelete({ open: false, dept: null });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete department.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    const newStatus = dept.status === "active" ? "inactive" : "active";
    try {
      await adminApi.updateDepartmentStatus(dept.id, newStatus);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Departments</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage academic departments and programs
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all shadow-lg shadow-[#c8a84e]/20"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Department
          </button>
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
                placeholder="Search by name or code..."
                className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="college">College</option>
              <option value="elementary">Elementary</option>
              <option value="jhs">Junior High School</option>
              <option value="shs">Senior High School</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading departments...</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineAcademicCap className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No departments found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || statusFilter || levelFilter
                  ? "Try adjusting your filters."
                  : "No departments have been created yet."}
              </p>
              {!search && !statusFilter && !levelFilter && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 text-sm text-[#c8a84e] hover:text-[#e0c76a] font-medium transition-colors"
                >
                  Create your first department
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Department
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Code
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Level
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {departments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/departments/${dept.id}`}
                          className="font-medium text-slate-200 hover:text-[#c8a84e] transition-colors"
                        >
                          {dept.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] bg-white/[0.06] text-slate-400 px-2 py-1 rounded-lg border border-white/[0.06]">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium text-slate-400">
                          {educationLevelLabels[dept.education_level] ||
                            dept.education_level ||
                            "College"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(dept)}
                          title="Click to toggle status"
                        >
                          <StatusBadge
                            status={dept.status}
                            label={dept.status_label}
                            className="cursor-pointer hover:opacity-80"
                          />
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditDept(dept)}
                            className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({ open: true, dept })
                            }
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
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

        {/* Modals */}
        {showCreate && (
          <CreateDepartmentModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              fetchDepartments();
            }}
          />
        )}
        {editDept && (
          <EditDepartmentModal
            department={editDept}
            onClose={() => setEditDept(null)}
            onUpdated={() => {
              setEditDept(null);
              fetchDepartments();
            }}
          />
        )}
        <ConfirmDialog
          open={confirmDelete.open}
          title="Delete Department"
          message={`Are you sure you want to delete "${confirmDelete.dept?.name}"? This action cannot be undone. Departments with existing graduates cannot be deleted.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete({ open: false, dept: null })}
        />
      </div>
    </div>
  );
}
