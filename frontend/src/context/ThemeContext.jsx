import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import settingsApi from "../api/settingsApi";

export const ThemeContext = createContext(null);

// Single source of truth for the localStorage key — must match the inline
// anti-flash script in index.html so both agree before React mounts.
const STORAGE_KEY = "pac_theme";
const SYNC_DELAY_MS = 1000;

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.(MEDIA_QUERY).matches === true
  );
}

/** Resolve a stored preference ('light'|'dark'|'system') to a concrete theme. */
function resolve(theme) {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme === "dark" ? "dark" : "light";
}

/**
 * Dark mode is scoped to the /alumni subtree — admin is a light-only design and
 * must never inherit dark: variants. Read window.location.pathname directly so
 * the guard is correct at call time (React Router updates history synchronously
 * before the location-dependent effect re-runs).
 */
function onAlumniRoute() {
  return (
    typeof window !== "undefined" &&
    /^\/alumni(\/|$)/.test(window.location.pathname)
  );
}

/**
 * Toggle the `dark` class on <html> — the single hook Tailwind's dark: keys on.
 * Only applies on /alumni routes; anywhere else the class is force-removed so
 * admin pages stay light even if a dark preference is stored.
 */
function applyResolved(resolved) {
  if (typeof document === "undefined") return;
  const dark = resolved === "dark" && onAlumniRoute();
  document.documentElement.classList.toggle("dark", dark);
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
}

/**
 * ThemeProvider — owns the light/dark/system theme for the whole app.
 *
 * Mounted OUTSIDE AuthProvider so the theme applies on the login page too,
 * before any user is known. The local value (localStorage) is authoritative
 * for the session; the server sync is a best-effort, debounced write that
 * never blocks the UI and never reverts the local choice on failure.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolve(readStored()));
  const syncTimer = useRef(null);
  const location = useLocation();

  // Apply the resolved theme whenever the preference changes, and — while on
  // 'system' — keep it in sync with the OS as the user flips their setting.
  // Also re-runs on navigation (location.pathname dep): applyResolved is
  // path-scoped, so leaving /alumni removes the `dark` class from admin pages.
  useEffect(() => {
    const reapply = () => {
      const next = resolve(theme);
      setResolvedTheme(next);
      applyResolved(next);
    };

    reapply();

    if (theme !== "system") return undefined;

    const mq = window.matchMedia(MEDIA_QUERY);
    mq.addEventListener("change", reapply);
    return () => mq.removeEventListener("change", reapply);
  }, [theme, location.pathname]);

  // Clear any pending debounced sync on unmount.
  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  const setTheme = useCallback((value) => {
    // 1) Persist + apply immediately — the UI must never wait on the network.
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage blocked (private mode): in-memory state below still applies.
    }
    const next = resolve(value);
    applyResolved(next);
    setResolvedTheme(next);
    setThemeState(value);

    // 2) Debounced, best-effort server sync. A failure is logged, not surfaced;
    //    the local preference remains authoritative for this session.
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      settingsApi.updateAppearance(value).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("Theme sync failed; keeping local preference.", err);
      });
    }, SYNC_DELAY_MS);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
