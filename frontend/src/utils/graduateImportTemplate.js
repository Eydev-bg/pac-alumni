/**
 * Client-side CSV template generator for the Graduate Import feature.
 *
 * There is no server-side template/export utility for this (the exports under
 * app/Exports/ are for reports, not the import template), so this generates a
 * plain CSV in the browser — no new dependency needed.
 *
 * IMPORTANT: these columns mirror exactly what
 * App\Services\Admin\GraduateImportService accepts (see mapHeaders() /
 * validateRow() there). Keep this in sync if those change.
 *
 *   Required (all levels): first_name, last_name, graduation_year
 *   Optional (all levels): middle_name, suffix
 *   College only:          course_code (required), alumni_id (optional)
 */

const BASE_COLUMNS = [
  "first_name",
  "last_name",
  "graduation_year",
  "middle_name",
  "suffix",
];
const COLLEGE_ONLY_COLUMNS = ["course_code", "alumni_id"];

/** Columns for a given education level. Pass no level for the generic template. */
export function getTemplateColumns(educationLevel) {
  return educationLevel === "college"
    ? [...BASE_COLUMNS, ...COLLEGE_ONLY_COLUMNS]
    : [...BASE_COLUMNS, ...(educationLevel ? [] : COLLEGE_ONLY_COLUMNS)];
}

function toCsvField(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsvRow(values) {
  return values.map(toCsvField).join(",");
}

/** One example row — required fields filled, everything else left blank. */
function buildSampleRow(columns, educationLevel) {
  const sample = {
    first_name: "Juan",
    last_name: "Dela Cruz",
    graduation_year: "2024",
    middle_name: "",
    suffix: "",
    course_code: educationLevel === "college" ? "BSIT" : "",
    alumni_id: "",
  };
  return columns.map((col) => sample[col] ?? "");
}

/**
 * Triggers a browser download of a CSV template.
 *
 * @param {string} [educationLevel] - "elementary" | "jhs" | "shs" | "college".
 *   Omit to get the generic template (includes course_code/alumni_id, left
 *   blank in the sample row — the calling UI should note those are College
 *   only).
 */
export function downloadGraduateImportTemplate(educationLevel) {
  const columns = getTemplateColumns(educationLevel);
  const sampleRow = buildSampleRow(columns, educationLevel);

  const csv = [toCsvRow(columns), toCsvRow(sampleRow)].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `graduate-import-template${
    educationLevel ? `-${educationLevel}` : ""
  }.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
