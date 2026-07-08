import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatDate } from "../../../utils/formatters";
import { TARGET_TYPE_LABELS, EDUCATION_LEVEL_LABELS } from "../../../config/announcementOptions";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMegaphone,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArchiveBox,
  HiOutlineMapPin,
} from "react-icons/hi2";
import { HiOutlineBookmark } from "react-icons/hi2";

const PUBLISH_FILTERS = [
  { value: "", label: "All" },
  { value: "1", label: "Published" },
  { value: "0", label: "Drafts" },
];

export default function AnnouncementListPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [publishFilter, setPublishFilter] = useState("");
  const [page, setPage] = useState(1);

  const [actionId, setActionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnnouncements({
        page,
        per_page: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(publishFilter !== "" && { is_published: publishFilter }),
      });
      setItems(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, publishFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, publishFilter]);

  // Optimistic-ish action helper — runs the API call, then refreshes the row.
  const runAction = async (id, fn) => {
    setActionId(id);
    try {
      const res = await fn(id);
      const updated = res.data.data;
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteAnnouncement(deleteTarget.id);
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete announcement.");
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
    if (a.archived_at) return { label: "Archived", cls: "bg-slate-500/15 text-slate-300" };
    if (a.is_published) return { label: "Published", cls: "bg-emerald-500/15 text-emerald-400" };
    return { label: "Draft", cls: "bg-amber-500/15 text-amber-400" };
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Announcements</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create and broadcast targeted announcements to alumni
            </p>
          </div>
          <Link
            to="/admin/announcements/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] shadow-lg shadow-[#c8a84e]/20 hover:-translate-y-0.5 transition-all"
          >
            <HiOutlinePlus className="w-4 h-4" /> New Announcement
          </Link>
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
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or content..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading announcements...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineMegaphone className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No announcements found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {search || publishFilter !== ""
                  ? "Try adjusting your search or filters."
                  : "Create your first announcement to reach your alumni."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Title", "Audience", "Status", "Reads", "Created"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="text-right py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {items.map((a) => {
                    const status = statusOf(a);
                    const busy = actionId === a.id;
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {a.is_pinned && (
                              <HiOutlineBookmark className="w-4 h-4 text-[#c8a84e] flex-shrink-0" title="Pinned" />
                            )}
                            <span className="font-medium text-slate-200">{a.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-500" />
                            {targetLabel(a)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{a.reads_count ?? 0}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {formatDate(a.created_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              title={a.is_pinned ? "Unpin" : "Pin"}
                              active={a.is_pinned}
                              disabled={busy}
                              onClick={() => runAction(a.id, adminApi.toggleAnnouncementPin)}
                            >
                              <HiOutlineBookmark className="w-4 h-4" />
                            </IconButton>
                            {a.is_published && !a.archived_at ? (
                              <IconButton
                                title="Archive"
                                disabled={busy}
                                onClick={() => runAction(a.id, adminApi.archiveAnnouncement)}
                              >
                                <HiOutlineArchiveBox className="w-4 h-4" />
                              </IconButton>
                            ) : (
                              <IconButton
                                title="Publish"
                                disabled={busy}
                                onClick={() => runAction(a.id, adminApi.publishAnnouncement)}
                              >
                                <HiOutlineEye className="w-4 h-4" />
                              </IconButton>
                            )}
                            <Link
                              to={`/admin/announcements/${a.id}/edit`}
                              title="Edit"
                              className="p-2 rounded-lg text-slate-400 hover:text-[#c8a84e] hover:bg-white/[0.06] transition-colors"
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
                        </td>
                      </tr>
                    );
                  })}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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

function IconButton({ title, onClick, disabled, active, danger, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
        active
          ? "text-[#c8a84e] bg-[#c8a84e]/10"
          : danger
          ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          : "text-slate-400 hover:text-[#c8a84e] hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}
