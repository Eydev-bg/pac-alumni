// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/directory/AlumniPublicProfilePage.jsx
//  Alumni Directory (Phase B) — a fellow alumnus's PUBLIC profile.
//  Professional/academic info only; the API never returns email or
//  phone, so none is shown here. "Send Message" reuses the existing
//  POST /alumni/conversations flow (recipient_id = this uuid).
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import { useToast } from "../../../hooks/useToast";
import { storageUrl } from "../../../utils/formatters";
import {
  AlumniCard,
  Avatar,
  Badge,
  SectionHeader,
  ImageLightbox,
} from "../../../components/alumni/ui";
import SkeletonCard from "../../../components/common/SkeletonCard";
import EmptyState from "../../../components/common/EmptyState";
import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleLeftRight,
  HiOutlineAcademicCap,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentCheck,
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from "react-icons/hi2";

export default function AlumniPublicProfilePage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setNotFound(false);
    alumniApi
      .getDirectoryProfile(uuid)
      .then((res) => setProfile(res.data.data))
      // 404 (hidden / not an alumni / unknown) all land here — the endpoint
      // deliberately doesn't distinguish them.
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  useEffect(() => {
    load();
  }, [load]);

  // Reuse the existing conversation flow, then open the thread. Self-message
  // (422) and non-alumni (403) shouldn't occur here (self is excluded, the
  // target is always an alumnus), but any error surfaces as a toast.
  const handleSendMessage = async () => {
    if (messaging) return;
    setMessaging(true);
    try {
      const res = await alumniApi.startConversation(uuid);
      navigate(`/alumni/messages?c=${res.data.data.id}`);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not open the conversation.",
      );
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-8">
          <SkeletonCard variant="form" count={1} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto">
        <BackLink />
        <div className="mt-6">
          <EmptyState
            icon={HiOutlineUsers}
            title="This profile isn't available"
            message="It may have been hidden by its owner, or the link is no longer valid."
            action={
              <Link
                to="/alumni/directory"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <HiOutlineUserGroup className="w-4 h-4" />
                Back to Directory
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const { personal, academic, employment, location, status } = profile;
  const hasEmployment =
    employment?.company || employment?.position || employment?.industry;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackLink />

      {/* ══ Hero ══ */}
      <AlumniCard className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {personal.profile_picture ? (
            <img
              src={storageUrl(personal.profile_picture)}
              alt={personal.full_name}
              onClick={() =>
                setLightboxSrc(storageUrl(personal.profile_picture))
              }
              title="Click to view full size"
              className="w-24 h-24 rounded-2xl object-cover border border-slate-200 flex-shrink-0 cursor-pointer"
            />
          ) : (
            <Avatar
              name={personal.full_name}
              size="xl"
              className="w-24 h-24 rounded-2xl text-2xl"
            />
          )}

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              {personal.full_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              {academic.course_code && (
                <Badge color="blue">{academic.course_code}</Badge>
              )}
              {academic.graduation_year && (
                <Badge color="slate">Batch {academic.graduation_year}</Badge>
              )}
              {employment?.employment_label && (
                <Badge color={employmentColor(employment.employment_status)}>
                  {employment.employment_label}
                </Badge>
              )}
            </div>
            {location?.current_location && (
              <p className="mt-2 flex items-center justify-center sm:justify-start gap-1.5 text-sm text-slate-500">
                <HiOutlineMapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                {location.current_location}
              </p>
            )}

            <button
              onClick={handleSendMessage}
              disabled={messaging}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {messaging ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opening…
                </>
              ) : (
                <>
                  <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </AlumniCard>

      {/* ══ Academic ══ */}
      <AlumniCard>
        <SectionHeader title="Academic Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <InfoRow
            icon={HiOutlineAcademicCap}
            label="Course"
            value={
              academic.course_code
                ? `${academic.course_code} — ${academic.course_name}`
                : academic.course_name || "N/A"
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
            value={academic.graduation_year || "N/A"}
          />
          {academic.education_level_label && (
            <InfoRow
              icon={HiOutlineUserGroup}
              label="Education Level"
              value={academic.education_level_label}
            />
          )}
          {academic.is_board_program && (
            <InfoRow
              icon={HiOutlineClipboardDocumentCheck}
              label="Board Status"
              value={status?.board_label || "—"}
            />
          )}
        </div>
      </AlumniCard>

      {/* ══ Employment ══ */}
      <AlumniCard>
        <SectionHeader title="Employment" />
        {hasEmployment ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow
              icon={HiOutlineBriefcase}
              label="Position"
              value={employment.position || "—"}
            />
            <InfoRow
              icon={HiOutlineBuildingOffice2}
              label="Company"
              value={employment.company || "—"}
            />
            <InfoRow
              icon={HiOutlineUsers}
              label="Industry"
              value={employment.industry || "—"}
            />
            <InfoRow
              icon={HiOutlineClipboardDocumentCheck}
              label="Status"
              value={employment.employment_label || "—"}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No employment information shared.
          </p>
        )}
      </AlumniCard>

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

// ─── Back to Directory link ─────────────────────────────────
function BackLink() {
  return (
    <Link
      to="/alumni/directory"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
    >
      <HiOutlineArrowLeft className="w-4 h-4" />
      Back to Directory
    </Link>
  );
}

// ─── Read-only info row (mirrors the My Profile InfoRow) ────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 sm:[&:nth-last-child(2)]:border-0">
      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
}

// employed → green, unemployed → orange, unknown/other → slate.
function employmentColor(statusValue) {
  if (statusValue === "employed") return "green";
  if (statusValue === "unemployed") return "orange";
  return "slate";
}
