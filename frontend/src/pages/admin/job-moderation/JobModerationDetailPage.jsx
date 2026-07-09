import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../utils/formatters";
import { JOB_TYPE_LABELS, formatSalaryRange } from "../../../config/jobOptions";
import Card from "../../../ui/Card";
import Modal from "../../../ui/Modal";
import Button from "../../../ui/Button";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";

// ─── Reject modal (reason required) ──────────────────────
function RejectModal({ open, loading, onConfirm, onCancel }) {
  const [notes, setNotes] = useState("");

  // Reset the reason each time the modal opens.
  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Reject Job Post"
      size="sm"
      closeOnBackdrop={!loading}
    >
      <p className="mt-1 text-sm text-slate-400">
        Provide a reason. The employer will see this note explaining why the post
        was rejected.
      </p>
      <div className="mt-4">
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Reason (required)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="e.g. Job description is incomplete or violates posting guidelines."
          className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/30"
        />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => onConfirm(notes)}
          disabled={loading || !notes.trim()}
          loading={loading}
        >
          {loading ? "Processing..." : "Reject"}
        </Button>
      </div>
    </Modal>
  );
}

export default function JobModerationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await adminApi.getJobPost(id);
      setJob(res.data.data);
    } catch {
      toast.error("Job post not found.");
      navigate("/admin/job-posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await adminApi.approveJobPost(id);
      setJob(res.data.data);
      setShowApprove(false);
      toast.success("Job post approved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve job post.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (notes) => {
    setActionLoading(true);
    try {
      const res = await adminApi.rejectJobPost(id, notes);
      setJob(res.data.data);
      setShowReject(false);
      toast.success("Job post rejected.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject job post.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await adminApi.deleteJobPost(id);
      toast.success("Job post deleted.");
      navigate("/admin/job-posts");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete job post.");
      setActionLoading(false);
    }
  };

  const actionBtn =
    "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors border";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
        <p className="text-sm text-slate-500">Loading job post...</p>
      </div>
    );
  }

  if (!job) return null;

  const salary = formatSalaryRange(job.salary_range_min, job.salary_range_max);

  return (
    <>
      <div className="max-w-[1000px] mx-auto">
        <button
          onClick={() => navigate("/admin/job-posts")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-gold-500 mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Job Moderation
        </button>

        {/* Header Card */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{job.title}</h1>
                <StatusBadge status={job.status} label={job.status} />
                {!job.is_open && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    Closed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                <HiOutlineBuildingOffice2 className="w-4 h-4 text-gold-500" />
                {job.company_name || job.employer?.company_name}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {job.status !== "approved" && (
                <button
                  onClick={() => setShowApprove(true)}
                  className={`${actionBtn} text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20`}
                >
                  <HiOutlineCheckCircle className="w-4 h-4" /> Approve
                </button>
              )}
              {job.status !== "rejected" && (
                <button
                  onClick={() => setShowReject(true)}
                  className={`${actionBtn} text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20`}
                >
                  <HiOutlineXCircle className="w-4 h-4" /> Reject
                </button>
              )}
              <button
                onClick={() => setShowDelete(true)}
                className={`${actionBtn} text-slate-300 bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.1]`}
              >
                <HiOutlineTrash className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {job.status === "rejected" && job.admin_notes && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                Rejection Reason
              </p>
              <p className="text-sm text-red-100/90">{job.admin_notes}</p>
            </div>
          )}
        </Card>

        {/* Details */}
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-gold-500 mb-5 uppercase tracking-wider">
            Job Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["Job Type", JOB_TYPE_LABELS[job.job_type] || job.job_type],
              ["Location", job.location || "—"],
              ["Salary Range", salary || "Not specified"],
              ["Applicants", job.applications_count ?? 0],
              ["Submitted", formatDate(job.created_at)],
              [
                "Expires",
                job.expires_at ? formatDate(job.expires_at) : "No expiry",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="py-2 border-b border-white/[0.04] last:border-0"
              >
                <dt className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-slate-200 font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Description & qualifications */}
        <Card className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gold-500 mb-2 uppercase tracking-wider">
              Description
            </h2>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>
          {job.qualifications && (
            <div>
              <h2 className="text-sm font-semibold text-gold-500 mb-2 uppercase tracking-wider">
                Qualifications
              </h2>
              <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {job.qualifications}
              </p>
            </div>
          )}
        </Card>

        {/* Modals */}
        <ConfirmDialog
          open={showApprove}
          title="Approve Job Post"
          message="This post will become visible to alumni on the job board. Continue?"
          confirmLabel="Approve"
          variant="info"
          loading={actionLoading}
          onConfirm={handleApprove}
          onCancel={() => setShowApprove(false)}
        />

        <RejectModal
          open={showReject}
          loading={actionLoading}
          onConfirm={handleReject}
          onCancel={() => setShowReject(false)}
        />

        <ConfirmDialog
          open={showDelete}
          title="Delete Job Post"
          message={`Delete "${job.title}"? This removes it from the system.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      </div>
    </>
  );
}
