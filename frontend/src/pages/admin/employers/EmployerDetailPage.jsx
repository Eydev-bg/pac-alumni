import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { formatDate, storageUrl } from "../../../utils/formatters";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineCheckBadge,
  HiOutlineCheckCircle,
  HiOutlineNoSymbol,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineGlobeAlt,
  HiOutlineDocumentText,
} from "react-icons/hi2";

// ─── Action modal with optional reason field ─────────────
function ActionModal({ config, loading, onConfirm, onCancel }) {
  const [notes, setNotes] = useState("");
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-slate-900">{config.title}</h3>
          <p className="mt-2 text-sm text-slate-500">{config.message}</p>

          {config.withNotes && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Reason {config.notesRequired ? "(required)" : "(optional)"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="This note is recorded on the employer account."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(notes)}
              disabled={loading || (config.notesRequired && !notes.trim())}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${config.confirmClass}`}
            >
              {loading ? "Processing..." : config.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // active action config
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchEmployer = async () => {
    try {
      const res = await adminApi.getEmployer(id);
      setEmployer(res.data.data);
    } catch {
      navigate("/admin/employers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (notes) => {
    setActionLoading(true);
    try {
      let res;
      if (action.key === "suspend") res = await adminApi.suspendEmployer(id, notes);
      else if (action.key === "deactivate") res = await adminApi.deactivateEmployer(id, notes);
      else if (action.key === "activate") res = await adminApi.activateEmployer(id);
      setEmployer(res.data.data);
      setAction(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update employer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await adminApi.deleteEmployer(id);
      navigate("/admin/employers");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete employer.");
      setActionLoading(false);
    }
  };

  const ACTIONS = {
    suspend: {
      key: "suspend",
      title: "Suspend Employer",
      message: "This employer will immediately lose access. Their job posts stay visible only while active.",
      confirmLabel: "Suspend",
      confirmClass: "bg-amber-600 hover:bg-amber-700",
      withNotes: true,
    },
    deactivate: {
      key: "deactivate",
      title: "Deactivate Employer",
      message: "This will disable the employer account and block their login.",
      confirmLabel: "Deactivate",
      confirmClass: "bg-red-600 hover:bg-red-700",
      withNotes: true,
    },
    activate: {
      key: "activate",
      title: "Activate Employer",
      message: "This will restore the employer's access to the system.",
      confirmLabel: "Activate",
      confirmClass: "bg-emerald-600 hover:bg-emerald-700",
      withNotes: false,
    },
  };

  if (loading) {
    return (
      <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
          <p className="text-sm text-slate-500">Loading employer...</p>
        </div>
      </div>
    );
  }

  if (!employer) return null;

  const permitUrl = employer.business_permit_document
    ? storageUrl(employer.business_permit_document)
    : null;

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <button
          onClick={() => navigate("/admin/employers")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#c8a84e] mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Employers
        </button>

        {/* Profile Card */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/[0.08] overflow-hidden flex-shrink-0">
                {employer.company_logo ? (
                  <img
                    src={storageUrl(employer.company_logo)}
                    alt={employer.company_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <HiOutlineBuildingOffice2 className="w-7 h-7 text-[#c8a84e]" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {employer.company_name}
                </h1>
                <p className="text-sm text-slate-400">{employer.company_email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={employer.status} label={employer.status} />
                  {employer.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <HiOutlineCheckBadge className="w-4 h-4" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {employer.status === "active" && (
                <button
                  onClick={() => setAction(ACTIONS.suspend)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
                >
                  <HiOutlineNoSymbol className="w-4 h-4" /> Suspend
                </button>
              )}
              {employer.status !== "active" && (
                <button
                  onClick={() => setAction(ACTIONS.activate)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" /> Activate
                </button>
              )}
              {employer.status !== "deactivated" && (
                <button
                  onClick={() => setAction(ACTIONS.deactivate)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <HiOutlineXCircle className="w-4 h-4" /> Deactivate
                </button>
              )}
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-colors"
              >
                <HiOutlineTrash className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {employer.admin_notes && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                Admin Notes
              </p>
              <p className="text-sm text-amber-100/90">{employer.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
          <h2 className="text-sm font-semibold text-[#c8a84e] mb-5 uppercase tracking-wider">
            Company Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["Company Address", employer.company_address || "—"],
              ["Contact Number", employer.company_contact_number || "—"],
              ["HR Representative", employer.hr_full_name || "—"],
              ["HR Position", employer.hr_position || "—"],
              ["Active Job Posts", employer.jobs_count ?? 0],
              ["Account Email", employer.user?.email || employer.company_email],
              ["Registered", formatDate(employer.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="py-2 border-b border-white/[0.04] last:border-0">
                <dt className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-slate-200 font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Links */}
          <div className="mt-5 flex flex-wrap gap-3">
            {employer.company_website && (
              <a
                href={employer.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-[#c8a84e] bg-[#c8a84e]/10 border border-[#c8a84e]/20 rounded-xl hover:bg-[#c8a84e]/20 transition-colors"
              >
                <HiOutlineGlobeAlt className="w-4 h-4" /> Company Website
              </a>
            )}
            {permitUrl && (
              <a
                href={permitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-colors"
              >
                <HiOutlineDocumentText className="w-4 h-4" /> Business Permit
              </a>
            )}
          </div>
        </div>

        <ActionModal
          config={action}
          loading={actionLoading}
          onConfirm={runAction}
          onCancel={() => setAction(null)}
        />

        <ConfirmDialog
          open={confirmDelete}
          title="Delete Employer"
          message={`Delete "${employer.company_name}"? Their account will be deactivated and the employer record removed.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    </div>
  );
}
