// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/settings/AccountSettingsPage.jsx
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import adminApi from "../../../api/adminApi";
import { tokenStorage } from "../../../utils/storage";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import Alert from "../../../ui/Alert";
import {
  HiOutlineUser,
  HiOutlineLockClosed,
} from "react-icons/hi2";

/**
 * AccountSettingsPage — lets the logged-in admin update their own
 * profile information and change their password.
 */
export default function AccountSettingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

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
      toast.success("Profile updated.");
    } catch (err) {
      if (err.response?.status === 422) {
        setProfileErrors(err.response.data.errors || {});
      } else {
        setProfileErrors({
          _general: err.response?.data?.message || "Failed to update profile.",
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
      toast.success("Password changed.");
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
          _general: err.response?.data?.message || "Failed to update password.",
        });
      }
    } finally {
      setPasswordSaving(false);
    }
  };

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
      <Card as="form" onSubmit={handleProfileSubmit} className="mb-6">
        <div className="flex items-center gap-2 mb-5">
          <HiOutlineUser className="w-5 h-5 text-gold-500" />
          <h2 className="text-sm font-semibold text-gold-500 uppercase tracking-wider">
            Profile Information
          </h2>
        </div>

        {profileErrors._general && (
          <Alert variant="error" className="mb-4">
            {profileErrors._general}
          </Alert>
        )}

        {profileSuccess && (
          <Alert variant="success" className="mb-4">
            Profile updated.
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input
            tone="dark"
            label="First Name"
            value={profileForm.first_name}
            onChange={(e) => handleProfileChange("first_name", e.target.value)}
            placeholder="First name"
            error={profileErrors.first_name}
          />
          <Input
            tone="dark"
            label="Last Name"
            value={profileForm.last_name}
            onChange={(e) => handleProfileChange("last_name", e.target.value)}
            placeholder="Last name"
            error={profileErrors.last_name}
          />
        </div>

        <div className="mb-6">
          <Input
            tone="dark"
            label="Email"
            type="email"
            value={profileForm.email}
            onChange={(e) => handleProfileChange("email", e.target.value)}
            placeholder="you@example.com"
            error={profileErrors.email}
          />
        </div>

        <Button type="submit" loading={profileSaving} className="px-6">
          {profileSaving ? "Saving..." : "Save Changes"}
        </Button>
      </Card>

      {/* ─── Section 2: Change Password ─────────────────── */}
      <Card as="form" onSubmit={handlePasswordSubmit}>
        <div className="flex items-center gap-2 mb-5">
          <HiOutlineLockClosed className="w-5 h-5 text-gold-500" />
          <h2 className="text-sm font-semibold text-gold-500 uppercase tracking-wider">
            Change Password
          </h2>
        </div>

        {passwordErrors._general && (
          <Alert variant="error" className="mb-4">
            {passwordErrors._general}
          </Alert>
        )}

        {passwordSuccess && (
          <Alert variant="success" className="mb-4">
            Password changed.
          </Alert>
        )}

        <div className="mb-4">
          <Input
            tone="dark"
            label="Current Password"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) =>
              handlePasswordChange("current_password", e.target.value)
            }
            placeholder="••••••••"
            autoComplete="current-password"
            error={passwordErrors.current_password}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Input
            tone="dark"
            label="New Password"
            type="password"
            value={passwordForm.password}
            onChange={(e) => handlePasswordChange("password", e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={passwordErrors.password}
          />
          <Input
            tone="dark"
            label="Confirm New Password"
            type="password"
            value={passwordForm.password_confirmation}
            onChange={(e) =>
              handlePasswordChange("password_confirmation", e.target.value)
            }
            placeholder="Re-enter new password"
            autoComplete="new-password"
            error={passwordErrors.password_confirmation}
          />
        </div>

        <Button type="submit" loading={passwordSaving} className="px-6">
          {passwordSaving ? "Updating..." : "Update Password"}
        </Button>
      </Card>
    </div>
  );
}
