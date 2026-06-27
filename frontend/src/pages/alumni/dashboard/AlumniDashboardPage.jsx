// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/dashboard/AlumniDashboardPage.jsx
//  Alumni Dashboard — Phase 1: Welcome + Profile Summary
//  Shows: name, department, course, graduation year,
//         alumni ID, board status, employment status.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import { storageUrl } from "../../../utils/formatters";
import {
  HiOutlineAcademicCap,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineIdentification,
  HiOutlineBriefcase,
  HiOutlineClipboardDocumentCheck,
  HiOutlineEnvelope,
  HiOutlineUser,
} from "react-icons/hi2";

export default function AlumniDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    alumniApi
      .getDashboard()
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Failed to load dashboard data.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a2e5a] mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">!</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { personal, academic, status, account } = data;

  // Status badge helper
  const getStatusBadge = (value, label) => {
    const colors = {
      employed: "bg-emerald-100 text-emerald-700",
      unemployed: "bg-amber-100 text-amber-700",
      unknown: "bg-slate-100 text-slate-500",
      passer: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-600",
      not_taken: "bg-amber-100 text-amber-700",
      not_applicable: "bg-slate-100 text-slate-500",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[value] || "bg-slate-100 text-slate-500"}`}
      >
        {label}
      </span>
    );
  };

  // Format date
  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ━━━━ Welcome Banner ━━━━ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] rounded-2xl p-6 sm:p-8 shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-12 w-16 h-16 rounded-full bg-[#c8a84e]/10 hidden sm:block" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              {personal.profile_picture ? (
                <img
                  src={storageUrl(personal.profile_picture)}
                  alt={personal.full_name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-white/80">
                  {personal.first_name?.[0]}
                  {personal.last_name?.[0]}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#c8a84e] font-semibold tracking-wide mb-0.5">
                Welcome back,
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {personal.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1 rounded-full border border-white/10">
                  <HiOutlineAcademicCap className="w-3.5 h-3.5" />
                  {academic.course?.code || "N/A"}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1 rounded-full border border-white/10">
                  <HiOutlineBuildingOffice2 className="w-3.5 h-3.5" />
                  {academic.department?.name || "N/A"}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#c8a84e]/20 text-[#c8a84e] text-xs font-semibold px-3 py-1 rounded-full border border-[#c8a84e]/30">
                  <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                  Batch {academic.graduation_year}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━ Info Cards Grid ━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Alumni ID Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a2e5a]/10 flex items-center justify-center">
              <HiOutlineIdentification className="w-5 h-5 text-[#1a2e5a]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Alumni ID</p>
              <p className="text-sm font-bold text-slate-800">
                {academic.alumni_id || "Not yet assigned"}
              </p>
            </div>
          </div>
        </div>

        {/* Employment Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <HiOutlineBriefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Employment Status
              </p>
              <div className="mt-0.5">
                {getStatusBadge(
                  status.employment_status,
                  status.employment_label,
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Update your employment info in your profile
          </p>
        </div>

        {/* Board Status Card */}
        {status.board_status !== "not_applicable" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Board Exam Status
                </p>
                <div className="mt-0.5">
                  {getStatusBadge(status.board_status, status.board_label)}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Update your board exam results in your profile
            </p>
          </div>
        )}
      </div>

      {/* ━━━━ Profile Details ━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HiOutlineUser className="w-4 h-4 text-slate-400" />
              Personal Information
            </h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <InfoRow label="Full Name" value={personal.full_name} />
            <InfoRow label="Email" value={personal.email} />
            <InfoRow label="Phone" value={personal.phone || "Not set"} />
            <InfoRow
              label="Member Since"
              value={formatDate(account.member_since)}
            />
            <InfoRow
              label="Last Login"
              value={formatDate(account.last_login)}
            />
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HiOutlineAcademicCap className="w-4 h-4 text-slate-400" />
              Academic Information
            </h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <InfoRow
              label="Alumni ID"
              value={academic.alumni_id || "Not yet assigned"}
            />
            <InfoRow
              label="Course"
              value={
                academic.course
                  ? `${academic.course.code} — ${academic.course.name}`
                  : "N/A"
              }
            />
            <InfoRow
              label="Department"
              value={academic.department?.name || "N/A"}
            />
            <InfoRow label="Graduation Year" value={academic.graduation_year} />
            <InfoRow
              label="Board Program"
              value={academic.course?.is_board_program ? "Yes" : "No"}
            />
          </div>
        </div>
      </div>

      {/* ━━━━ Quick Actions (Future Phases) ━━━━ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          Getting Started
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            icon={HiOutlineBriefcase}
            title="Update Employment"
            desc="Share your current work status"
            color="emerald"
            onClick={() => navigate("/alumni/employment")}
          />
          <QuickAction
            icon={HiOutlineClipboardDocumentCheck}
            title="Board Exam Results"
            desc="Record your board exam status"
            color="amber"
            disabled={!academic.course?.is_board_program}
            onClick={
              academic.course?.is_board_program
                ? () => navigate("/alumni/board-exam")
                : undefined
            }
          />
          <QuickAction
            icon={HiOutlineEnvelope}
            title="Update Contact Info"
            desc="Keep your details current"
            color="blue"
            onClick={() => navigate("/alumni/profile")}
          />
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center">
          Keep your records updated to help PAC track alumni outcomes.
        </p>
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
        {label}
      </span>
      <span className="text-sm text-slate-700 font-medium text-right break-all">
        {value}
      </span>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, color, disabled, onClick }) {
  const bgColors = {
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    blue: "bg-blue-50",
  };
  const iconColors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
  };

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-slate-200 hover:shadow-sm cursor-pointer"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg ${bgColors[color]} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-4.5 h-4.5 ${iconColors[color]}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{title}</p>
        <p className="text-xs text-slate-400 truncate">{desc}</p>
      </div>
    </div>
  );
}
