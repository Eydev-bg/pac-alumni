import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../utils/formatters";
import { JOB_TYPE_LABELS } from "../../../config/jobOptions";
import { PAGINATION } from "../../../config/constants";
import SearchInput from "../../../ui/SearchInput";
import Card from "../../../ui/Card";
import DataTable from "../../../ui/DataTable";
import { HiOutlineBriefcase } from "react-icons/hi2";

const JOB_STATUSES = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function StatusTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
        active
          ? "bg-gradient-to-r from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/20"
          : "bg-white/[0.06] text-slate-400 border border-white/[0.08] hover:bg-white/[0.1]"
      }`}
    >
      {label}
    </button>
  );
}

export default function JobModerationListPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getJobPosts({
        page,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      setPosts(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load job posts.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const columns = [
    {
      key: "title",
      header: "Job Title",
      cellClassName: "font-medium text-slate-200",
    },
    {
      key: "company",
      header: "Company",
      cellClassName: "text-xs text-slate-400",
      render: (p) => p.company_name || p.employer?.company_name || "—",
    },
    {
      key: "job_type",
      header: "Type",
      cellClassName: "text-xs text-slate-400",
      render: (p) => JOB_TYPE_LABELS[p.job_type] || p.job_type,
    },
    {
      key: "applications_count",
      header: "Applicants",
      cellClassName: "text-slate-300",
      render: (p) => p.applications_count ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge status={p.status} label={p.status} />,
    },
    {
      key: "created_at",
      header: "Submitted",
      cellClassName: "text-xs text-slate-500",
      render: (p) => formatDate(p.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => (
        <Link
          to={`/admin/job-posts/${p.id}`}
          className="text-gold-500 hover:text-gold-300 text-xs font-semibold transition-colors"
        >
          Review →
        </Link>
      ),
    },
  ];

  return (
    <>
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
        <Card padding={false} className="p-4 mb-4">
          <SearchInput
            onDebouncedChange={setSearch}
            placeholder="Search by job title or company..."
          />
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={posts}
          loading={loading}
          keyField="id"
          meta={meta}
          onPageChange={setPage}
          loadingLabel="Loading job posts..."
          empty={{
            icon: HiOutlineBriefcase,
            title: "No job posts found",
            description:
              search || statusFilter
                ? "Try adjusting your search or filters."
                : "No job posts have been submitted yet.",
          }}
        />
      </div>
    </>
  );
}
