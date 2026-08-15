import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../hooks/useToast";
import { formatDate, storageUrl } from "../../../utils/formatters";
import {
  JOB_STATUSES,
  JOB_SOURCES,
  STATUS_BADGE_COLORS,
} from "../../../config/jobOptions";
import { PAGINATION } from "../../../config/constants";
import Button from "../../../ui/Button";
import SearchInput from "../../../ui/SearchInput";
import Card from "../../../ui/Card";
import DataTable from "../../../ui/DataTable";
import {
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArchiveBox,
  HiOutlineMapPin,
  HiOutlineBookmark,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  ...JOB_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

const SOURCE_FILTERS = [
  { value: "", label: "All Sources" },
  ...JOB_SOURCES.map((s) => ({ value: s.value, label: `${s.label}-posted` })),
];

// Who authored the posting — alumni-posted jobs also name the poster.
function SourceBadge({ source, posterName }) {
  const isAlumni = source === "alumni";
  return (
    <span
      title={isAlumni && posterName ? `Posted by ${posterName}` : "Posted by an admin"}
      className={`inline-flex max-w-[160px] items-center rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${
        isAlumni
          ? "bg-blue-500/15 text-blue-300"
          : "bg-gold-500/15 text-gold-400"
      }`}
    >
      <span className="truncate">
        {isAlumni ? `Alumni: ${posterName || "Unknown"}` : "Admin"}
      </span>
    </span>
  );
}

function StatusTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
        active
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 dark:from-gold-500 dark:to-gold-700 dark:shadow-gold-500/20"
          : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 dark:bg-white/[0.06] dark:text-slate-400 dark:border-white/[0.08] dark:hover:bg-white/[0.1]"
      }`}
    >
      {label}
    </button>
  );
}

function IconButton({ title, onClick, disabled, danger, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
        danger
          ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10 dark:text-slate-400"
          : "text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-gold-500 dark:hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

// Company logo thumbnail with a building-icon fallback.
function CompanyLogo({ logo, name }) {
  if (logo) {
    return (
      <img
        src={storageUrl(logo)}
        alt={name}
        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-white/[0.08] flex-shrink-0"
      />
    );
  }
  return (
    <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 dark:bg-white/[0.06] dark:border-white/[0.08] flex items-center justify-center flex-shrink-0">
      <HiOutlineBuildingOffice2 className="w-4 h-4 text-slate-500" />
    </span>
  );
}

export default function JobPostingListPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);

  const [actionId, setActionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getJobPostings({
        page,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
        ...(search && { search }),
        ...(statusFilter !== "" && { status: statusFilter }),
        ...(sourceFilter !== "" && { source: sourceFilter }),
      });
      setItems(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load job postings.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sourceFilter, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter]);

  // Optimistic-ish action helper — runs the API call, then refreshes the row.
  const runAction = async (id, fn) => {
    setActionId(id);
    try {
      const res = await fn(id);
      const updated = res.data.data;
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteJobPosting(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Job posting deleted.");
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete job posting.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "company",
      header: "Company",
      cellClassName: "whitespace-nowrap",
      render: (a) => (
        <div className="flex items-center gap-2.5">
          {a.is_pinned && (
            <HiOutlineBookmark
              className="w-4 h-4 text-blue-600 dark:text-gold-500 flex-shrink-0"
              title="Pinned"
            />
          )}
          <CompanyLogo logo={a.company_logo} name={a.company_name} />
          <span className="font-medium text-slate-700 dark:text-slate-200 max-w-[180px] truncate whitespace-nowrap">
            {a.company_name}
          </span>
        </div>
      ),
    },
    {
      key: "position",
      header: "Position",
      cellClassName: "whitespace-nowrap",
      render: (a) => (
        <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[180px] truncate inline-block whitespace-nowrap">
          {a.job_position}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      cellClassName: "whitespace-nowrap",
      render: (a) => (
        <span className="inline-flex items-center gap-1.5 max-w-[160px] text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
          <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="truncate">{a.location}</span>
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      cellClassName: "whitespace-nowrap",
      render: (a) => (
        <SourceBadge source={a.source} posterName={a.posted_by_alumni_name} />
      ),
    },
    {
      key: "employment_type",
      header: "Employment Type",
      cellClassName: "whitespace-nowrap",
      render: (a) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {a.employment_type?.label}
        </span>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      cellClassName: "text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap",
      render: (a) =>
        a.application_deadline ? (
          formatDate(a.application_deadline)
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_BADGE_COLORS[a.status?.value] || STATUS_BADGE_COLORS.draft
          }`}
        >
          {a.status?.label}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Posted",
      cellClassName: "text-xs text-slate-500 whitespace-nowrap",
      render: (a) => formatDate(a.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => {
        const busy = actionId === a.id;
        return (
          <div className="flex items-center justify-end gap-1">
            {a.status?.value === "draft" && (
              <IconButton
                title="Publish"
                disabled={busy}
                onClick={() => runAction(a.id, adminApi.publishJobPosting)}
              >
                <HiOutlineEye className="w-4 h-4" />
              </IconButton>
            )}
            {a.status?.value === "active" && (
              <IconButton
                title="Mark Expired"
                disabled={busy}
                onClick={() => runAction(a.id, adminApi.markJobExpired)}
              >
                <HiOutlineArchiveBox className="w-4 h-4" />
              </IconButton>
            )}
            <Link
              to={`/admin/jobs/${a.id}/edit`}
              title="View / Edit"
              className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-gold-500 dark:hover:bg-white/[0.06] transition-colors"
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
            </Link>
            <IconButton
              title="Delete"
              disabled={busy}
              danger
              onClick={() => setDeleteTarget(a)}
            >
              <HiOutlineTrash className="w-4 h-4" />
            </IconButton>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Job Postings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Post job opportunities on behalf of partner companies
            </p>
          </div>
          <Button as={Link} to="/admin/jobs/new" icon={HiOutlinePlus}>
            New Job
          </Button>
        </div>

        {/* Status quick tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_FILTERS.map((s) => (
            <StatusTab
              key={s.label}
              label={s.label}
              active={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
            />
          ))}
        </div>

        {/* Search + source filter */}
        <Card padding={false} className="p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                onDebouncedChange={setSearch}
                placeholder="Search by company, position, or location..."
              />
            </div>
            <select
              aria-label="Filter by source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-colors dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-200 dark:focus:ring-gold-500/40 dark:focus:border-gold-500/30"
            >
              {SOURCE_FILTERS.map((s) => (
                <option
                  key={s.value}
                  value={s.value}
                  className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300"
                >
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          keyField="id"
          meta={meta}
          onPageChange={setPage}
          loadingLabel="Loading job postings..."
          empty={{
            icon: HiOutlineBriefcase,
            title: "No job postings found",
            description:
              search || statusFilter !== "" || sourceFilter !== ""
                ? "Try adjusting your search or filters."
                : "Create your first job posting to share opportunities with alumni.",
          }}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Job Posting"
        message={`Delete "${deleteTarget?.job_position} at ${deleteTarget?.company_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
