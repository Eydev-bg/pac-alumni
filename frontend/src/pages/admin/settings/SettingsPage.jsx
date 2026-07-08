// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/settings/SettingsPage.jsx
//  Consolidated Settings page — tabbed container hosting the
//  Registration and Account settings pages as child components.
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import RegistrationSettingsPage from "../verification/RegistrationSettingsPage";
import AccountSettingsPage from "./AccountSettingsPage";

const TABS = [
  { key: "registration", label: "Registration" },
  { key: "account", label: "Account" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("registration");

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage registration availability and your account
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "text-[#c8a84e]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full bg-[#c8a84e] shadow-[0_0_8px_rgba(200,168,78,0.4)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active tab content */}
        {activeTab === "registration" && <RegistrationSettingsPage />}
        {activeTab === "account" && <AccountSettingsPage />}
      </div>
    </div>
  );
}
