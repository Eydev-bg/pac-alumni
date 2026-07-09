// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/verification/RegistrationSettingsPage.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { useToast } from "../../../hooks/useToast";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import { HiOutlineLockClosed, HiOutlineLockOpen } from "react-icons/hi2";

const dateInputClass =
  "w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/30 transition-colors [color-scheme:dark]";

export default function RegistrationSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    is_open: false,
    open_from: "",
    open_until: "",
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminApi.getRegistrationSettings();
        const data = res.data.data;
        setSettings(data);
        setForm({
          is_open: data.is_open,
          open_from: data.open_from ? data.open_from.slice(0, 16) : "",
          open_until: data.open_until ? data.open_until.slice(0, 16) : "",
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
      const res = await adminApi.updateRegistrationSettings({
        is_open: form.is_open,
        open_from: form.open_from || null,
        open_until: form.open_until || null,
      });
      setSettings(res.data.data);
      toast.success("Settings saved.");
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

  const isOpen = settings?.is_currently_open;

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Registration Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Control when alumni can register for accounts
        </p>
      </div>

      {/* Current Status */}
      <div
        className={`rounded-2xl p-6 mb-6 backdrop-blur-sm ${
          isOpen
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-red-500/10 border border-red-500/20"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isOpen
                ? "bg-emerald-500/15 border border-emerald-500/25"
                : "bg-red-500/15 border border-red-500/25"
            }`}
          >
            {isOpen ? (
              <HiOutlineLockOpen className="w-7 h-7 text-emerald-400" />
            ) : (
              <HiOutlineLockClosed className="w-7 h-7 text-red-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p
                className={`text-lg font-bold ${
                  isOpen ? "text-emerald-400" : "text-red-400"
                }`}
              >
                Registration is {isOpen ? "OPEN" : "CLOSED"}
              </p>
              {isOpen && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p
              className={`text-sm mt-0.5 ${
                isOpen ? "text-emerald-300/80" : "text-red-300/80"
              }`}
            >
              {isOpen
                ? "Alumni can currently register for accounts."
                : "Alumni registration is currently disabled."}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <Card>
        <h2 className="text-sm font-semibold text-gold-500 mb-5 uppercase tracking-wider">
          Configuration
        </h2>

        {/* Toggle */}
        <div className="flex items-center gap-4 p-4 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_open}
              onChange={(e) => setForm({ ...form, is_open: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-gold-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-gold-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Enable Registration
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              When enabled, alumni can register using their Student ID
            </p>
          </div>
        </div>

        {/* Date Range (optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Open From{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.open_from}
              onChange={(e) => setForm({ ...form, open_from: e.target.value })}
              className={dateInputClass}
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Leave empty for no start date restriction
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Open Until{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.open_until}
              onChange={(e) => setForm({ ...form, open_until: e.target.value })}
              className={dateInputClass}
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Leave empty for no end date restriction
            </p>
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="px-6">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </Card>
    </div>
  );
}
