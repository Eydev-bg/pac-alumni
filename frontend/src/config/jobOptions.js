/**
 * Job posting option constants shared across admin/alumni job pages.
 * Values must match the backend App\Enums\JobEmploymentType and
 * App\Enums\JobStatus enums exactly.
 */

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
];

export const JOB_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

// Who authored a posting. Must match App\Enums\JobSource exactly.
export const JOB_SOURCES = [
  { value: "admin", label: "Admin" },
  { value: "alumni", label: "Alumni" },
];

// Badge classes per status for the admin (dark) theme.
export const STATUS_BADGE_COLORS = {
  draft: "bg-slate-500/15 text-slate-300",
  active: "bg-emerald-500/15 text-emerald-400",
  expired: "bg-red-500/15 text-red-400",
};
