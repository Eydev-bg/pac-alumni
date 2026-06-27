import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { cn } from "../../utils/formatters";

/**
 * Pagination — reusable pagination component.
 *
 * Props:
 *   meta: { current_page, last_page, per_page, total, from, to }
 *   onPageChange: (page) => void
 */
export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, total, from, to } = meta;

  // Generate page numbers to display
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let end = Math.min(last_page, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < last_page) {
      if (end < last_page - 1) pages.push("...");
      pages.push(last_page);
    }

    return pages;
  };

  const btnBase =
    "relative inline-flex items-center justify-center text-sm font-medium transition-colors rounded-lg min-w-[36px] h-9";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span> to{" "}
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span> results
      </p>

      <nav className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className={cn(
            btnBase,
            "px-2",
            current_page === 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          <HiOutlineChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPages().map((page, idx) =>
          page === "..." ? (
            <span key={`dots-${idx}`} className="px-1 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                btnBase,
                page === current_page
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className={cn(
            btnBase,
            "px-2",
            current_page === last_page
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          <HiOutlineChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
