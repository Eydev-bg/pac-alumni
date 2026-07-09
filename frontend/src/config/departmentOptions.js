/**
 * Department education-level options — single source of truth.
 *
 * Previously duplicated across DepartmentsListPage, CreateDepartmentModal and
 * EditDepartmentModal. Centralized here alongside the other option configs.
 */
export const EDUCATION_LEVELS = [
  {
    value: "college",
    label: "College",
    description: "Has courses underneath (BSIT, BSCS, etc.)",
  },
  {
    value: "elementary",
    label: "Elementary",
    description: "Standalone department — no courses",
  },
  {
    value: "jhs",
    label: "Junior High School",
    description: "Part of JHS/SHS combined dashboard",
  },
  {
    value: "shs",
    label: "Senior High School",
    description: "Part of JHS/SHS combined dashboard",
  },
];

// value → label lookup for table/detail rendering.
export const EDUCATION_LEVEL_LABELS = EDUCATION_LEVELS.reduce((acc, level) => {
  acc[level.value] = level.label;
  return acc;
}, {});
