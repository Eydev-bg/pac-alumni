import { useState, useEffect, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import Card from "../../../ui/Card";
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
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/admin/graduates/import"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Import History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record of all graduate list imports
          </p>
        </div>
      </div>

      <Card padding={false} className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-[#c8a84e] mb-3" />
            <p className="text-sm text-slate-500">Loading import history...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HiOutlineDocumentArrowUp className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
              No imports yet
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Import a graduate list to see the history here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                  <th className="text-left py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    File
                  </th>
                  <th className="text-left py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Level
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Imported
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Duplicates
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Errors
                  </th>
                  <th className="text-left py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="text-left py-3.5 px-4 font-semibold text-blue-600 dark:text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {batches.map((batch) => (
                  <Fragment key={batch.id}>
                    <tr
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === batch.id ? null : batch.id)
                      }
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                        {batch.file_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={batch.education_level}
                          label={batch.education_level_label}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {batch.total_records}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-emerald-400">
                        {batch.imported_count}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-amber-400">
                        {batch.duplicate_count}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-red-400">
                        {batch.error_count}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={STATUS_COLORS[batch.status] || "default"}
                          label={batch.status_label}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        {batch.uploaded_by?.full_name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDate(batch.created_at)}
                      </td>
                    </tr>
                    {/* Expanded error details */}
                    {expandedId === batch.id &&
                      batch.error_details &&
                      batch.error_details.length > 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-3 bg-red-500/[0.06]"
                          >
                            <p className="text-xs font-semibold text-red-400 mb-1">
                              Error Details:
                            </p>
                            <ul className="text-xs text-red-600 dark:text-red-300/80 space-y-0.5 max-h-32 overflow-y-auto">
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
      </Card>
    </div>
  );
}
