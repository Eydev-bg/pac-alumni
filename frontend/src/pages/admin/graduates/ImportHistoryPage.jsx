import { useState, useEffect, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../utils/formatters";
import { PAGINATION } from "../../../config/constants";
import { HiOutlineDocumentArrowUp, HiOutlineArrowLeft } from "react-icons/hi2";

const STATUS_COLORS = {
  completed: "success",
  failed: "failed",
  processing: "blocked",
};

export default function ImportHistoryPage() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getImportHistory({
        page,
        per_page: PAGINATION.DEFAULT_PER_PAGE,
      });
      setBatches(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load import history.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/admin/graduates/import"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Import History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Record of all graduate list imports
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading import history..." />
        ) : batches.length === 0 ? (
          <EmptyState
            icon={HiOutlineDocumentArrowUp}
            title="No imports yet"
            description="Import a graduate list to see the history here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    File
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Level
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">
                    Imported
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">
                    Duplicates
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">
                    Errors
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Uploaded By
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <Fragment key={batch.id}>
                    <tr
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === batch.id ? null : batch.id)
                      }
                    >
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">
                        {batch.file_name}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={batch.education_level}
                          label={batch.education_level_label}
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        {batch.total_records}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                        {batch.imported_count}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-amber-700">
                        {batch.duplicate_count}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-red-700">
                        {batch.error_count}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={STATUS_COLORS[batch.status] || "default"}
                          label={batch.status_label}
                        />
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {batch.uploaded_by?.full_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {formatDate(batch.created_at)}
                      </td>
                    </tr>
                    {/* Expanded error details */}
                    {expandedId === batch.id &&
                      batch.error_details &&
                      batch.error_details.length > 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-3 bg-red-50">
                            <p className="text-xs font-semibold text-red-700 mb-1">
                              Error Details:
                            </p>
                            <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
                              {batch.error_details.map((err, i) => (
                                <li key={i}>• {err}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                  </Fragment>
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
    </div>
  );
}
