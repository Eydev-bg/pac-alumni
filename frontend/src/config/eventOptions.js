/**
 * Event option constants shared across admin/alumni event pages.
 * Mirrors the backend events.target_type column and the RsvpStatus enum.
 */

export const TARGET_TYPES = [
  { value: "all", label: "Everyone" },
  { value: "department", label: "Department" },
  { value: "course", label: "Course / Program" },
  { value: "batch", label: "Graduation Batch" },
];

export const TARGET_TYPE_LABELS = TARGET_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {}
);

// Human labels for App\Enums\EducationLevel, kept so the event list page can
// still display the audience of any event that was previously targeted at an
// education level. Education level is no longer a selectable audience type
// (only College graduates have registered accounts).
export const EDUCATION_LEVEL_LABELS = {
  elementary: "Elementary",
  jhs: "Junior High School",
  shs: "Senior High School",
  college: "College",
};

// RSVP status values — must match the backend App\Enums\RsvpStatus enum exactly.
export const RSVP_STATUSES = [
  { value: "going", label: "Going" },
  { value: "interested", label: "Interested" },
];
