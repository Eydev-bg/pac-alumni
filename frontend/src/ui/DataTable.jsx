import Card from "./Card";
import Pagination from "../components/common/Pagination";
import { cn } from "../utils/formatters";

/**
 * DataTable — shared admin list table.
 *
 * Encapsulates the dark list-table + loading + empty-state + pagination
 * wiring duplicated across admin list pages. Composable via a `columns`
 * config so edge-case cells (avatars, action links) stay flexible. Reuses the
 * shared Pagination; colors reference theme tokens.
 *
 * columns: [{
 *   key,                        // row field, and React key for the column
 *   header,                     // column heading
 *   align,                      // 'left' (default) | 'right' | 'center'
 *   headerClassName, cellClassName,
 *   render: (row) => node,      // optional custom cell (else row[key])
 * }]
 *
 * Props:
 *   data, loading, keyField (default 'uuid'), meta, onPageChange,
 *   loadingLabel, empty: { icon, title, description }
 */
const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export default function DataTable({
  columns,
  data,
  loading = false,
  keyField = "uuid",
  meta,
  onPageChange,
  loadingLabel = "Loading...",
  empty = {},
}) {
  const { icon: EmptyIcon, title: emptyTitle = "No records found", description: emptyDescription } = empty;

  return (
    <Card padding={false} className="overflow-hidden">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3 dark:border-gold-500" />
          <p className="text-sm text-slate-500">{loadingLabel}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {EmptyIcon && (
            <EmptyIcon className="w-12 h-12 text-slate-300 mb-4 dark:text-slate-600" />
          )}
          <h3 className="text-sm font-semibold text-slate-700 mb-1 dark:text-slate-300">
            {emptyTitle}
          </h3>
          {emptyDescription && (
            <p className="text-sm text-slate-500 max-w-sm">{emptyDescription}</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "py-3.5 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider dark:text-gold-500",
                      ALIGN[col.align] || ALIGN.left,
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {data.map((row) => (
                <tr
                  key={row[keyField]}
                  className="hover:bg-slate-50 transition-colors dark:hover:bg-white/[0.03]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "py-3.5 px-4",
                        ALIGN[col.align] || ALIGN.left,
                        col.cellClassName,
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && (
        <div className="px-4 pb-4">
          <Pagination meta={meta} onPageChange={onPageChange} />
        </div>
      )}
    </Card>
  );
}
