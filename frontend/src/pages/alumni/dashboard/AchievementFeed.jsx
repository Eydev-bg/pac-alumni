// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/dashboard/AchievementFeed.jsx
//  Phase 3.1 — Community achievement feed (scrollable card list)
//  Shows recent public achievements from fellow alumni. The
//  alumni can toggle the visibility of their OWN entries.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from "react";
import alumniApi from "../../../api/alumniApi";
import { timeAgo, storageUrl } from "../../../utils/formatters";
import SkeletonCard from "../../../components/common/SkeletonCard";
import {
  HiOutlineTrophy,
  HiOutlineBriefcase,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

// Per-type visual treatment.
const TYPE_STYLES = {
  employment_update: { icon: HiOutlineBriefcase, bg: "bg-emerald-50", fg: "text-emerald-600" },
  board_exam_passed: { icon: HiOutlineTrophy, bg: "bg-amber-50", fg: "text-amber-600" },
  profile_completed: { icon: HiOutlineCheckBadge, bg: "bg-blue-50", fg: "text-blue-600" },
  new_registration: { icon: HiOutlineSparkles, bg: "bg-purple-50", fg: "text-purple-600" },
};

export default function AchievementFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const lastLoadAt = useRef(0);

  // `background` refreshes swap the data in place: no spinner, and a
  // failed refresh keeps the current items instead of showing an error.
  const load = useCallback((background = false) => {
    if (!background) setLoading(true);
    lastLoadAt.current = Date.now();
    alumniApi
      .getAchievementFeed()
      .then((res) => {
        setItems(res.data.data);
        setError("");
      })
      .catch(() => {
        if (!background) setError("Failed to load the achievement feed.");
      })
      .finally(() => {
        if (!background) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Phase 4B: refetch when the window/tab regains focus so the feed is
  // not stale after an update made on another page or tab. Guarded by a
  // cooldown so rapid focus flips don't spam the API.
  useEffect(() => {
    const COOLDOWN_MS = 15000;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLoadAt.current < COOLDOWN_MS) return;
      load(true);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      const res = await alumniApi.toggleAchievementVisibility(id);
      const isPublic = res.data.data.is_public;
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_public: isPublic } : a))
      );
    } catch {
      // Non-fatal — leave the row as-is.
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 dark:border-slate-700">
        <HiOutlineTrophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Alumni Achievements</h3>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <SkeletonCard variant="notification" count={3} />
        ) : error ? (
          <p className="text-sm text-slate-400 text-center py-6">{error}</p>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 dark:bg-slate-700">
              <HiOutlineSparkles className="w-6 h-6 text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">No achievements yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your employment or board exam results to be featured here.
            </p>
          </div>
        ) : (
          <ul className="space-y-1 max-h-[360px] overflow-y-auto pr-1 -mr-1">
            {items.map((a) => (
              <AchievementItem
                key={a.id}
                achievement={a}
                toggling={togglingId === a.id}
                onToggle={() => handleToggle(a.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AchievementItem({ achievement: a, toggling, onToggle }) {
  const style = TYPE_STYLES[a.type] || TYPE_STYLES.new_registration;
  const Icon = style.icon;
  const { alumni } = a;
  const initials = (alumni.name || "P A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <li className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors dark:hover:bg-slate-700">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden dark:bg-slate-700">
          {alumni.profile_picture ? (
            <img
              src={storageUrl(alumni.profile_picture)}
              alt={alumni.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[0.7rem] font-bold text-slate-500 dark:text-slate-300">{initials}</span>
          )}
        </div>
        <span
          className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full ${style.bg} flex items-center justify-center ring-2 ring-white dark:ring-slate-800`}
        >
          <Icon className={`w-2.5 h-2.5 ${style.fg}`} />
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.8rem] text-slate-700 leading-snug dark:text-slate-200">{a.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[0.68rem] text-slate-400 dark:text-slate-400">
          {alumni.course_code && <span>{alumni.course_code}</span>}
          {alumni.graduation_year && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>Batch {alumni.graduation_year}</span>
            </>
          )}
          {a.created_at && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>{timeAgo(a.created_at)}</span>
            </>
          )}
          {!a.is_public && a.is_own && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-amber-600 font-medium dark:text-amber-400">Hidden</span>
            </>
          )}
        </div>
      </div>

      {/* Own-entry visibility toggle */}
      {a.is_own && (
        <button
          onClick={onToggle}
          disabled={toggling}
          title={a.is_public ? "Hide from feed" : "Show in feed"}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700"
        >
          {a.is_public ? (
            <HiOutlineEye className="w-4 h-4" />
          ) : (
            <HiOutlineEyeSlash className="w-4 h-4" />
          )}
        </button>
      )}
    </li>
  );
}
