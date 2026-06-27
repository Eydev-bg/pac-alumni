// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/verification/BlacklistPage.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import { formatDate } from "../../../utils/formatters";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineNoSymbol,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function BlacklistPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    identifier: "",
    identifier_type: "ip",
    reason: "",
  });
  const [addErrors, setAddErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBlacklist = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 20,
        ...(typeFilter && { type: typeFilter }),
      };
      const res = await adminApi.getBlacklist(params);
      setItems(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);
  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddErrors({});
    setAddLoading(true);
    try {
      await adminApi.addToBlacklist(addForm);
      setShowAdd(false);
      setAddForm({ identifier: "", identifier_type: "ip", reason: "" });
      fetchBlacklist();
    } catch (err) {
      if (err.response?.status === 422) {
        setAddErrors(
          err.response.data.errors || { general: err.response.data.message },
        );
      } else {
        setAddErrors({
          general: err.response?.data?.message || "Failed to add.",
        });
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminApi.removeFromBlacklist(confirmDelete.id);
      setConfirmDelete({ open: false, id: null });
      fetchBlacklist();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Blacklist</h1>
            <p className="text-sm text-slate-400 mt-1">
              Blocked IPs and Student IDs from registration
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold rounded-xl hover:bg-red-500/30 transition-all"
          >
            <HiOutlinePlus className="w-4 h-4" /> Add to Blacklist
          </button>
        </div>

        {/* Type Filter */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="" className="bg-[#1a2e5a] text-slate-300">
              All Types
            </option>
            <option value="ip" className="bg-[#1a2e5a] text-slate-300">
              IP Address
            </option>
            <option value="alumni_id" className="bg-[#1a2e5a] text-slate-300">
              Student ID
            </option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading blacklist...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineNoSymbol className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                Blacklist is empty
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                No IPs or Student IDs have been blacklisted.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Identifier
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Blocked By
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
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-sm font-medium text-slate-200">
                        {item.identifier}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                            item.identifier_type === "ip"
                              ? "bg-purple-500/15 text-purple-300 border-purple-500/20"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {item.identifier_type_label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs max-w-[200px] truncate">
                        {item.reason || (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {item.blacklisted_by?.full_name || (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            setConfirmDelete({ open: true, id: item.id })
                          }
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

        {/* Add Modal — WHITE background (original style) */}
        {showAdd && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAdd(false)}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    Add to Blacklist
                  </h3>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>

                {addErrors.general && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{addErrors.general}</p>
                  </div>
                )}

                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={addForm.identifier_type}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          identifier_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ip">IP Address</option>
                      <option value="alumni_id">Alumni ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {addForm.identifier_type === "ip"
                        ? "IP Address"
                        : "Student ID"}{" "}
                      *
                    </label>
                    <input
                      type="text"
                      value={addForm.identifier}
                      onChange={(e) =>
                        setAddForm({ ...addForm, identifier: e.target.value })
                      }
                      required
                      placeholder={
                        addForm.identifier_type === "ip"
                          ? "192.168.1.100"
                          : "STU-2024-0001"
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={addForm.reason}
                      onChange={(e) =>
                        setAddForm({ ...addForm, reason: e.target.value })
                      }
                      rows={2}
                      placeholder="Optional — why is this being blacklisted?"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {addLoading ? "Adding..." : "Block"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmDelete.open}
          title="Remove from Blacklist"
          message="Remove this entry? The IP or Student ID will be able to attempt registration again."
          confirmLabel="Remove"
          variant="warning"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete({ open: false, id: null })}
        />
      </div>
    </div>
  );
}
