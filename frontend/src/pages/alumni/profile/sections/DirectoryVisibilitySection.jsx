// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/sections/DirectoryVisibilitySection.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import alumniApi from "../../../../api/alumniApi";
import { useToast } from "../../../../hooks/useToast";
import {
  AlumniCard,
  IconChip,
  SectionHeader,
} from "../../../../components/alumni/ui";
import { HiOutlineUserGroup } from "react-icons/hi2";

// ═══════════════════════════════════════════════════════════
//  B2) DIRECTORY VISIBILITY — privacy opt-out (Phase B)
//  Reuses PUT /profile ({ is_directory_visible }). Optimistic:
//  flip immediately, revert on failure.
// ═══════════════════════════════════════════════════════════
export default function DirectoryVisibilitySection({ initial }) {
  const toast = useToast();
  const [visible, setVisible] = useState(initial);
  const [saving, setSaving] = useState(false);

  // Keep in sync if the parent reloads the profile with a fresh value.
  useEffect(() => {
    setVisible(initial);
  }, [initial]);

  const handleToggle = async () => {
    if (saving) return;
    const next = !visible;
    setVisible(next); // optimistic
    setSaving(true);
    try {
      await alumniApi.updateProfile({ is_directory_visible: next });
      toast.success(
        next
          ? "You're now visible in the Alumni Directory."
          : "You're now hidden from the Alumni Directory.",
      );
    } catch (err) {
      setVisible(!next); // revert
      toast.error(
        err.response?.data?.message || "Failed to update directory visibility.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlumniCard>
      <SectionHeader title="Directory Visibility" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <IconChip icon={HiOutlineUserGroup} color="blue" size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Show my profile in the Alumni Directory
            </p>
            <p className="mt-0.5 text-[0.78rem] text-slate-500 dark:text-slate-400 leading-relaxed">
              When off, other alumni won't find you in the directory or see your
              profile.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label="Show my profile in the Alumni Directory"
          onClick={handleToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            visible ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              visible ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </AlumniCard>
  );
}
