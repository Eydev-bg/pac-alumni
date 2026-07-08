/**
 * Announcement option constants shared across admin/alumni announcement pages.
 * Mirrors the backend announcements.target_type column and the
 * EducationLevel enum used for targeting.
 */

export const TARGET_TYPES = [
  { value: "all", label: "Everyone" },
  { value: "education_level", label: "Education Level" },
  { value: "department", label: "Department" },
  { value: "course", label: "Course / Program" },
  { value: "batch", label: "Graduation Batch" },
];

export const TARGET_TYPE_LABELS = TARGET_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {}
);

// Mirrors App\Enums\EducationLevel (value => human label).
export const EDUCATION_LEVELS = [
  { value: "elementary", label: "Elementary" },
  { value: "jhs", label: "Junior High School" },
  { value: "shs", label: "Senior High School" },
  { value: "college", label: "College" },
];

export const EDUCATION_LEVEL_LABELS = EDUCATION_LEVELS.reduce(
  (acc, l) => ({ ...acc, [l.value]: l.label }),
  {}
);
