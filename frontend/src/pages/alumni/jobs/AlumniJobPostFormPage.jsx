// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/alumni/jobs/AlumniJobPostFormPage.jsx
//  Route shell around AlumniJobPostForm — /alumni/careers/new (create) and
//  /alumni/careers/:id/edit (edit). Posts go live immediately.
// ═══════════════════════════════════════════════════════════

import { useParams, useNavigate } from "react-router-dom";
import AlumniJobPostForm from "../../../components/alumni/jobs/AlumniJobPostForm";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function AlumniJobPostFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Return to the Career Center on the "My Posts" tab either way.
  const backToMyPosts = () => navigate("/alumni/careers?tab=mine");

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={backToMyPosts}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to Career Center
      </button>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          {isEdit ? "Edit Job Posting" : "Post a Job"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit
            ? "Update the details of your job posting."
            : "Share an opening with your fellow PAC alumni. Your post goes live right away."}
        </p>
      </div>

      <AlumniJobPostForm
        jobId={isEdit ? Number(id) : null}
        onSuccess={backToMyPosts}
        onCancel={backToMyPosts}
      />
    </div>
  );
}
