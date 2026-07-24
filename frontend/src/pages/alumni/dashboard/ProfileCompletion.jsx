// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/dashboard/ProfileCompletion.jsx
//  Phase 3.2 — Profile completion progress widget
//  Progress bar + actionable nudges that deep-link to the page
//  where each missing item can be filled in.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import {
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from "react-icons/hi2";

export default function ProfileCompletion() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alumniApi
      .getProfileCompletion()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="h-2 w-40 bg-slate-100 rounded animate-pulse mb-3" />
        <div className="h-2.5 w-full bg-slate-100 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const { percentage, completed, total, is_complete, missing } = data;

  // Once the profile is fully complete, the reminder card is no longer needed —
  // hide it entirely so the Home page stays uncluttered. The 100% state is still
  // visible on the My Profile page.
  if (percentage >= 100) return null;

  // Bar color reflects progress.
  const barColor =
    percentage >= 100
      ? "bg-emerald-500"
      : percentage >= 60
        ? "bg-[#c8a84e]"
        : percentage >= 30
          ? "bg-amber-500"
          : "bg-red-400";

  // Nudge toward the next milestone (completing one more item).
  const next = missing[0];
  const nextPercentage = total > 0 ? Math.round(((completed + 1) / total) * 100) : 100;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {is_complete ? (
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <HiOutlineSparkles className="w-5 h-5 text-[#c8a84e]" />
          )}
          <h3 className="text-sm font-bold text-slate-800">Profile Completion</h3>
        </div>
        <span
          className={`text-sm font-bold ${
            is_complete ? "text-emerald-600" : "text-slate-700"
          }`}
        >
          {percentage}%
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* ── Nudge / completion message ── */}
      {is_complete ? (
        <p className="text-xs text-emerald-600 font-medium mt-3">
          Your profile is 100% complete — thank you for keeping it up to date!
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mt-3">
            Your profile is{" "}
            <span className="font-semibold text-slate-700">{percentage}%</span>{" "}
            complete
            {next && (
              <>
                {" "}
                — {next.hint.toLowerCase()} to reach{" "}
                <span className="font-semibold text-slate-700">
                  {nextPercentage}%
                </span>
              </>
            )}
            .
          </p>

          {/* ── Missing items as deep links ── */}
          <ul className="mt-3 space-y-1.5">
            {missing.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.link}
                  className="group flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-[#c8a84e]/40 hover:bg-[#c8a84e]/[0.04] transition-colors"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-xs text-slate-600 truncate">
                      {item.hint}
                    </span>
                  </span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#c8a84e] flex-shrink-0 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
