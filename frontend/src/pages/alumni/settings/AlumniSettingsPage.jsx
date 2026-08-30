import { lazy, Suspense } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";

// Lazy-load each tab so a settings visit only ships the active tab's code.
const SecurityTab = lazy(() => import("./tabs/SecurityTab"));
const AppearanceTab = lazy(() => import("./tabs/AppearanceTab"));

// URL-driven tabs (NOT useState): settings sub-pages get deep-linked from
// emails and support conversations, which local state can't address.
const TABS = [
  { key: "security", label: "Security", icon: "🛡" },
  { key: "appearance", label: "Appearance", icon: "🎨" },
];

const isValidTab = (tab) => TABS.some((t) => t.key === tab);

export default function AlumniSettingsPage() {
  const { tab } = useParams();
  const navigate = useNavigate();

  // Unknown tab → canonicalise to the default rather than render an empty shell.
  if (!isValidTab(tab)) {
    return <Navigate to="/alumni/settings/security" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account security and appearance
        </p>
      </div>

      {/* Tabs — underline-style active indicator (matches admin settings) */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <nav
          className="flex gap-1 overflow-x-auto"
          aria-label="Settings tabs"
        >
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => navigate(`/alumni/settings/${t.key}`)}
                aria-current={active ? "page" : undefined}
                className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span className="mr-1.5" aria-hidden="true">
                  {t.icon}
                </span>
                {t.label}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active tab */}
      <Suspense
        fallback={
          <div className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">
            Loading…
          </div>
        }
      >
        {tab === "security" && <SecurityTab />}
        {tab === "appearance" && <AppearanceTab />}
      </Suspense>
    </div>
  );
}
