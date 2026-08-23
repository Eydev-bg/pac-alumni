import { HiCheckCircle } from "react-icons/hi2";
import SettingsSection from "../../../../components/settings/SettingsSection";
import { useTheme } from "../../../../hooks/useTheme";
import { cn } from "../../../../utils/formatters";

// A tiny mock "app window" so each option previews its palette at a glance.
function ThemePreview({ dark }) {
  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden shadow-sm dark:shadow-none",
        dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200",
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 border-b",
          dark ? "border-slate-700" : "border-slate-100",
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      </div>
      <div className="p-3 space-y-2">
        <div
          className={cn(
            "h-2 w-1/2 rounded",
            dark ? "bg-slate-600" : "bg-slate-300",
          )}
        />
        <div
          className={cn(
            "h-2 w-3/4 rounded",
            dark ? "bg-slate-700" : "bg-slate-200",
          )}
        />
        <div className="h-5 w-16 rounded bg-blue-500" />
      </div>
    </div>
  );
}

const OPTIONS = [
  { value: "light", label: "Light", dark: false },
  { value: "dark", label: "Dark", dark: true },
];

export default function AppearanceTab() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <SettingsSection
      title="Theme"
      description="Choose how the alumni portal looks on this device."
    >
      <fieldset>
        <legend className="sr-only">Theme</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPTIONS.map((opt) => {
            const selected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                aria-pressed={selected}
                className={cn(
                  "group text-left rounded-xl border-2 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                  selected
                    ? "border-blue-600 dark:border-blue-400"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
                )}
              >
                <ThemePreview dark={opt.dark} />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {opt.label}
                  </span>
                  {selected ? (
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <HiCheckCircle className="w-5 h-5" />
                      <span className="text-xs font-semibold">Selected</span>
                    </span>
                  ) : (
                    <span
                      className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {theme === "system" && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Currently following your system setting ({resolvedTheme}). Pick an
          option above to override it on this device.
        </p>
      )}
    </SettingsSection>
  );
}
