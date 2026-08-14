// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/graduates/GraduateTrashPage.jsx
//  Soft-deleted graduate records — restore or permanently delete.
//  Built entirely on the Phase 4 shared primitives.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import { useToast } from "../../../hooks/useToast";
import { formatDate, storageUrl } from "../../../utils/formatters";
import { PAGINATION } from "../../../config/constants";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import DataTable from "../../../ui/DataTable";
import SearchInput from "../../../ui/SearchInput";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import {
  HiOutlineTrash,
  HiOutlineArrowUturnLeft,
  HiOutlineUserCircle,
  HiOutlineLockClosed,
} from "react-icons/hi2";

// Action kinds for the shared confirm dialog.
const ACTION = {
  RESTORE: "restore",
  FORCE: "force",
};

export default function GraduateTrashPage() {
  const toast = useToast();
  const [graduates, setGraduates] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // { type: ACTION.*, graduate } while a confirmation is open, else null.
  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchTrashed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTrashedGraduates({
        page,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
        ...(search && { search }),
      });
      setGraduates(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load trashed graduates.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchTrashed();
  }, [fetchTrashed]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleConfirm = async () => {
    if (!confirm) return;
    const { type, graduate } = confirm;
    setProcessing(true);
    try {
      if (type === ACTION.RESTORE) {
        await adminApi.restoreGraduate(graduate.id);
        toast.success(`${graduate.full_name} restored.`);
      } else {
        await adminApi.forceDeleteGraduate(graduate.id);
        toast.success(`${graduate.full_name} permanently deleted.`);
      }
      setConfirm(null);
      // Refresh; step back a page if we just emptied the last one.
      if (graduates.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchTrashed();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      key: "graduate",
      header: "Graduate",
      render: (g) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy-800/60 flex items-center justify-center flex-shrink-0 border border-white/[0.08] overflow-hidden">
            {g.profile_picture ? (
              <img
                src={storageUrl(g.profile_picture)}
                alt={g.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <HiOutlineUserCircle className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-200 truncate">{g.full_name}</p>
            <p className="text-xs text-slate-500 truncate">
              {g.alumni_id_number || "No Alumni ID"}
            </p>
            {g.has_alumni_account && (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                <HiOutlineLockClosed className="w-3 h-3" />
                Linked account
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "program",
      header: "Course / Department",
      cellClassName: "text-xs text-slate-400",
      render: (g) => (
        <>
          <p className="text-slate-300">
            {g.course?.name || g.department?.name || "—"}
          </p>
          <p className="text-slate-500">{g.education_level_label}</p>
        </>
      ),
    },
    {
      key: "graduation_year",
      header: "Batch",
      cellClassName: "text-slate-300",
      render: (g) => g.graduation_year || "—",
    },
    {
      key: "deleted_at",
      header: "Deleted",
      cellClassName: "text-xs text-slate-500",
      render: (g) => formatDate(g.deleted_at),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (g) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={HiOutlineArrowUturnLeft}
            onClick={() => setConfirm({ type: ACTION.RESTORE, graduate: g })}
          >
            Restore
          </Button>
          {/* Force delete cascades to the alumni profile, employment and
              board exam records — the API rejects it, so don't offer it. */}
          <Button
            variant="danger"
            size="sm"
            icon={HiOutlineTrash}
            disabled={g.has_alumni_account}
            title={
              g.has_alumni_account
                ? "Cannot permanently delete a graduate with a linked alumni account."
                : undefined
            }
            onClick={() => setConfirm({ type: ACTION.FORCE, graduate: g })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const isForce = confirm?.type === ACTION.FORCE;

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Graduate Trash</h1>
          <p className="text-sm text-slate-400 mt-1">
            Deleted graduate records. Restore them or delete permanently.
          </p>
        </div>

        {/* Filters */}
        <Card padding={false} className="p-4 mb-4">
          <SearchInput
            className="w-full"
            onDebouncedChange={setSearch}
            placeholder="Search by name or alumni ID..."
          />
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={graduates}
          loading={loading}
          keyField="id"
          meta={meta}
          onPageChange={setPage}
          loadingLabel="Loading trashed graduates..."
          empty={{
            icon: HiOutlineTrash,
            title: "Trash is empty",
            description: search
              ? "No trashed graduates match your search."
              : "Deleted graduate records will appear here.",
          }}
        />
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={isForce ? "Permanently delete graduate" : "Restore graduate"}
        message={
          isForce
            ? `This will permanently delete ${confirm?.graduate.full_name}. This action cannot be undone.`
            : `Restore ${confirm?.graduate.full_name} back to the active graduate records?`
        }
        confirmLabel={isForce ? "Delete permanently" : "Restore"}
        variant={isForce ? "danger" : "info"}
        loading={processing}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
