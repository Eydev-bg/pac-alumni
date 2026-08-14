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
import { storageUrl } from "../../../utils/formatters";
import { prepareImageForUpload } from "../../../utils/imageCompression";
import SkeletonCard from "../../../components/common/SkeletonCard";
import {
  AlumniCard,
  SectionHeader,
  Avatar,
  Badge,
  ImageLightbox,
} from "../../../components/alumni/ui";
import {
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCamera,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import InfoRow from "./components/InfoRow";
import DirectoryVisibilitySection from "./sections/DirectoryVisibilitySection";
import EmploymentSection from "./sections/EmploymentSection";
import BoardExamSection from "./sections/BoardExamSection";
import CompletionSection from "./sections/CompletionSection";
import {
  inputBase,
  inputOk,
  inputErr,
  fieldLabel,
  btnPrimary,
  btnGhost,
} from "./styles";

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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
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
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const isHeicByName = /\.(heic|heif)$/i.test(file.name || "");
    if (!validTypes.includes(file.type) && !isHeicByName) {
      toast.error(
        "Only JPEG, PNG, WebP, or iPhone (HEIC) images are accepted.",
      );
      return;
    }
    setUploadingPicture(true);
    try {
      // Pipeline: convert HEIC (iPhone photos) to JPEG first, since almost
      // no browser besides Safari can preview/decode HEIC — then downscale
      // + re-encode if the result is still over 2MB. Modern phone cameras
      // (iPhone, Honor, Samsung, etc.) easily exceed 2MB straight out of
      // the camera, so only actually-oversized images get compressed.
      const uploadFile = await prepareImageForUpload(file, 2 * 1024 * 1024, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        mimeType: file.type === "image/png" ? "image/png" : "image/jpeg",
      });
      if (uploadFile.size > 2 * 1024 * 1024) {
        toast.error("Image must not exceed 2MB, even after compression.");
        return;
      }
      await alumniApi.uploadProfilePicture(uploadFile);
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
      setShowRemoveConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <SkeletonCard variant="form" count={1} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <HiOutlineExclamationTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {error}
          </p>
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
                onClick={() =>
                  setLightboxSrc(storageUrl(personal.profile_picture))
                }
                title="Click to view full size"
                className="w-24 h-24 rounded-full object-cover border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
            ) : (
              <Avatar
                name={personal.full_name}
                size="xl"
                className="w-24 h-24 rounded-full text-2xl"
              />
            )}

            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                title="Upload photo"
                className="pointer-events-auto w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {uploadingPicture ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <HiOutlineCamera className="w-4 h-4 text-white" />
                )}
              </button>
              {personal.profile_picture && (
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={removingPicture}
                  title="Remove photo"
                  className="pointer-events-auto w-9 h-9 rounded-xl bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center transition-colors disabled:opacity-50"
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
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 cursor-pointer hover:scale-110 transition-transform"
              onClick={() => fileInputRef.current?.click()}
            >
              <HiOutlineCamera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Name + badges */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
              {personal.full_name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
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

        {/* Inline remove-picture confirmation (replaces the browser confirm). */}
        {showRemoveConfirm && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
            <p className="flex-1 text-sm font-medium text-red-700 dark:text-red-300 text-center sm:text-left">
              Remove your profile picture?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleRemovePicture}
                disabled={removingPicture}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[0.78rem] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {removingPicture ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Removing…
                  </>
                ) : (
                  <>
                    <HiOutlineTrash className="w-4 h-4" />
                    Yes, Remove
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                disabled={removingPicture}
                className={btnGhost}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </AlumniCard>

      {/* ══ A) Personal Information ══ */}
      <AlumniCard>
        <SectionHeader
          title="Personal Information"
          action={
            !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.72rem] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 rounded-lg transition-colors"
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
                    setEditForm({
                      ...editForm,
                      current_location: e.target.value,
                    })
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

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700">
              <div className="flex items-start gap-2.5">
                <HiOutlineShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[0.72rem] font-medium text-slate-600 dark:text-slate-300">
                    Email:{" "}
                    <span className="text-slate-800 dark:text-slate-100">
                      {personal.email}
                    </span>
                  </p>
                  <p className="text-[0.65rem] text-slate-400 mt-0.5">
                    Email cannot be changed. Contact admin for email updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className={btnPrimary}
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
                className={btnGhost}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow
              icon={HiOutlineUser}
              label="Full Name"
              value={personal.full_name}
            />
            <InfoRow
              icon={HiOutlineEnvelope}
              label="Email Address"
              value={personal.email}
            />
            <InfoRow
              icon={HiOutlinePhone}
              label="Contact Number"
              value={personal.phone || "Not set"}
            />
            <InfoRow
              icon={HiOutlineMapPin}
              label="Current Location"
              value={location.current_location || "Not set"}
            />
          </div>
        )}
      </AlumniCard>

      {/* ══ B) Academic Information (read-only) ══ */}
      <AlumniCard>
        <SectionHeader title="Academic Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
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
            label="Graduation Year / Batch"
            value={academic.graduation_year}
          />
          <InfoRow
            icon={HiOutlineClipboardDocumentCheck}
            label="Board Program"
            value={academic.is_board_program ? "Yes" : "No"}
          />
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

      {/* Full-size profile picture viewer */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={personal.full_name}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
