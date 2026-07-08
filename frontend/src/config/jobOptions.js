/**
 * Job-related option constants shared across employer/alumni/admin job pages.
 * Mirrors the backend job_posts.job_type column and application statuses.
 */

export const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

export const JOB_TYPE_LABELS = JOB_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {}
);

export const APPLICATION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export const APPLICATION_STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  reviewed: "bg-blue-50 text-blue-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export const JOB_STATUS_STYLES = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
};

/**
 * Format a job's salary range into a readable string.
 * Returns null when neither bound is set so callers can hide the field.
 */
export function formatSalaryRange(min, max) {
  const peso = (n) => `₱${Number(n).toLocaleString()}`;
  if (min && max) return `${peso(min)} – ${peso(max)}`;
  if (min) return `From ${peso(min)}`;
  if (max) return `Up to ${peso(max)}`;
  return null;
}
