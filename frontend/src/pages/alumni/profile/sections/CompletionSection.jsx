// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/sections/CompletionSection.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import alumniApi from "../../../../api/alumniApi";
import {
  AlumniCard,
  SectionHeader,
  ProgressBar,
} from "../../../../components/alumni/ui";
import {
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from "react-icons/hi2";

// ═══════════════════════════════════════════════════════════
//  E) PROFILE COMPLETION — GET /profile/completion is the source of truth.
//  The frontend renders exactly what the backend returns; it does NOT compute
//  a competing percentage. Re-fetches when any section reports a save.
// ═══════════════════════════════════════════════════════════

export default function CompletionSection({ reloadSignal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    alumniApi
      .getProfileCompletion()
      .then((res) => active && setData(res.data.data))
      .catch((err) => {
        if (import.meta.env.DEV)
          console.error("Profile completion section failed:", err);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadSignal]);

  return (
    <AlumniCard>
      <SectionHeader title="Profile Completion" />
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full" />
          <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-700 rounded" />
        </div>
      ) : !data ? (
        <p className="text-sm text-slate-400">Completion data unavailable.</p>
      ) : (
        <CompletionBody data={data} />
      )}
    </AlumniCard>
  );
}

// Each completion item maps to an on-page section anchor. Since the profile is
// now ONE page (photo/contact/location all live in the Personal area), every
// checklist item scrolls within this page instead of navigating to the old
// standalone /alumni/employment and /alumni/board-exam routes.
const SECTION_BY_KEY = {
  profile_picture: "section-personal",
  contact_number: "section-personal",
  address: "section-personal",
  employment_status: "section-employment",
  board_exam: "section-board-exam",
};

// Smooth-scroll to a section and briefly flash a blue ring so the user sees
// where they landed. The ring classes are removed after the flash.
const FLASH_CLASSES = ["ring-2", "ring-blue-400", "ring-offset-2"];
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("transition-shadow", ...FLASH_CLASSES);
  window.setTimeout(() => el.classList.remove(...FLASH_CLASSES), 1400);
}

function CompletionBody({ data }) {
  const { percentage, is_complete, items = [] } = data;

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {is_complete ? (
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <HiOutlineSparkles className="w-5 h-5 text-blue-500" />
          )}
          {percentage}% Complete
        </span>
      </div>

      <ProgressBar value={percentage} />

      <p
        className={`text-xs mt-3 font-medium ${is_complete ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}
      >
        {is_complete
          ? "Your profile is 100% complete — thank you for keeping it up to date!"
          : "Jump to a section below to complete the remaining items."}
      </p>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const target = SECTION_BY_KEY[item.key];
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => target && scrollToSection(target)}
                className="group w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 transition-colors text-left"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {item.done ? (
                    <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs truncate ${item.done ? "text-slate-400" : "text-slate-600 dark:text-slate-300 font-medium"}`}
                  >
                    {item.done ? item.label : item.hint}
                  </span>
                </span>
                {!item.done && (
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
