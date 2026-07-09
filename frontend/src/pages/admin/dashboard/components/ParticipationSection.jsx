import { memo } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineChartBarSquare,
  HiOutlineIdentification,
} from "react-icons/hi2";

// ─── Alumni Participation (tracer-study engagement) ──────
function clampPercent(value) {
  const n = Number(value) || 0;
  return Math.min(100, Math.max(0, n));
}

function ParticipationMetric({ icon: Icon, label, rate, caption }) {
  const pct = clampPercent(rate);
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-lg bg-gold-500/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gold-500" />
        </span>
        <span className="text-[12px] font-semibold text-slate-200 leading-tight">
          {label}
        </span>
      </div>

      <p className="text-[32px] font-extrabold text-white tracking-tight leading-none">
        {pct}
        <span className="text-lg text-slate-400 font-bold">%</span>
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-500 mt-2.5">{caption}</p>
    </div>
  );
}

// Memoized: re-renders only when the `participation` prop changes.
function ParticipationSection({ participation }) {
  const {
    total_registered = 0,
    employment_known = 0,
    employment_known_rate = 0,
    profile_complete = 0,
    profile_complete_rate = 0,
  } = participation;

  return (
    <div className="bg-navy-800/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
            <HiOutlineChartBarSquare className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-white">
              Alumni Participation
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              How complete is your alumni tracer data — higher rates mean more
              reliable analytics
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParticipationMetric
          icon={HiOutlineBriefcase}
          label="Employment Data Reported"
          rate={employment_known_rate}
          caption={`${employment_known.toLocaleString()} of ${total_registered.toLocaleString()} reported their employment status`}
        />
        <ParticipationMetric
          icon={HiOutlineIdentification}
          label="Profile Completion"
          rate={profile_complete_rate}
          caption={`${profile_complete.toLocaleString()} of ${total_registered.toLocaleString()} completed their profile`}
        />
      </div>

      {/* Caption */}
      <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
        Higher participation means more complete, reliable tracer-study data.
        Alumni still marked “Unknown” have not yet reported their status.
      </p>
    </div>
  );
}

export default memo(ParticipationSection);
