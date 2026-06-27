// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/verification/RegistrationSettingsPage.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { HiOutlineLockClosed, HiOutlineLockOpen } from "react-icons/hi2";

export default function RegistrationSettingsPage() {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateRegistrationSettings({
        is_open: form.is_open,
        open_from: form.open_from || null,
        open_until: form.open_until || null,
      });
      setSettings(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
          <p className="text-sm text-slate-500">Loading settings...</p>
        </div>
      </div>
    );

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Registration Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Control when alumni can register for accounts
          </p>
        </div>

        {/* Current Status */}
        <div
          className={`rounded-2xl p-6 mb-6 backdrop-blur-sm ${
            settings?.is_currently_open
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                settings?.is_currently_open
                  ? "bg-emerald-500/15 border border-emerald-500/25"
                  : "bg-red-500/15 border border-red-500/25"
              }`}
            >
              {settings?.is_currently_open ? (
                <HiOutlineLockOpen className="w-7 h-7 text-emerald-400" />
              ) : (
                <HiOutlineLockClosed className="w-7 h-7 text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p
                  className={`text-lg font-bold ${
                    settings?.is_currently_open
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  Registration is{" "}
                  {settings?.is_currently_open ? "OPEN" : "CLOSED"}
                </p>
                {settings?.is_currently_open && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p
                className={`text-sm mt-0.5 ${
                  settings?.is_currently_open
                    ? "text-emerald-300/80"
                    : "text-red-300/80"
                }`}
              >
                {settings?.is_currently_open
                  ? "Alumni can currently register for accounts."
                  : "Alumni registration is currently disabled."}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
          <h2 className="text-sm font-semibold text-[#c8a84e] mb-5 uppercase tracking-wider">
            Configuration
          </h2>

          {/* Toggle */}
          <div className="flex items-center gap-4 p-4 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_open}
                onChange={(e) =>
                  setForm({ ...form, is_open: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-[#c8a84e]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#c8a84e] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
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
                onChange={(e) =>
                  setForm({ ...form, open_from: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors [color-scheme:dark]"
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
                onChange={(e) =>
                  setForm({ ...form, open_until: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors [color-scheme:dark]"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Leave empty for no end date restriction
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all disabled:opacity-50 shadow-lg shadow-[#c8a84e]/20"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
