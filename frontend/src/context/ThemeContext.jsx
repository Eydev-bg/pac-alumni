import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
 * Toggle the `dark` class on <html> — the single hook Tailwind's dark: keys on.
 * Applied globally: every route opts into dark mode through its own `dark:`
 * variants.
 */
function applyResolved(resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
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
 * Route-agnostic: the `dark` class is toggled globally. Both admin and alumni
 * pages define their own light/dark styling via Tailwind's `dark:` variants.
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
  // Set from hydrateTheme: true only when the backend actually returned a
  // preference for this user. Admin accounts get nothing back, so sync stays
  // off and never fires a 403. The .catch() below is a backstop.
  const syncSupported = useRef(true);
  // Drives the per-user storage key, so admin and alumni preferences on the
  // same browser don't overwrite each other.
  const currentUserId = useRef(null);

  // Apply the resolved theme whenever the preference changes, and — while on
  // 'system' — keep it in sync with the OS as the user flips their setting.
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
  }, [theme]);

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
      if (currentUserId.current) {
        localStorage.setItem(`pac_theme_${currentUserId.current}`, value);
      }
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
      if (!syncSupported.current) return;
      if (!currentUserId.current) return;
      settingsApi.updateAppearance(value).catch((err) => {
        if (err.response?.status === 403) {
          // Endpoint isn't available to this account — stop trying, silently.
          syncSupported.current = false;
          return;
        }
        // eslint-disable-next-line no-console
        console.warn("Theme sync failed; keeping local preference.", err);
      });
    }, SYNC_DELAY_MS);
  }, []);

  /**
   * Apply the preference for a freshly-authenticated user (login / getMe).
   * Same as setTheme minus the debounced server sync — echoing a backend value
   * straight back would be a pointless write.
   *
   * Precedence: backend value > per-user localStorage > system.
   *
   * The generic key is deliberately NOT part of that chain. It holds whichever
   * account last touched this browser, so falling back to it bleeds one user's
   * theme into another's session. Absent a per-user value we start from
   * 'system', never from a stranger's preference.
   *
   * A backend value also tells us the sync endpoint works for this account;
   * its absence leaves sync off, so no 403 is ever fired.
   */
  const hydrateTheme = useCallback((backendValue, userId) => {
    currentUserId.current = userId || null;

    // If the backend provided a value, the sync endpoint works for this user
    syncSupported.current = !!backendValue;

    // Resolve preference: backend value > per-user localStorage > system
    const userKey = userId ? `pac_theme_${userId}` : null;
    let value = backendValue;
    if (!value && userKey) {
      try {
        value = localStorage.getItem(userKey);
      } catch {
        // Storage blocked — fall through to the system default.
      }
    }
    if (!value) value = "system";

    // The generic key is still written — the anti-flash script in index.html
    // runs before React mounts and can't know who is about to log in.
    try {
      localStorage.setItem(STORAGE_KEY, value);
      if (userKey) localStorage.setItem(userKey, value);
    } catch {
      // Private mode — in-memory state still applies below.
    }

    const next = resolve(value);
    applyResolved(next);
    setResolvedTheme(next);
    setThemeState(value);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, hydrateTheme }),
    [theme, setTheme, resolvedTheme, hydrateTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
