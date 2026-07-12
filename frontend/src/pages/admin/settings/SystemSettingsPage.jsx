// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/settings/SystemSettingsPage.jsx
//  System settings tab — maintenance-mode toggle + custom message.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { useToast } from "../../../hooks/useToast";
import { useMaintenance } from "../../../hooks/useMaintenance";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import { HiOutlineWrenchScrewdriver, HiOutlineCheckCircle } from "react-icons/hi2";

const textareaClass =
  "w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/30 transition-colors resize-none";

export default function SystemSettingsPage() {
  const toast = useToast();
  // Keeps the app-wide admin banner in sync the moment the toggle is saved.
  const { setStatus } = useMaintenance();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [form, setForm] = useState({ is_enabled: false, message: "" });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminApi.getMaintenanceSettings();
        const data = res.data.data;
        setEnabled(data.is_enabled);
        setForm({
          is_enabled: data.is_enabled,
          message: data.message || "",
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateMaintenanceSettings({
        is_enabled: form.is_enabled,
        message: form.message.trim() || null,
      });
      const data = res.data.data;
      setEnabled(data.is_enabled);
      setForm({ is_enabled: data.is_enabled, message: data.message || "" });
      setStatus(data.is_enabled, data.message || "");
      toast.success(
        data.is_enabled
          ? "Maintenance mode is now ON."
          : "Maintenance mode is now OFF."
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
        <p className="text-sm text-slate-500">Loading settings...</p>
      </div>
    );

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Control system-wide availability for Alumni users
        </p>
      </div>

      {/* Current status */}
      <div
        className={`rounded-2xl p-6 mb-6 backdrop-blur-sm ${
          enabled
            ? "bg-amber-500/10 border border-amber-500/20"
            : "bg-emerald-500/10 border border-emerald-500/20"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              enabled
                ? "bg-amber-500/15 border border-amber-500/25"
                : "bg-emerald-500/15 border border-emerald-500/25"
            }`}
          >
            {enabled ? (
              <HiOutlineWrenchScrewdriver className="w-7 h-7 text-amber-400" />
            ) : (
              <HiOutlineCheckCircle className="w-7 h-7 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p
                className={`text-lg font-bold ${
                  enabled ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                Maintenance mode is {enabled ? "ON" : "OFF"}
              </p>
              {enabled && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p
              className={`text-sm mt-0.5 ${
                enabled ? "text-amber-300/80" : "text-emerald-300/80"
              }`}
            >
              {enabled
                ? "Alumni users are blocked. Admins retain full access."
                : "All users have normal access to the system."}
            </p>
          </div>
        </div>
      </div>

      {/* Settings form */}
      <Card>
        <h2 className="text-sm font-semibold text-gold-500 mb-5 uppercase tracking-wider">
          Maintenance Mode
        </h2>

        {/* Toggle */}
        <div className="flex items-center gap-4 p-4 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_enabled}
              onChange={(e) =>
                setForm({ ...form, is_enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-gold-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Enable Maintenance Mode
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              When enabled, Alumni users see a maintenance message.
              Admins are never locked out.
            </p>
          </div>
        </div>

        {/* Custom message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Custom Message{" "}
            <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="e.g. We're performing scheduled upgrades and will be back shortly."
            maxLength={500}
            className={textareaClass}
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Leave empty to show the default maintenance message.
          </p>
        </div>

        <Button onClick={handleSave} loading={saving} className="px-6">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </Card>
    </div>
  );
}
