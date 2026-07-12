import { memo } from "react";
import { EMPLOYMENT_TYPE_COLORS, EMPLOYMENT_TYPE_TRACK } from "../constants";

// ─── Employment Type Distribution (horizontal meter list) ──
// One row per type: category label on the left, a proportional colored fill in
// the middle, and the count on the right. Bar widths are scaled against the
// TOTAL registered alumni (passed in as `totalAlumni`), so a bar reflects each
// type's share of the whole alumni base rather than just the largest type — a
// count of 1 out of 6 alumni reads as ~17%, not a full bar. Nonzero counts get
// at least a 3% sliver so they stay visible; a count of 0 renders nothing at
// all (no fill, no track). Full width in the charts row (lg:col-span-2).
// Memoized: re-renders only when `data` / `totalAlumni` change.
function EmploymentTypeChart({ data, totalAlumni = 1 }) {
  const rows = Array.isArray(data) ? data : [];
  const total = rows.reduce((sum, d) => sum + (d.count || 0), 0);
  const hasData = rows.length > 0 && total > 0;

  // Share of the total alumni base (min 1 avoids divide-by-zero). Nonzero
  // counts get at least a 3% sliver; zero counts get 0% (no bar).
  const denominator = totalAlumni || 1;
  const widthPct = (count) => {
    if (!count || count <= 0) return 0;
    return Math.min(Math.max((count / denominator) * 100, 3), 100);
  };

  return (
    <div className="lg:col-span-2 bg-navy-800/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 flex flex-col">
      <div className="mb-1">
        <h2 className="text-[15px] font-bold text-white">
          Employment Type Distribution
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Current employment breakdown by type
        </p>
      </div>

      {hasData ? (
        <div className="flex-1 flex flex-col justify-center gap-6 mt-6 mb-2">
          {rows.map((item) => (
            <div key={item.type} className="flex items-center gap-4">
              <span className="w-28 shrink-0 text-[12px] text-slate-300 truncate">
                {item.type}
              </span>
              <div
                className="flex-1 h-2.5 rounded-md overflow-hidden"
                style={
                  item.count > 0
                    ? { backgroundColor: EMPLOYMENT_TYPE_TRACK }
                    : undefined
                }
              >
                {item.count > 0 && (
                  <div
                    className="h-full rounded-md transition-all duration-700"
                    style={{
                      width: `${widthPct(item.count)}%`,
                      backgroundColor: EMPLOYMENT_TYPE_COLORS[item.type],
                    }}
                  />
                )}
              </div>
              <span className="w-10 shrink-0 text-right text-[12px] font-semibold tabular-nums text-slate-400 font-mono">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center min-h-[120px]">
          <p className="text-sm text-slate-500">No employment records yet.</p>
        </div>
      )}

      {/* Legend — hairline-separated row of rounded swatches (matches the design).
          Wraps gracefully on narrow widths instead of overflowing. */}
      {hasData && (
        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 pt-4 mt-4 border-t border-white/[0.06]">
          {rows.map((item) => (
            <span
              key={item.type}
              className="flex items-center gap-2 text-[11px] text-slate-400"
            >
              <span
                className="w-2.5 h-2.5 rounded-[3px] inline-block shrink-0"
                style={{ backgroundColor: EMPLOYMENT_TYPE_COLORS[item.type] }}
              />
              {item.type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(EmploymentTypeChart);
