import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import CreateDepartmentModal from "./CreateDepartmentModal";
import EditDepartmentModal from "./EditDepartmentModal";
import { useToast } from "../../../hooks/useToast";
import { EDUCATION_LEVEL_LABELS } from "../../../config/departmentOptions";
import { PAGINATION } from "../../../config/constants";
import Button from "../../../ui/Button";
import Select from "../../../ui/Select";
import SearchInput from "../../../ui/SearchInput";
import Card from "../../../ui/Card";
import DataTable from "../../../ui/DataTable";
import {
  HiOutlinePlus,
  HiOutlineAcademicCap,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const LEVEL_OPTIONS = Object.entries(EDUCATION_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export default function DepartmentsListPage() {
  const toast = useToast();
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

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(levelFilter && { education_level: levelFilter }),
      };
      const res = await adminApi.getDepartments(params);
      setDepartments(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, levelFilter, toast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, levelFilter]);

  const handleDelete = async () => {
    if (!confirmDelete.dept) return;
    setActionLoading(true);
    try {
      await adminApi.deleteDepartment(confirmDelete.dept.id);
      setConfirmDelete({ open: false, dept: null });
      toast.success("Department deleted.");
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete department.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    const newStatus = dept.status === "active" ? "inactive" : "active";
    try {
      await adminApi.updateDepartmentStatus(dept.id, newStatus);
      toast.success("Status updated.");
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Department",
      render: (dept) => (
        <Link
          to={`/admin/departments/${dept.id}`}
          className="font-medium text-slate-200 hover:text-gold-500 transition-colors"
        >
          {dept.name}
        </Link>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (dept) => (
        <span className="font-mono text-[11px] bg-white/[0.06] text-slate-400 px-2 py-1 rounded-lg border border-white/[0.06]">
          {dept.code}
        </span>
      ),
    },
    {
      key: "education_level",
      header: "Level",
      render: (dept) => (
        <span className="text-xs font-medium text-slate-400">
          {EDUCATION_LEVEL_LABELS[dept.education_level] ||
            dept.education_level ||
            "College"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (dept) => (
        <button onClick={() => handleToggleStatus(dept)} title="Click to toggle status">
          <StatusBadge
            status={dept.status}
            label={dept.status_label}
            className="cursor-pointer hover:opacity-80"
          />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (dept) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditDept(dept)}
            className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
            title="Edit"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete({ open: true, dept })}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const hasFilters = search || statusFilter || levelFilter;

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Departments</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage academic departments and programs
            </p>
          </div>
          <Button icon={HiOutlinePlus} onClick={() => setShowCreate(true)}>
            Add Department
          </Button>
        </div>

        {/* Filters */}
        <Card padding={false} className="p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              className="flex-1"
              onDebouncedChange={setSearch}
              placeholder="Search by name or code..."
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
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              placeholder="All Levels"
              options={LEVEL_OPTIONS}
            />
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={departments}
          loading={loading}
          keyField="id"
          meta={meta}
          onPageChange={setPage}
          loadingLabel="Loading departments..."
          empty={{
            icon: HiOutlineAcademicCap,
            title: "No departments found",
            description: hasFilters
              ? "Try adjusting your filters."
              : "No departments have been created yet.",
          }}
        />

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
    </>
  );
}
