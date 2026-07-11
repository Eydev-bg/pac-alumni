// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/settings/SettingsPage.jsx
//  Consolidated Settings page — tabbed container hosting the
//  Registration and Account settings pages as child components.
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import RegistrationSettingsPage from "../verification/RegistrationSettingsPage";
import AccountSettingsPage from "./AccountSettingsPage";
import SystemSettingsPage from "./SystemSettingsPage";
import Card from "../../../ui/Card";

const TABS = [
  { key: "registration", label: "Registration" },
  { key: "system", label: "System" },
  { key: "account", label: "Account" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("registration");

  return (
    <>
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage registration availability and your account
          </p>
        </div>

        {/* Tabs */}
        <Card padding={false} className="mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "text-gold-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full bg-gold-500 shadow-[0_0_8px_rgba(200,168,78,0.4)]" />
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Active tab content */}
        {activeTab === "registration" && <RegistrationSettingsPage />}
        {activeTab === "system" && <SystemSettingsPage />}
        {activeTab === "account" && <AccountSettingsPage />}
      </div>
    </>
  );
}
