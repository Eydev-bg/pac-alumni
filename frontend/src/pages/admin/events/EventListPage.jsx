import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../utils/formatters";
import {
  TARGET_TYPE_LABELS,
  EDUCATION_LEVEL_LABELS,
} from "../../../config/eventOptions";
import { PAGINATION } from "../../../config/constants";
import Button from "../../../ui/Button";
import SearchInput from "../../../ui/SearchInput";
import Card from "../../../ui/Card";
import DataTable from "../../../ui/DataTable";
import {
  HiOutlineCalendarDays,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArchiveBox,
  HiOutlineMapPin,
  HiOutlineBookmark,
} from "react-icons/hi2";

const PUBLISH_FILTERS = [
  { value: "", label: "All" },
  { value: "1", label: "Published" },
  { value: "0", label: "Drafts" },
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

function IconButton({ title, onClick, disabled, active, danger, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
        active
          ? "text-gold-500 bg-gold-500/10"
          : danger
            ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            : "text-slate-400 hover:text-gold-500 hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

export default function EventListPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [publishFilter, setPublishFilter] = useState("");
  const [page, setPage] = useState(1);

  const [actionId, setActionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEvents({
        page,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
        ...(search && { search }),
        ...(publishFilter !== "" && { is_published: publishFilter }),
      });
      setItems(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [page, search, publishFilter, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [search, publishFilter]);

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
      await adminApi.deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Event deleted.");
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete event.");
    } finally {
      setDeleting(false);
    }
  };

  const targetLabel = (a) => {
    if (a.target_type === "all") return "Everyone";
    const type = TARGET_TYPE_LABELS[a.target_type] || a.target_type;
    let value = a.target_value;
    if (a.target_type === "education_level") {
      value = EDUCATION_LEVEL_LABELS[a.target_value] || a.target_value;
    }
    return `${type}: ${value}`;
  };

  const statusOf = (a) => {
    if (a.archived_at)
      return { label: "Archived", cls: "bg-slate-500/15 text-slate-300" };
    if (a.is_published)
      return { label: "Published", cls: "bg-emerald-500/15 text-emerald-400" };
    return { label: "Draft", cls: "bg-amber-500/15 text-amber-400" };
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (a) => (
        <div className="flex items-center gap-2">
          {a.is_pinned && (
            <HiOutlineBookmark
              className="w-4 h-4 text-gold-500 flex-shrink-0"
              title="Pinned"
            />
          )}
          <span className="font-medium text-slate-200">{a.title}</span>
        </div>
      ),
    },
    {
      key: "audience",
      header: "Audience",
      render: (a) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-500" />
          {targetLabel(a)}
        </span>
      ),
    },
    {
      key: "when",
      header: "When",
      cellClassName: "text-xs text-slate-400",
      render: (a) => (
        <span>
          {formatDate(a.start_datetime)} &rarr; {formatDate(a.end_datetime)}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      cellClassName: "text-slate-300",
      render: (a) => a.location,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const status = statusOf(a);
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}
          >
            {status.label}
          </span>
        );
      },
    },
    {
      key: "rsvps",
      header: "RSVPs",
      cellClassName: "text-xs text-slate-400",
      render: (a) =>
        `${a.going_count ?? 0} going / ${a.interested_count ?? 0} interested`,
    },
    {
      key: "created_at",
      header: "Created",
      cellClassName: "text-xs text-slate-500",
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
            <IconButton
              title={a.is_pinned ? "Unpin" : "Pin"}
              active={a.is_pinned}
              disabled={busy}
              onClick={() => runAction(a.id, adminApi.toggleEventPin)}
            >
              <HiOutlineBookmark className="w-4 h-4" />
            </IconButton>
            {a.is_published && !a.archived_at ? (
              <IconButton
                title="Archive"
                disabled={busy}
                onClick={() => runAction(a.id, adminApi.archiveEvent)}
              >
                <HiOutlineArchiveBox className="w-4 h-4" />
              </IconButton>
            ) : (
              <IconButton
                title="Publish"
                disabled={busy}
                onClick={() => runAction(a.id, adminApi.publishEvent)}
              >
                <HiOutlineEye className="w-4 h-4" />
              </IconButton>
            )}
            <Link
              to={`/admin/events/${a.id}/edit`}
              title="Edit"
              className="p-2 rounded-lg text-slate-400 hover:text-gold-500 hover:bg-white/[0.06] transition-colors"
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
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create and broadcast targeted events to alumni
            </p>
          </div>
          <Button as={Link} to="/admin/events/new" icon={HiOutlinePlus}>
            New Event
          </Button>
        </div>

        {/* Publish quick tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PUBLISH_FILTERS.map((s) => (
            <StatusTab
              key={s.label}
              label={s.label}
              active={publishFilter === s.value}
              onClick={() => setPublishFilter(s.value)}
            />
          ))}
        </div>

        {/* Search */}
        <Card padding={false} className="p-4 mb-4">
          <SearchInput
            onDebouncedChange={setSearch}
            placeholder="Search by title or content..."
          />
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          keyField="id"
          meta={meta}
          onPageChange={setPage}
          loadingLabel="Loading events..."
          empty={{
            icon: HiOutlineCalendarDays,
            title: "No events found",
            description:
              search || publishFilter !== ""
                ? "Try adjusting your search or filters."
                : "Create your first event to reach your alumni.",
          }}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
