// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/AlumniProfilePage.jsx
//  Unified "My Profile" — blue light-SaaS redesign (Phase A, Batch 3).
//  Consolidates the previously separate Profile + Employment + Board Exam
//  pages into ONE /alumni/profile with clear stacked sections:
//    A) Personal  B) Academic  C) Employment  D) Board Exam (conditional)
//    E) Profile Completion
//  Each section keeps its OWN existing endpoint — Personal → PUT /profile,
//  Employment → POST /employment, Board Exam → POST /board-exam. Nothing is
//  merged into a new backend call. The standalone /alumni/employment and
//  /alumni/board-exam routes stay registered so deep links keep working.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import alumniApi from "../../../api/alumniApi";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { storageUrl, formatDateOnly } from "../../../utils/formatters";
import StatusBadge from "../../../components/common/StatusBadge";
import SkeletonCard from "../../../components/common/SkeletonCard";
import {
  AlumniCard,
  IconChip,
  SectionHeader,
  ProgressBar,
  Avatar,
  Badge,
  Select,
} from "../../../components/alumni/ui";
import {
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineCalendarDays,
  HiOutlineBriefcase,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCamera,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
  HiOutlineUserCircle,
  HiOutlineBellAlert,
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineXCircle,
  HiOutlineDocumentArrowUp,
  HiOutlinePaperClip,
  HiOutlineDocumentText,
  HiOutlineTrophy,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from "react-icons/hi2";

// Shared input styling (blue focus ring) — keeps every field consistent.
const inputBase =
  "w-full py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white outline-none transition-all focus:ring-2";
const inputOk = "border-slate-200 focus:border-blue-500 focus:ring-blue-500/15";
const inputErr = "border-red-300 focus:border-red-400 focus:ring-red-500/15";
const fieldLabel = "block text-[0.72rem] font-semibold text-slate-600 mb-1.5";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[0.78rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
const btnGhost =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[0.78rem] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-60";

// ═══════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════

export default function AlumniProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Personal-info edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", current_location: "" });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Picture state
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);
  const fileInputRef = useRef(null);

  // Bumped whenever any section saves, so the completion card re-fetches.
  const [reloadSignal, setReloadSignal] = useState(0);
  const bump = useCallback(() => setReloadSignal((n) => n + 1), []);

  // Board Exam section is gated on the same auth flag the sidebar used.
  const isBoardProgram = user?.is_board_program === true;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await alumniApi.getProfile();
      setProfile(res.data.data);
      setEditForm({
        phone: res.data.data.personal.phone || "",
        current_location: res.data.data.location.current_location || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setFieldErrors({});
    setSaving(true);
    try {
      await alumniApi.updateProfile(editForm);
      await loadProfile();
      bump();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setEditForm({
      phone: profile.personal.phone || "",
      current_location: profile.location.current_location || "",
    });
  };

  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are accepted.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must not exceed 2MB.");
      return;
    }
    setUploadingPicture(true);
    try {
      await alumniApi.uploadProfilePicture(file);
      await loadProfile();
      bump();
      toast.success("Profile picture updated!");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.profile_picture?.[0] ||
        err.response?.data?.message ||
        "Failed to upload picture.";
      toast.error(msg);
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePicture = async () => {
    if (!confirm("Remove your profile picture?")) return;
    setRemovingPicture(true);
    try {
      await alumniApi.removeProfilePicture();
      await loadProfile();
      bump();
      toast.success("Profile picture removed.");
    } catch {
      toast.error("Failed to remove picture.");
    } finally {
      setRemovingPicture(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SkeletonCard variant="form" count={1} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <HiOutlineExclamationTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={loadProfile} className={btnPrimary}>
            <HiOutlineArrowPath className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { personal, academic, location } = profile;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ══ Profile hero ══ */}
      {/* Personal section anchor — photo lives here; contact + location are in
          the Personal Information card immediately below. Completion checklist
          items for photo / contact / location all scroll here. */}
      <AlumniCard id="section-personal" className="scroll-mt-20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Photo + upload/remove overlay */}
          <div className="relative group flex-shrink-0">
            {personal.profile_picture ? (
              <img
                src={storageUrl(personal.profile_picture)}
                alt={personal.full_name}
                className="w-24 h-24 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <Avatar
                name={personal.full_name}
                size="xl"
                className="w-24 h-24 rounded-full text-2xl"
              />
            )}

            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                title="Upload photo"
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {uploadingPicture ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <HiOutlineCamera className="w-4 h-4 text-white" />
                )}
              </button>
              {personal.profile_picture && (
                <button
                  onClick={handleRemovePicture}
                  disabled={removingPicture}
                  title="Remove photo"
                  className="w-9 h-9 rounded-xl bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {removingPicture ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <HiOutlineTrash className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              aria-label="Upload profile picture"
              onChange={handlePictureSelect}
            />

            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform"
              onClick={() => fileInputRef.current?.click()}
            >
              <HiOutlineCamera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Name + badges */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-xl font-bold text-slate-800 truncate">
              {personal.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              {personal.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <Badge color="blue" size="md">
                <HiOutlineIdentification className="w-3.5 h-3.5" />
                {academic.alumni_id || "No ID"}
              </Badge>
              <Badge color="slate" size="md">
                <HiOutlineAcademicCap className="w-3.5 h-3.5" />
                {academic.course_code || "N/A"}
              </Badge>
              <Badge color="purple" size="md">
                <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                Batch {academic.graduation_year}
              </Badge>
            </div>
          </div>
        </div>
      </AlumniCard>

      {/* ══ A) Personal Information ══ */}
      <AlumniCard>
        <SectionHeader
          title="Personal Information"
          action={
            !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.72rem] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : null
          }
        />

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-phone" className={fieldLabel}>
                Contact Number
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  placeholder="e.g. 09171234567"
                  maxLength={20}
                  className={`${inputBase} pl-10 pr-3 ${fieldErrors.phone ? inputErr : inputOk}`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-[0.68rem] text-red-500 mt-1">
                  {fieldErrors.phone[0]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="profile-location" className={fieldLabel}>
                Current Location
              </label>
              <div className="relative">
                <HiOutlineMapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <textarea
                  id="profile-location"
                  autoComplete="street-address"
                  value={editForm.current_location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, current_location: e.target.value })
                  }
                  placeholder="e.g. Cagayan de Oro City, Philippines"
                  maxLength={300}
                  rows={2}
                  className={`${inputBase} pl-10 pr-3 resize-none ${fieldErrors.current_location ? inputErr : inputOk}`}
                />
              </div>
              {fieldErrors.current_location && (
                <p className="text-[0.68rem] text-red-500 mt-1">
                  {fieldErrors.current_location[0]}
                </p>
              )}
              <p className="text-[0.65rem] text-slate-400 mt-1 text-right">
                {editForm.current_location.length}/300
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="flex items-start gap-2.5">
                <HiOutlineShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[0.72rem] font-medium text-slate-600">
                    Email:{" "}
                    <span className="text-slate-800">{personal.email}</span>
                  </p>
                  <p className="text-[0.65rem] text-slate-400 mt-0.5">
                    Email cannot be changed. Contact admin for email updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className={btnPrimary}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button onClick={handleCancel} disabled={saving} className={btnGhost}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow icon={HiOutlineUser} label="Full Name" value={personal.full_name} />
            <InfoRow icon={HiOutlineEnvelope} label="Email Address" value={personal.email} />
            <InfoRow icon={HiOutlinePhone} label="Contact Number" value={personal.phone || "Not set"} />
            <InfoRow icon={HiOutlineMapPin} label="Current Location" value={location.current_location || "Not set"} />
          </div>
        )}
      </AlumniCard>

      {/* ══ B) Academic Information (read-only) ══ */}
      <AlumniCard>
        <SectionHeader title="Academic Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <InfoRow icon={HiOutlineIdentification} label="Alumni ID" value={academic.alumni_id || "Not yet assigned"} highlight />
          <InfoRow
            icon={HiOutlineAcademicCap}
            label="Course"
            value={academic.course_code ? `${academic.course_code} — ${academic.course_name}` : "N/A"}
          />
          <InfoRow icon={HiOutlineBuildingOffice2} label="Department" value={academic.department_name || "N/A"} />
          <InfoRow icon={HiOutlineCalendarDays} label="Graduation Year / Batch" value={academic.graduation_year} />
          <InfoRow icon={HiOutlineClipboardDocumentCheck} label="Board Program" value={academic.is_board_program ? "Yes" : "No"} />
        </div>
      </AlumniCard>

      {/* ══ B2) Directory Visibility (privacy opt-out) ══ */}
      <DirectoryVisibilitySection
        initial={profile.preferences?.is_directory_visible ?? true}
      />

      {/* ══ C) Employment Information ══ */}
      <EmploymentSection onSaved={bump} />

      {/* ══ D) Board Exam Information (conditional) ══ */}
      {isBoardProgram && <BoardExamSection onSaved={bump} />}

      {/* ══ E) Profile Completion ══ */}
      <CompletionSection reloadSignal={reloadSignal} />
    </div>
  );
}

// ─── Read-only info row ──────────────────────────────────────
function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <IconChip icon={Icon} color="slate" size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-[0.7rem] text-slate-400 font-medium">{label}</p>
        <p
          className={`text-[0.82rem] mt-0.5 break-words ${highlight ? "font-bold text-blue-700" : "font-medium text-slate-700"}`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  B2) DIRECTORY VISIBILITY — privacy opt-out (Phase B)
//  Reuses PUT /profile ({ is_directory_visible }). Optimistic:
//  flip immediately, revert on failure.
// ═══════════════════════════════════════════════════════════
function DirectoryVisibilitySection({ initial }) {
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
            <p className="text-sm font-semibold text-slate-800">
              Show my profile in the Alumni Directory
            </p>
            <p className="mt-0.5 text-[0.78rem] text-slate-500 leading-relaxed">
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
            visible ? "bg-blue-600" : "bg-slate-300"
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

// ═══════════════════════════════════════════════════════════
//  C) EMPLOYMENT — reuses GET /employment + POST /employment
// ═══════════════════════════════════════════════════════════

const typeConfig = {
  local: { icon: HiOutlineMapPin, label: "Local" },
  international: { icon: HiOutlineGlobeAlt, label: "International" },
  self_employed: { icon: HiOutlineUserCircle, label: "Self-employed" },
};

function EmploymentSection({ onSaved }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employment_status: "",
    company_name: "",
    job_title: "",
    industry: "",
    employment_type: "",
    start_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await alumniApi.getEmploymentData();
      setData(res.data.data);
    } catch {
      // Section stays in its empty state on failure.
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employment_status: "",
      company_name: "",
      job_title: "",
      industry: "",
      employment_type: "",
      start_date: "",
    });
    setFieldErrors({});
  };

  const cancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      // Unemployed submits status only — mirrors the standalone page exactly.
      const payload =
        formData.employment_status === "unemployed"
          ? { employment_status: "unemployed" }
          : { ...formData };
      await alumniApi.submitEmployment(payload);
      await load();
      onSaved?.();
      setShowForm(false);
      resetForm();
      toast.success(
        formData.employment_status === "employed"
          ? "Employment updated! The Admin team has been notified."
          : "Status updated to Unemployed. The Admin team has been notified.",
      );
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Failed to update.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const current = data?.current_status;
  const currentJob = data?.current_job;
  const records = data?.records ?? [];
  const industries = data?.industries ?? [];
  const isEmployed = current?.employment_status === "employed";
  const hasRecords = records.length > 0;

  return (
    <AlumniCard id="section-employment" className="scroll-mt-20">
      <SectionHeader
        title="Employment Information"
        action={
          !loading && current ? (
            <EmploymentBadge value={current.employment_status} label={current.employment_label} />
          ) : null
        }
      />

      {loading ? (
        <SkeletonCard variant="form" count={1} />
      ) : (
        <>
          {/* Current position highlight */}
          {isEmployed && currentJob && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-4 mb-4">
              <div className="flex items-start gap-3">
                <IconChip icon={HiOutlineBuildingOffice2} color="green" />
                <div className="min-w-0">
                  <p className="text-[0.65rem] text-emerald-600 font-semibold uppercase tracking-wider">
                    Current Position
                  </p>
                  <h4 className="text-sm font-bold text-emerald-900">{currentJob.job_title}</h4>
                  <p className="text-xs text-emerald-700 font-medium">{currentJob.company_name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[0.7rem] text-emerald-600">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlineBriefcase className="w-3.5 h-3.5" />
                      {currentJob.industry}
                    </span>
                    {currentJob.start_date && (
                      <span className="inline-flex items-center gap-1">
                        <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                        Since {formatDateOnly(currentJob.start_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update trigger / form */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[0.75rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
              Update Employment Status
            </button>
          )}

          {!showForm && !hasRecords && (
            <p className="text-[0.75rem] text-slate-400 mt-3">
              No employment information yet. Use the button above to record your
              current work status.
            </p>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Status choice */}
              <div>
                <label id="emp-status-label" className="block text-[0.72rem] font-semibold text-slate-600 mb-2">
                  Employment Status <span className="text-red-400">*</span>
                </label>
                <div role="group" aria-labelledby="emp-status-label" className="grid grid-cols-2 gap-3">
                  <StatusChoice
                    active={formData.employment_status === "employed"}
                    onClick={() => setFormData({ ...formData, employment_status: "employed" })}
                    icon={HiOutlineBriefcase}
                    tone="emerald"
                    title="Employed"
                    subtitle="I have a job"
                  />
                  <StatusChoice
                    active={formData.employment_status === "unemployed"}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        employment_status: "unemployed",
                        company_name: "",
                        job_title: "",
                        industry: "",
                        employment_type: "",
                        start_date: "",
                      })
                    }
                    icon={HiOutlineXCircle}
                    tone="amber"
                    title="Unemployed"
                    subtitle="Currently not working"
                  />
                </div>
                {fieldErrors.employment_status && (
                  <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.employment_status[0]}</p>
                )}
              </div>

              {/* Details — only when Employed */}
              {formData.employment_status === "employed" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emp-company" className={fieldLabel}>
                        Company Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="emp-company"
                          type="text"
                          autoComplete="organization"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="e.g. Accenture Philippines"
                          maxLength={300}
                          className={`${inputBase} pl-10 pr-3 ${fieldErrors.company_name ? inputErr : inputOk}`}
                        />
                      </div>
                      {fieldErrors.company_name && (
                        <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.company_name[0]}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="emp-title" className={fieldLabel}>
                        Job Title <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="emp-title"
                          type="text"
                          autoComplete="organization-title"
                          value={formData.job_title}
                          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                          placeholder="e.g. Software Engineer"
                          maxLength={200}
                          className={`${inputBase} pl-10 pr-3 ${fieldErrors.job_title ? inputErr : inputOk}`}
                        />
                      </div>
                      {fieldErrors.job_title && (
                        <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.job_title[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emp-industry" className={fieldLabel}>
                        Industry <span className="text-red-400">*</span>
                      </label>
                      <Select
                        id="emp-industry"
                        value={formData.industry}
                        onChange={(v) => setFormData({ ...formData, industry: v })}
                        options={industries.map((ind) => ({ value: ind, label: ind }))}
                        placeholder="Select industry"
                        error={!!fieldErrors.industry}
                      />
                      {fieldErrors.industry && (
                        <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.industry[0]}</p>
                      )}
                    </div>
                    <div>
                      <label id="emp-type-label" className={fieldLabel}>
                        Employment Type <span className="text-red-400">*</span>
                      </label>
                      <div role="group" aria-labelledby="emp-type-label" className="grid grid-cols-3 gap-2">
                        {Object.entries(typeConfig).map(([key, cfg]) => {
                          const TypeIcon = cfg.icon;
                          const selected = formData.employment_type === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setFormData({ ...formData, employment_type: key })}
                              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                                selected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <TypeIcon className={`w-4 h-4 ${selected ? "text-blue-600" : "text-slate-400"}`} />
                              <span className={`text-[0.65rem] font-semibold ${selected ? "text-blue-700" : "text-slate-500"}`}>
                                {cfg.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {fieldErrors.employment_type && (
                        <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.employment_type[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="max-w-xs">
                    <label htmlFor="emp-start" className={fieldLabel}>
                      Start Date <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="emp-start"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        max={new Date().toISOString().split("T")[0]}
                        className={`${inputBase} pl-10 pr-3 ${inputOk}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.employment_status && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                  <div className="flex items-start gap-2.5">
                    <HiOutlineBellAlert className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[0.72rem] text-blue-700 leading-relaxed">
                      The <span className="font-semibold">Admin</span> team will be automatically
                      notified about this employment update.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !formData.employment_status ||
                    (formData.employment_status === "employed" &&
                      (!formData.company_name || !formData.job_title || !formData.industry || !formData.employment_type))
                  }
                  className={btnPrimary}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Save Employment
                    </>
                  )}
                </button>
                <button type="button" onClick={cancelForm} disabled={submitting} className={btnGhost}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* History */}
          {hasRecords && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[0.72rem] font-semibold text-slate-500 mb-2">
                Employment History ({records.length})
              </p>
              <div className="divide-y divide-slate-100">
                {records.map((rec) => {
                  const tc = typeConfig[rec.employment_type] || typeConfig.local;
                  const TypeIcon = tc.icon;
                  return (
                    <div key={rec.id} className="py-3 flex items-start gap-3">
                      <IconChip
                        icon={HiOutlineBuildingOffice2}
                        color={rec.is_current ? "green" : "slate"}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-[0.82rem] font-bold text-slate-800">{rec.job_title}</h5>
                          {rec.is_current && <Badge color="green">Current</Badge>}
                        </div>
                        <p className="text-[0.78rem] text-slate-600 font-medium">{rec.company_name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[0.7rem] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <TypeIcon className="w-3.5 h-3.5" />
                            {rec.employment_type_label}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineBriefcase className="w-3.5 h-3.5" />
                            {rec.industry}
                          </span>
                          {rec.start_date && (
                            <span className="inline-flex items-center gap-1">
                              <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                              {formatDateOnly(rec.start_date)}
                              {rec.end_date ? (
                                <>
                                  {" "}
                                  <HiOutlineChevronRight className="w-3 h-3" /> {formatDateOnly(rec.end_date)}
                                </>
                              ) : (
                                <> — Present</>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </AlumniCard>
  );
}

function StatusChoice({ active, onClick, icon: Icon, tone, title, subtitle }) {
  const toneCls = active
    ? tone === "emerald"
      ? "border-emerald-400 bg-emerald-50"
      : "border-amber-300 bg-amber-50"
    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50";
  const iconBg = active ? (tone === "emerald" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600") : "bg-slate-100 text-slate-400";
  const titleCls = active ? (tone === "emerald" ? "text-emerald-800" : "text-amber-800") : "text-slate-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${toneCls}`}
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="text-left">
        <span className={`block text-sm font-bold ${titleCls}`}>{title}</span>
        <span className="block text-[0.68rem] text-slate-400">{subtitle}</span>
      </span>
    </button>
  );
}

function EmploymentBadge({ value, label }) {
  const color = value === "employed" ? "green" : value === "unemployed" ? "orange" : "slate";
  return <Badge color={color} size="md">{label}</Badge>;
}

// ═══════════════════════════════════════════════════════════
//  D) BOARD EXAM — reuses GET /board-exam + POST /board-exam
//  Statuses stay not_taken / passed / not_applicable. The alumni only ever
//  SUBMITS "passed"; "Not Yet Taken" is system-derived. No failed/conditional.
// ═══════════════════════════════════════════════════════════

function BoardExamSection({ onSaved }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [naProgram, setNaProgram] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "", exam_year: "" });
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await alumniApi.getBoardExamData();
      setData(res.data.data);
    } catch (err) {
      // 403 = course isn't a board program (shouldn't happen given the gate,
      // but handle it so the section self-hides instead of erroring).
      if (err.response?.status === 403) setNaProgram(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, or PDF files are accepted.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must not exceed 5MB.");
      e.target.value = "";
      return;
    }
    setProofFile(file);
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({ status: "", exam_year: "" });
    setProofFile(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await alumniApi.submitBoardExam(formData, proofFile);
      await load();
      onSaved?.();
      setShowForm(false);
      setFormData({ status: "", exam_year: "" });
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Board exam result submitted successfully! The Admin team has been notified.");
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Failed to submit.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (naProgram) return null;

  const course = data?.course;
  const current = data?.current_status;
  const records = data?.records ?? [];
  const hasRecords = records.length > 0;
  const isPassed = current?.board_status === "passed";

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear + 1; y >= 1990; y--) yearOptions.push(y);

  return (
    <AlumniCard id="section-board-exam" className="scroll-mt-20">
      <SectionHeader
        title="Board Exam Information"
        action={
          !loading && current ? (
            <StatusBadge status={current.board_status} label={current.board_label} />
          ) : null
        }
      />

      {loading ? (
        <SkeletonCard variant="form" count={1} />
      ) : (
        <>
          {course?.name && (
            <p className="text-[0.72rem] text-slate-400 -mt-2 mb-4">
              {course.board_exam_name || "Board Examination"} · {course.name}
            </p>
          )}

          {isPassed && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-4 mb-4">
              <div className="flex items-start gap-3">
                <IconChip icon={HiOutlineTrophy} color="green" />
                <div>
                  <h4 className="text-[0.85rem] font-bold text-emerald-800">
                    Congratulations, Licensed Professional!
                  </h4>
                  <p className="text-[0.75rem] text-emerald-600 mt-0.5 leading-relaxed">
                    You have passed the {course?.board_exam_name || "board exam"}. Your achievement
                    is recorded. You may still submit additional records if applicable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[0.75rem] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              <HiOutlineClipboardDocumentCheck className="w-4 h-4" />
              {hasRecords ? "Submit Another Result" : "Record Board Exam Result"}
            </button>
          )}

          {!showForm && !hasRecords && (
            <p className="text-[0.75rem] text-slate-400 mt-3">
              No board exam records yet. Use the button above to record your{" "}
              {course?.board_exam_name || "board exam"} result.
            </p>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Result — the alumni can only submit "passed". */}
              <div>
                <label className="block text-[0.72rem] font-semibold text-slate-600 mb-2">
                  Exam Result <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: "passed" })}
                  className={`relative flex items-center gap-3 p-4 w-full rounded-xl border-2 transition-all ${
                    formData.status === "passed" ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.status === "passed" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    <HiOutlineCheckCircle className="w-5 h-5" />
                  </span>
                  <span className="text-left">
                    <span className={`block text-sm font-bold ${formData.status === "passed" ? "text-emerald-800" : "text-slate-700"}`}>
                      Passed
                    </span>
                    <span className="block text-[0.68rem] text-slate-400">I passed the exam</span>
                  </span>
                </button>
                {fieldErrors.status && <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.status[0]}</p>}
              </div>

              {/* Exam Year */}
              <div>
                <label htmlFor="board-year" className={fieldLabel}>
                  Exam Year <span className="text-red-400">*</span>
                </label>
                <Select
                  id="board-year"
                  value={formData.exam_year}
                  onChange={(v) => setFormData({ ...formData, exam_year: v })}
                  options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
                  placeholder="Select exam year"
                  error={!!fieldErrors.exam_year}
                  leftIcon={HiOutlineCalendarDays}
                />
                {fieldErrors.exam_year && <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.exam_year[0]}</p>}
              </div>

              {/* Proof (optional) */}
              <div>
                <label htmlFor="board-proof" className={fieldLabel}>
                  Proof Document <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {!proofFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400/50 hover:bg-blue-50/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-2 transition-colors">
                      <HiOutlineDocumentArrowUp className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <p className="text-[0.78rem] font-medium text-slate-600">Click to upload proof</p>
                    <p className="text-[0.68rem] text-slate-400 mt-0.5">JPEG, PNG, or PDF — Max 5MB</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <IconChip icon={HiOutlinePaperClip} color="blue" size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.78rem] font-medium text-slate-700 truncate">{proofFile.name}</p>
                      <p className="text-[0.65rem] text-slate-400">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
                <input
                  id="board-proof"
                  ref={fileInputRef}
                  type="file"
                  accept=".jpeg,.jpg,.png,.pdf"
                  className="hidden"
                  aria-label="Upload proof document"
                  onChange={handleFileSelect}
                />
                {fieldErrors.proof_file && <p className="text-[0.68rem] text-red-500 mt-1">{fieldErrors.proof_file[0]}</p>}
              </div>

              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <div className="flex items-start gap-2.5">
                  <HiOutlineBellAlert className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[0.72rem] text-blue-700 leading-relaxed">
                    Upon submission, the <span className="font-semibold">Admin</span> team will be
                    automatically notified about your board exam result.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="submit" disabled={submitting || !formData.status || !formData.exam_year} className={btnPrimary}>
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Submit Result
                    </>
                  )}
                </button>
                <button type="button" onClick={cancelForm} disabled={submitting} className={btnGhost}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* History */}
          {hasRecords && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[0.72rem] font-semibold text-slate-500 mb-2">
                Exam History ({records.length})
              </p>
              <div className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <div key={rec.id} className="py-3 flex items-start gap-3">
                    <IconChip
                      icon={rec.status === "passed" ? HiOutlineTrophy : HiOutlineDocumentText}
                      color={rec.status === "passed" ? "green" : "slate"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-[0.82rem] font-bold text-slate-800">{rec.exam_name}</h5>
                        <StatusBadge status={rec.status} label={rec.status_label} />
                        {rec.is_current && <Badge color="purple">Current</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap text-[0.7rem] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                          Exam Year: {rec.exam_year}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineClock className="w-3.5 h-3.5" />
                          Submitted: {formatDateOnly(rec.created_at)}
                        </span>
                        {rec.verified_at && (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      {rec.proof_file && (
                        <a
                          href={storageUrl(rec.proof_file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1.5 text-[0.72rem] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <HiOutlinePaperClip className="w-3.5 h-3.5" />
                          View Proof Document
                          <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AlumniCard>
  );
}

// ═══════════════════════════════════════════════════════════
//  E) PROFILE COMPLETION — GET /profile/completion is the source of truth.
//  The frontend renders exactly what the backend returns; it does NOT compute
//  a competing percentage. Re-fetches when any section reports a save.
// ═══════════════════════════════════════════════════════════

function CompletionSection({ reloadSignal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    alumniApi
      .getProfileCompletion()
      .then((res) => active && setData(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Profile completion section failed:", err); })
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
          <div className="h-2 w-full bg-slate-100 rounded-full" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
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
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
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
        className={`text-xs mt-3 font-medium ${is_complete ? "text-emerald-600" : "text-slate-500"}`}
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
                className="group w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {item.done ? (
                    <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs truncate ${item.done ? "text-slate-400" : "text-slate-600 font-medium"}`}
                  >
                    {item.done ? item.label : item.hint}
                  </span>
                </span>
                {!item.done && (
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
