import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import { useToast } from "../../../hooks/useToast";
import { formatDate, storageUrl } from "../../../utils/formatters";
import { PAGINATION } from "../../../config/constants";
import Select from "../../../ui/Select";
import SearchInput from "../../../ui/SearchInput";
import Card from "../../../ui/Card";
import DataTable from "../../../ui/DataTable";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

const EMPLOYER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
];

export default function EmployerListPage() {
  const toast = useToast();
  const [employers, setEmployers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEmployers({
        page,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      setEmployers(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load employers.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const columns = [
    {
      key: "company",
      header: "Company",
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-white/[0.08] overflow-hidden">
            {e.company_logo ? (
              <img
                src={storageUrl(e.company_logo)}
                alt={e.company_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <HiOutlineBuildingOffice2 className="w-4 h-4 text-gold-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-200 truncate">
              {e.company_name}
            </p>
            <p className="text-xs text-slate-500 truncate">{e.company_email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cellClassName: "text-xs text-slate-400",
      render: (e) => (
        <>
          <p>{e.hr_full_name || "—"}</p>
          <p className="text-slate-500">{e.hr_position}</p>
        </>
      ),
    },
    {
      key: "jobs_count",
      header: "Jobs",
      cellClassName: "text-slate-300",
      render: (e) => e.jobs_count ?? 0,
    },
    {
      key: "verified",
      header: "Verified",
      render: (e) =>
        e.is_verified ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <HiOutlineCheckBadge className="w-4 h-4" /> Verified
          </span>
        ) : (
          <span className="text-xs text-slate-500">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => <StatusBadge status={e.status} label={e.status} />,
    },
    {
      key: "created_at",
      header: "Registered",
      cellClassName: "text-xs text-slate-500",
      render: (e) => formatDate(e.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (e) => (
        <Link
          to={`/admin/employers/${e.id}`}
          className="text-gold-500 hover:text-gold-300 text-xs font-semibold transition-colors"
        >
          View →
        </Link>
      ),
    },
  ];

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Employers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage HR / employer accounts and their access
          </p>
        </div>

        {/* Filters */}
        <Card padding={false} className="p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              className="flex-1"
              onDebouncedChange={setSearch}
              placeholder="Search by company name or email..."
            />
            <Select
              tone="dark"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Status"
              options={EMPLOYER_STATUSES}
            />
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={employers}
          loading={loading}
          keyField="id"
          meta={meta}
          onPageChange={setPage}
          loadingLabel="Loading employers..."
          empty={{
            icon: HiOutlineBuildingOffice2,
            title: "No employers found",
            description:
              search || statusFilter
                ? "Try adjusting your search or filters."
                : "No employers have registered yet.",
          }}
        />
      </div>
    </>
  );
}
