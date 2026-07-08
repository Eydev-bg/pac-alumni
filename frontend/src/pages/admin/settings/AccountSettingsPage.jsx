// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/settings/AccountSettingsPage.jsx
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import adminApi from "../../../api/adminApi";
import { tokenStorage } from "../../../utils/storage";
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

/**
 * AccountSettingsPage — lets the logged-in admin update their own
 * profile information and change their password.
 */
export default function AccountSettingsPage() {
  const { user, refreshUser } = useAuth();

  // ─── Profile section state ────────────────────────────
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState(false);

  // ─── Password section state ───────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ─── Handlers ─────────────────────────────────────────
  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
    setProfileSuccess(false);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
    setPasswordSuccess(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileErrors({});
    setProfileSuccess(false);

    try {
      await adminApi.updateMyProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
      });

      // Refresh the auth user so the Header name/email update immediately.
      try {
        await refreshUser();
      } catch {
        // Non-fatal: profile saved, only the header refresh failed.
      }

      setProfileSuccess(true);
    } catch (err) {
      if (err.response?.status === 422) {
        setProfileErrors(err.response.data.errors || {});
      } else {
        setProfileErrors({
          _general:
            err.response?.data?.message || "Failed to update profile.",
        });
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess(false);

    // ─── Client-side validation ─────────────────────────
    const clientErrors = {};
    if (
      passwordForm.password &&
      passwordForm.password === passwordForm.current_password
    ) {
      clientErrors.password = [
        "New password must be different from the current password.",
      ];
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      clientErrors.password_confirmation = ["Passwords do not match."];
    }
    if (Object.keys(clientErrors).length > 0) {
      setPasswordErrors(clientErrors);
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await adminApi.changePassword({
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      });

      // The password change rotates every previously-issued JWT. The backend
      // returns a fresh token for THIS session so we stay logged in — store it,
      // otherwise the next request would be rejected as a stale session.
      const newToken = res.data?.data?.token;
      if (newToken) {
        tokenStorage.setToken(newToken);
      }

      setPasswordSuccess(true);
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err) {
      if (err.response?.status === 422) {
        setPasswordErrors(err.response.data.errors || {});
      } else {
        setPasswordErrors({
          _general:
            err.response?.data?.message || "Failed to update password.",
        });
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // ─── Shared field styles ──────────────────────────────
  const inputClass = (hasError) =>
    `w-full px-3 py-2 bg-white/[0.06] border rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-500/40 focus:ring-red-500/30"
        : "border-white/[0.08] focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30"
    }`;

  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  const fieldError = (errors, field) =>
    errors[field] ? (
      <p className="text-xs text-red-400 mt-1.5">
        {Array.isArray(errors[field]) ? errors[field][0] : errors[field]}
      </p>
    ) : null;

  return (
    <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal information and password
          </p>
        </div>

        {/* ─── Section 1: Profile Information ─────────────── */}
        <form
          onSubmit={handleProfileSubmit}
          className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <HiOutlineUser className="w-5 h-5 text-[#c8a84e]" />
            <h2 className="text-sm font-semibold text-[#c8a84e] uppercase tracking-wider">
              Profile Information
            </h2>
          </div>

          {profileErrors._general && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {profileErrors._general}
            </div>
          )}

          {profileSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-sm text-emerald-400">
              <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
              Profile updated successfully.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(e) =>
                  handleProfileChange("first_name", e.target.value)
                }
                className={inputClass(profileErrors.first_name)}
                placeholder="First name"
              />
              {fieldError(profileErrors, "first_name")}
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(e) =>
                  handleProfileChange("last_name", e.target.value)
                }
                className={inputClass(profileErrors.last_name)}
                placeholder="Last name"
              />
              {fieldError(profileErrors, "last_name")}
            </div>
          </div>

          <div className="mb-6">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => handleProfileChange("email", e.target.value)}
              className={inputClass(profileErrors.email)}
              placeholder="you@example.com"
            />
            {fieldError(profileErrors, "email")}
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all disabled:opacity-50 shadow-lg shadow-[#c8a84e]/20"
          >
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* ─── Section 2: Change Password ─────────────────── */}
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <HiOutlineLockClosed className="w-5 h-5 text-[#c8a84e]" />
            <h2 className="text-sm font-semibold text-[#c8a84e] uppercase tracking-wider">
              Change Password
            </h2>
          </div>

          {passwordErrors._general && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {passwordErrors._general}
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-sm text-emerald-400">
              <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
              Password changed successfully.
            </div>
          )}

          <div className="mb-4">
            <label className={labelClass}>Current Password</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) =>
                handlePasswordChange("current_password", e.target.value)
              }
              className={inputClass(passwordErrors.current_password)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {fieldError(passwordErrors, "current_password")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) =>
                  handlePasswordChange("password", e.target.value)
                }
                className={inputClass(passwordErrors.password)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              {fieldError(passwordErrors, "password")}
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.password_confirmation}
                onChange={(e) =>
                  handlePasswordChange("password_confirmation", e.target.value)
                }
                className={inputClass(passwordErrors.password_confirmation)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              {fieldError(passwordErrors, "password_confirmation")}
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all disabled:opacity-50 shadow-lg shadow-[#c8a84e]/20"
          >
            {passwordSaving ? "Updating..." : "Update Password"}
          </button>
        </form>
    </div>
  );
}
