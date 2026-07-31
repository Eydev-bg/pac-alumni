// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/alumni/jobs/AlumniJobDetailPage.jsx
//  Job detail — Apply redirects to the external application link.
//  No application records are stored in this system.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import alumniApi from "../../../api/alumniApi";
import { formatDate, storageUrl } from "../../../utils/formatters";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineBuildingOffice2,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBriefcase,
  HiOutlineGift,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";

// Ensure the link has a scheme before opening (bare domains → https://).
function normalizeLink(link) {
  if (!link) return "";
  const trimmed = link.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function AlumniJobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    alumniApi
      .getJobPosting(id)
      .then((res) => setJob(res.data.data))
      .catch((err) =>
        setError(
          err.response?.status === 404
            ? "This job opening is no longer available."
            : "Failed to load the job opening.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  // External redirect ONLY — nothing is submitted to our system.
  const handleApply = () => {
    if (!job?.application_link) return;
    window.open(
      normalizeLink(job.application_link),
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-slate-500 text-sm">
        Loading job opening…
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <BackLink onClick={() => navigate("/alumni/careers")} />
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <HiOutlineBriefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            {error || "Job opening not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackLink onClick={() => navigate("/alumni/careers")} />

      {/* ━━━━ Header card ━━━━ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {job.company_logo ? (
            <img
              src={storageUrl(job.company_logo)}
              alt={job.company_name}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
            />
          ) : (
            <span className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <HiOutlineBuildingOffice2 className="w-7 h-7 text-slate-400" />
            </span>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800">
              {job.job_position}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">{job.company_name}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8rem] text-slate-500">
              <span className="flex items-center gap-1">
                <HiOutlineMapPin className="w-4 h-4 text-blue-600" />
                {job.location}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium text-xs">
                {job.employment_type_label}
              </span>
              {job.salary && (
                <span className="flex items-center gap-1">
                  <HiOutlineBanknotes className="w-4 h-4 text-emerald-600" />
                  {job.salary}
                </span>
              )}
              <span className="flex items-center gap-1">
                <HiOutlineClock className="w-4 h-4" />
                {job.application_deadline
                  ? `Deadline: ${formatDate(job.application_deadline)}`
                  : "Open until filled"}
              </span>
            </div>

            {job.company_email && (
              <p className="mt-2 text-[0.8rem] text-slate-500 flex items-center gap-1">
                <HiOutlineEnvelope className="w-4 h-4" />
                <a
                  href={`mailto:${job.company_email}`}
                  className="text-blue-600 hover:underline"
                >
                  {job.company_email}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Apply — external redirect only, never an internal POST. */}
        {job.application_link && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Apply Now
              <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
            </button>
            <p className="mt-2 text-[0.72rem] text-slate-400">
              You'll be redirected to an external site to apply.
            </p>
          </div>
        )}
      </div>

      {/* ━━━━ Description ━━━━ */}
      <Section icon={HiOutlineBriefcase} title="Job Description">
        <div
          className="job-content text-sm text-slate-600 leading-relaxed break-words"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(job.description),
          }}
        />
      </Section>

      {/* ━━━━ Requirements ━━━━ */}
      {job.requirements && (
        <Section icon={HiOutlineClipboardDocumentList} title="Requirements">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">
            {job.requirements}
          </p>
        </Section>
      )}

      {/* ━━━━ Benefits ━━━━ */}
      {job.benefits && (
        <Section icon={HiOutlineGift} title="Benefits">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">
            {job.benefits}
          </p>
        </Section>
      )}

      {/* Minimal styling for rendered rich-text content (light surface). */}
      <style>{`.job-content{overflow-wrap:break-word;word-break:break-word}
        .job-content h1{font-size:1.25rem;font-weight:700;margin:.5rem 0;color:#1e293b}
        .job-content h2{font-size:1.1rem;font-weight:700;margin:.5rem 0;color:#1e293b}
        .job-content h3{font-size:1rem;font-weight:600;margin:.5rem 0;color:#1e293b}
        .job-content p{margin:.5rem 0}
        .job-content ul{list-style:disc;padding-left:1.25rem;margin:.5rem 0}
        .job-content ol{list-style:decimal;padding-left:1.25rem;margin:.5rem 0}
        .job-content a{color:#2563eb;text-decoration:underline;overflow-wrap:break-word}
        .job-content blockquote{border-left:3px solid #2563eb;padding-left:.75rem;color:#64748b;margin:.5rem 0}`}</style>
    </div>
  );
}

function BackLink({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
    >
      <HiOutlineArrowLeft className="w-4 h-4" /> Back to Career Center
    </button>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
