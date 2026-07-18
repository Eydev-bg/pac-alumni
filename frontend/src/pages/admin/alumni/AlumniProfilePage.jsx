// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/alumni/AlumniProfilePage.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import {
  HiOutlineArrowLeft,
  HiOutlineIdentification,
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
} from "react-icons/hi2";

export default function AlumniProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAlumniProfile(id)
      .then((res) => setData(res.data.data))
      .catch(() => navigate("/admin/alumni"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );

  if (!data) return null;

  const { graduate, alumni_profile, board_exam_records, employment_records } =
    data;

  // Generate initials for avatar
  const initials =
    (graduate.first_name?.[0] || "") + (graduate.last_name?.[0] || "");

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1000px] mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/admin/alumni")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#c8a84e] mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Directory
        </button>

        {/* ═══ PROFILE HERO CARD — centered layout ═══ */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden mb-6">
          {/* Avatar + Name — centered */}
          <div className="flex flex-col items-center pt-8 pb-6 px-6">
            {/* Avatar circle */}
            {graduate.profile_photo_url ? (
              <img
                src={graduate.profile_photo_url}
                alt={graduate.full_name}
                className="w-28 h-28 rounded-full border-4 border-[#0c1525] shadow-xl object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-[#0c1525] shadow-xl bg-gradient-to-br from-[#c8a84e] to-[#a88a3a] flex items-center justify-center">
                <span className="text-3xl font-bold text-white tracking-wider">
                  {initials}
                </span>
              </div>
            )}

            {/* Name */}
            <h1 className="text-2xl font-bold text-white mt-4">
              {graduate.full_name}
            </h1>

            {/* Badges row */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <StatusBadge
                status={graduate.education_level}
                label={graduate.education_level_label}
              />
              {graduate.alumni_id_number && (
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15 flex items-center gap-1">
                  <HiOutlineIdentification className="w-3.5 h-3.5" />
                  {graduate.alumni_id_number}
                </span>
              )}
            </div>

            {/* Employment + Board Status badges */}
            {alumni_profile && (
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <StatusBadge
                  status={
                    alumni_profile.employment_status === "employed"
                      ? "success"
                      : alumni_profile.employment_status === "unemployed"
                        ? "failed"
                        : "blocked"
                  }
                  label={`Employment: ${alumni_profile.employment_status}`}
                />
                <StatusBadge
                  status={
                    alumni_profile.board_status === "passer"
                      ? "success"
                      : alumni_profile.board_status === "failed"
                        ? "failed"
                        : "blocked"
                  }
                  label={`Board: ${alumni_profile.board_status?.replace("_", " ")}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══ TWO-COLUMN GRID: Board Exam + Employment ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Board Exam Records */}
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
            <h2 className="text-[11px] font-semibold text-[#c8a84e] mb-4 uppercase tracking-wider flex items-center gap-2">
              <HiOutlineAcademicCap className="w-4 h-4" />
              Board Exam Records
            </h2>
            {board_exam_records.length === 0 ? (
              <p className="text-sm text-slate-500">No board exam records.</p>
            ) : (
              <div className="space-y-3">
                {board_exam_records.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {r.exam_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Year: {r.exam_year}
                      </p>
                    </div>
                    <StatusBadge
                      status={r.status === "passer" ? "success" : "failed"}
                      label={r.status}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employment Records */}
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
            <h2 className="text-[11px] font-semibold text-[#c8a84e] mb-4 uppercase tracking-wider flex items-center gap-2">
              <HiOutlineBriefcase className="w-4 h-4" />
              Employment History
            </h2>
            {employment_records.length === 0 ? (
              <p className="text-sm text-slate-500">No employment records.</p>
            ) : (
              <div className="space-y-3">
                {employment_records.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl ${
                      r.is_current
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-white/[0.04] border border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {r.job_title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {r.company_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {r.industry} · {r.employment_type?.replace("_", "-")}
                        </p>
                      </div>
                      {r.is_current && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                    {(r.start_date || r.end_date) && (
                      <p className="text-xs text-slate-500 mt-2">
                        {r.start_date || "?"} —{" "}
                        {r.is_current ? "Present" : r.end_date || "?"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
