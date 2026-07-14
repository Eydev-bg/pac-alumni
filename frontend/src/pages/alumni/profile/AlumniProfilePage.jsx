// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/AlumniProfilePage.jsx
//  Alumni Profile Management — Features 5-8
//  Edit contact info, update location, upload profile picture.
//  Design: Matches existing PAC Alumni design system.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import alumniApi from "../../../api/alumniApi";
import { storageUrl } from "../../../utils/formatters";
import {
  HiOutlineUser,
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
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

// ─── Toast Notification ──────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  const icons = {
    success: HiOutlineCheckCircle,
    error: HiOutlineExclamationTriangle,
  };

  const Icon = icons[type];

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity"
        >
          <HiOutlineXMark className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Section Card Wrapper ────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1a2e5a]/[0.07] flex items-center justify-center">
            <Icon className="w-[18px] h-[18px] text-[#1a2e5a]" />
          </div>
          <div>
            <h3 className="text-[0.82rem] font-bold text-slate-800">{title}</h3>
            {subtitle && (
              <p className="text-[0.7rem] text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Read-only Info Row ──────────────────────────────────
function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-3 py-2.5 group">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-slate-100 transition-colors">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.7rem] text-slate-400 font-medium">{label}</p>
        <p
          className={`text-[0.82rem] mt-0.5 break-all ${highlight ? "font-bold text-[#1a2e5a]" : "font-medium text-slate-700"}`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────
function StatusBadge({ value, label }) {
  const colors = {
    employed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    unemployed: "bg-amber-50 text-amber-700 border-amber-200",
    unknown: "bg-slate-50 text-slate-500 border-slate-200",
    passer: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-600 border-red-200",
    not_taken: "bg-amber-50 text-amber-700 border-amber-200",
    not_applicable: "bg-slate-50 text-slate-500 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[0.72rem] font-semibold border ${colors[value] || "bg-slate-50 text-slate-500 border-slate-200"}`}
    >
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AlumniProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", current_location: "" });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Picture state
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);
  const fileInputRef = useRef(null);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // ─── Load profile data ──────────────────────────────────
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

  // ─── Save contact info ──────────────────────────────────
  const handleSave = async () => {
    setFieldErrors({});
    setSaving(true);

    try {
      await alumniApi.updateProfile(editForm);
      await loadProfile();
      setIsEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        showToast(
          err.response?.data?.message || "Failed to update profile.",
          "error",
        );
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

  // ─── Profile picture upload ─────────────────────────────
  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Only JPEG, PNG, and WebP images are accepted.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must not exceed 2MB.", "error");
      return;
    }

    setUploadingPicture(true);
    try {
      await alumniApi.uploadProfilePicture(file);
      await loadProfile();
      showToast("Profile picture updated!");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.profile_picture?.[0] ||
        err.response?.data?.message ||
        "Failed to upload picture.";
      showToast(msg, "error");
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
      showToast("Profile picture removed.");
    } catch (err) {
      showToast("Failed to remove picture.", "error");
    } finally {
      setRemovingPicture(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a2e5a] mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────
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
          <button
            onClick={loadProfile}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1a2e5a] rounded-lg hover:bg-[#243a6e] transition-colors"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { personal, academic, location, status } = profile;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ━━━━ Profile Header with Avatar ━━━━ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2e5a] via-[#243a6e] to-[#1e3466] rounded-2xl shadow-lg">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-[#c8a84e]/[0.06]" />
        <div className="absolute top-8 right-24 w-20 h-20 rounded-full bg-white/[0.02] hidden sm:block" />
        <div className="absolute bottom-4 right-8 w-32 h-32 rounded-full bg-[#c8a84e]/[0.04] hidden lg:block" />

        <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* ── Avatar with upload overlay ── */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl overflow-hidden">
                {personal.profile_picture ? (
                  <img
                    src={storageUrl(personal.profile_picture)}
                    alt={personal.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-white/70">
                      {personal.first_name?.[0]}
                      {personal.last_name?.[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload overlay */}
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Upload photo"
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
                    className="w-9 h-9 rounded-xl bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Remove photo"
                  >
                    {removingPicture ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <HiOutlineTrash className="w-4 h-4 text-white" />
                    )}
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                aria-label="Upload profile picture"
                onChange={handlePictureSelect}
              />

              {/* Upload hint badge */}
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-[#c8a84e] flex items-center justify-center shadow-md border-2 border-[#1a2e5a] cursor-pointer hover:scale-110 transition-transform"
                onClick={() => fileInputRef.current?.click()}
              >
                <HiOutlineCamera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* ── Name & Quick Info ── */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="text-[0.72rem] text-[#c8a84e] font-semibold tracking-wider uppercase mb-1">
                My Profile
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {personal.full_name}
              </h1>
              <p className="text-sm text-white/60 mt-1 truncate">
                {personal.email}
              </p>

              {/* Quick badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/85 text-[0.7rem] font-medium px-3 py-1 rounded-full border border-white/10">
                  <HiOutlineIdentification className="w-3.5 h-3.5" />
                  {academic.alumni_id || "No ID"}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/85 text-[0.7rem] font-medium px-3 py-1 rounded-full border border-white/10">
                  <HiOutlineAcademicCap className="w-3.5 h-3.5" />
                  {academic.course_code || "N/A"}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#c8a84e]/20 text-[#c8a84e] text-[0.7rem] font-semibold px-3 py-1 rounded-full border border-[#c8a84e]/30">
                  <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                  Batch {academic.graduation_year}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━ Main Grid ━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Contact Information (Editable) ── */}
        <SectionCard
          icon={HiOutlineUser}
          title="Contact Information"
          subtitle="Manage your contact details"
          action={
            !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.72rem] font-semibold text-[#1a2e5a] bg-[#1a2e5a]/[0.07] hover:bg-[#1a2e5a]/[0.12] rounded-lg transition-colors"
              >
                <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : null
          }
        >
          {isEditing ? (
            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-[0.72rem] font-semibold text-slate-600 mb-1.5"
                >
                  Phone Number
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
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white outline-none transition-all duration-200 focus:ring-2 focus:bg-white ${
                      fieldErrors.phone
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                        : "border-slate-200 focus:border-[#1a2e5a] focus:ring-[#1a2e5a]/10"
                    }`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[0.68rem] text-red-500 mt-1">
                    {fieldErrors.phone[0]}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="profile-location"
                  className="block text-[0.72rem] font-semibold text-slate-600 mb-1.5"
                >
                  Current Location
                </label>
                <div className="relative">
                  <HiOutlineMapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <textarea
                    id="profile-location"
                    autoComplete="street-address"
                    value={editForm.current_location}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        current_location: e.target.value,
                      })
                    }
                    placeholder="e.g. Cagayan de Oro City, Philippines"
                    maxLength={300}
                    rows={2}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white outline-none transition-all duration-200 focus:ring-2 focus:bg-white resize-none ${
                      fieldErrors.current_location
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                        : "border-slate-200 focus:border-[#1a2e5a] focus:ring-[#1a2e5a]/10"
                    }`}
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

              {/* Email (read-only notice) */}
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

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[0.78rem] font-semibold text-white bg-[#1a2e5a] hover:bg-[#243a6e] rounded-xl transition-all duration-200 disabled:opacity-60 shadow-sm hover:shadow-md"
                >
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
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[0.78rem] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <InfoRow
                icon={HiOutlineEnvelope}
                label="Email Address"
                value={personal.email}
              />
              <InfoRow
                icon={HiOutlinePhone}
                label="Phone Number"
                value={personal.phone || "Not set"}
              />
              <InfoRow
                icon={HiOutlineMapPin}
                label="Current Location"
                value={location.current_location || "Not set"}
              />
            </div>
          )}
        </SectionCard>

        {/* ── Academic Information (Read-only) ── */}
        <SectionCard
          icon={HiOutlineAcademicCap}
          title="Academic Information"
          subtitle="Your academic records"
        >
          <div className="space-y-1">
            <InfoRow
              icon={HiOutlineIdentification}
              label="Alumni ID"
              value={academic.alumni_id || "Not yet assigned"}
              highlight
            />
            <InfoRow
              icon={HiOutlineAcademicCap}
              label="Course"
              value={
                academic.course_code
                  ? `${academic.course_code} — ${academic.course_name}`
                  : "N/A"
              }
            />
            <InfoRow
              icon={HiOutlineBuildingOffice2}
              label="Department"
              value={academic.department_name || "N/A"}
            />
            <InfoRow
              icon={HiOutlineCalendarDays}
              label="Graduation Year"
              value={academic.graduation_year}
            />
            <InfoRow
              icon={HiOutlineClipboardDocumentCheck}
              label="Board Program"
              value={academic.is_board_program ? "Yes" : "No"}
            />
          </div>
        </SectionCard>
      </div>

      {/* ━━━━ Status Cards Row ━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Employment Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <HiOutlineBriefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-[0.82rem] font-bold text-slate-800">
                Employment Status
              </h3>
              <p className="text-[0.68rem] text-slate-400 mt-0.5">
                Your current work status
              </p>
            </div>
          </div>
          <StatusBadge
            value={status.employment_status}
            label={status.employment_label}
          />
          <p className="text-[0.68rem] text-slate-400 mt-3">
            Employment details can be updated in the Employment module.
          </p>
        </div>

        {/* Board Exam Status */}
        {status.board_status !== "not_applicable" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[0.82rem] font-bold text-slate-800">
                  Board Exam Status
                </h3>
                <p className="text-[0.68rem] text-slate-400 mt-0.5">
                  Your licensure exam result
                </p>
              </div>
            </div>
            <StatusBadge
              value={status.board_status}
              label={status.board_label}
            />
            <p className="text-[0.68rem] text-slate-400 mt-3">
              Board exam results can be updated in the Board Exam module.
            </p>
          </div>
        )}
      </div>

      {/* ━━━━ Photo Guidelines Tip ━━━━ */}
      <div className="bg-gradient-to-r from-[#1a2e5a]/[0.03] to-[#c8a84e]/[0.04] rounded-2xl border border-slate-200/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c8a84e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <HiOutlineCamera className="w-[18px] h-[18px] text-[#c8a84e]" />
          </div>
          <div>
            <h4 className="text-[0.78rem] font-bold text-slate-800">
              Profile Photo Tips
            </h4>
            <p className="text-[0.72rem] text-slate-500 mt-1 leading-relaxed">
              Upload a clear, professional photo. Accepted formats: JPEG, PNG,
              or WebP. Maximum file size: 2MB. Recommended dimensions: at least
              200×200 pixels. Hover over your photo above to change or remove
              it.
            </p>
          </div>
        </div>
      </div>

      {/* CSS for toast animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
