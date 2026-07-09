/**
 * Shared period → date-range helpers for log/activity list pages.
 *
 * Used by the log/activity list pages (e.g. VerificationLogsPage) so the
 * period options and the date math stay in one place.
 */

// Dropdown options for the "period" filter used by log pages.
export const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "thismonth", label: "This Month" },
];

/**
 * Convert a period key into the API's `{ date_from }` param.
 * Returns an empty object for "all time" / unknown periods.
 */
export function periodToDateParams(periodFilter) {
  if (!periodFilter) return {};
  const now = new Date();
  let dateFrom = "";

  if (periodFilter === "today") {
    dateFrom = now.toISOString().slice(0, 10);
  } else if (periodFilter === "7days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    dateFrom = d.toISOString().slice(0, 10);
  } else if (periodFilter === "30days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    dateFrom = d.toISOString().slice(0, 10);
  } else if (periodFilter === "thismonth") {
    dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }

  return dateFrom ? { date_from: dateFrom } : {};
}
