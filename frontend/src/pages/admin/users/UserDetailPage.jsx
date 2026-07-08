import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import EditUserModal from "./EditUserModal";
import { formatDate } from "../../../utils/formatters";
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineKey,
  HiOutlineNoSymbol,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";

export default function UserDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [confirm, setConfirm] = useState({
    open: false,
    action: "",
    title: "",
    message: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [resetNotice, setResetNotice] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await adminApi.getUser(uuid);
      setUser(res.data.data);
    } catch {
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [uuid]);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const res = await adminApi.updateUserStatus(uuid, newStatus);
      setUser(res.data.data);
      setConfirm({ ...confirm, open: false });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setActionLoading(true);
    try {
      const res = await adminApi.resetUserPassword(uuid);
      setResetNotice(
        res.data?.message ||
          "A password reset link has been emailed to the user."
      );
      setConfirm({ ...confirm, open: false });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (action) => {
    const configs = {
      suspend: {
        title: "Suspend Account",
        message:
          "This user will immediately lose access to the system. Are you sure?",
        variant: "warning",
      },
      deactivate: {
        title: "Deactivate Account",
        message: "This will permanently disable the account. Continue?",
        variant: "danger",
      },
      activate: {
        title: "Activate Account",
        message: "This will restore the user's access to the system.",
        variant: "info",
      },
      resetPassword: {
        title: "Reset Password",
        message:
          "A password reset link will be emailed to the user. Their current password stays valid until they set a new one.",
        variant: "warning",
      },
    };

    setConfirm({ open: true, action, ...configs[action] });
  };

  const handleConfirm = () => {
    switch (confirm.action) {
      case "suspend":
        return handleStatusChange("suspended");
      case "deactivate":
        return handleStatusChange("deactivated");
      case "activate":
        return handleStatusChange("active");
      case "resetPassword":
        return handleResetPassword();
    }
  };

  if (loading)
    return (
      <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
          <p className="text-sm text-slate-500">Loading user details...</p>
        </div>
      </div>
    );

  if (!user) return null;

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#c8a84e] mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Users
        </button>

        {/* User Profile Card */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c8a84e] to-[#a88a3a] flex items-center justify-center shadow-lg shadow-[#c8a84e]/15">
                <span className="text-xl font-bold text-white">
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {user.full_name}
                </h1>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={user.role} label={user.role_label} />
                  <StatusBadge status={user.status} label={user.status_label} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-colors"
              >
                <HiOutlinePencilSquare className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => openConfirm("resetPassword")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
              >
                <HiOutlineKey className="w-4 h-4" /> Reset Password
              </button>

              {user.status === "active" && (
                <button
                  onClick={() => openConfirm("suspend")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <HiOutlineNoSymbol className="w-4 h-4" /> Suspend
                </button>
              )}
              {user.status === "suspended" && (
                <>
                  <button
                    onClick={() => openConfirm("activate")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" /> Activate
                  </button>
                  <button
                    onClick={() => openConfirm("deactivate")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <HiOutlineXCircle className="w-4 h-4" /> Deactivate
                  </button>
                </>
              )}
              {user.status === "deactivated" && (
                <button
                  onClick={() => openConfirm("activate")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" /> Reactivate
                </button>
              )}
            </div>
          </div>

          {/* Reset-link confirmation */}
          {resetNotice && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm font-semibold text-emerald-400 mb-1">
                Reset Link Sent
              </p>
              <p className="text-xs text-emerald-500/80">{resetNotice}</p>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
          <h2 className="text-sm font-semibold text-[#c8a84e] mb-5 uppercase tracking-wider">
            Account Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["First Name", user.first_name],
              ["Middle Name", user.middle_name || "—"],
              ["Last Name", user.last_name],
              ["Suffix", user.suffix || "—"],
              ["Phone", user.phone || "—"],
              [
                "Last Login",
                user.last_login_at ? formatDate(user.last_login_at) : "Never",
              ],
              ["Last Login IP", user.last_login_ip || "—"],
              ["Account Created", formatDate(user.created_at)],
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
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          variant={confirm.variant}
          confirmLabel={
            confirm.action === "activate"
              ? "Activate"
              : confirm.action === "resetPassword"
                ? "Reset"
                : confirm.title
          }
          loading={actionLoading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm({ ...confirm, open: false })}
        />

        {/* Edit Modal */}
        {showEdit && (
          <EditUserModal
            user={user}
            onClose={() => setShowEdit(false)}
            onUpdated={(updated) => {
              setUser(updated);
              setShowEdit(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
