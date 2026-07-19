// ─── Dashboard chart palette (navy + gold) ───────────────
// Shared, named constants so the split chart components reference one
// definition instead of duplicating hex values. Migration to Phase 4 theme
// tokens is intentionally deferred (Phase 3 is performance-only).

export const COLORS = {
  registrations: "#c8a84e",
  axisTick: "#64748b", // slate-500 — chart axis ticks (Recharts prop)
};

// Fixed color per employment status so the legend, tooltip and slices always agree.
export const EMPLOYMENT_COLORS = {
  Employed: "#c8a84e",
  Unemployed: "#ef4444",
  Unknown: "#475569",
};

// Fixed color per employment type — keys match EmploymentType::label() from the backend.
export const EMPLOYMENT_TYPE_COLORS = {
  Local: "#c8a84e", // gold
  International: "#3b82f6", // blue
  "Self-employed": "#22c55e", // green
};

// Unfilled track behind each horizontal employment-type bar (from the dashboard
// design). Dark navy so the colored fill reads clearly on top.
export const EMPLOYMENT_TYPE_TRACK = "#1c2438";

// Fixed color per board exam status so the legend, tooltip and slices always agree.
export const BOARD_COLORS = {
  Passed: "#22c55e", // green
  "Not Yet Taken": "#475569", // slate
};
