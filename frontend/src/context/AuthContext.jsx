import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import authApi from "../api/authApi";
import { initEcho, disconnectEcho } from "../config/echo";
import { tokenStorage } from "../utils/storage";
import { useTheme } from "../hooks/useTheme";

export const AuthContext = createContext(null);

/**
 * AuthProvider wraps the entire app and provides:
 * - user: current authenticated user object
 * - token: JWT token
 * - login(): authenticate and store token
 * - logout(): clear everything and redirect
 * - loading: true while checking auth state on mount
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenStorage.getToken());
  const [loading, setLoading] = useState(true);
  // Valid: AuthProvider renders inside ThemeProvider.
  const { hydrateTheme } = useTheme();

  /**
   * On mount: check if we have a stored token and validate it.
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = tokenStorage.getToken();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        setUser(response.data.data);
        tokenStorage.setUser(response.data.data);
        // Hydrate theme from user's backend preference (if available).
        // Keyed by uuid — UserResource exposes uuid, not id.
        hydrateTheme(
          response.data.data.theme_preference,
          response.data.data.uuid,
        );
        initEcho();
      } catch {
        // Token invalid or expired — clear everything
        tokenStorage.clearAll();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    // hydrateTheme is a stable useCallback — adding it would re-run auth init
    // on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Login: call API, store token + user.
   */
  const login = useCallback(
    async (email, password) => {
      const response = await authApi.login(email, password);
      const { token: newToken, user: userData } = response.data.data;

      tokenStorage.setToken(newToken);
      tokenStorage.setUser(userData);
      setToken(newToken);
      setUser(userData);
      initEcho();
      // Hydrate theme from the freshly-authenticated user's preference.
      // Keyed by uuid — UserResource exposes uuid, not id.
      hydrateTheme(userData.theme_preference, userData.uuid);

      return userData;
    },
    [hydrateTheme],
  );

  /**
   * Logout: invalidate token on server, clear local state.
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if server call fails, clear local state
    } finally {
      disconnectEcho();
      tokenStorage.clearAll();
      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * Re-fetch the current user from the server and update local state.
   * Used after the admin edits their own profile so the UI (e.g. Header)
   * reflects the new name/email without a full page reload.
   */
  const refreshUser = useCallback(async () => {
    const response = await authApi.getMe();
    setUser(response.data.data);
    tokenStorage.setUser(response.data.data);
    return response.data.data;
  }, []);

  /**
   * Merge a partial update into the cached user without a network call.
   * Use after a mutation whose response already contains the new values.
   */
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      tokenStorage.setUser(next);
      return next;
    });
  }, []);

  /**
   * Check if user has a specific role.
   */
  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      const userRole = user.role || user.role_label;
      if (Array.isArray(role)) return role.includes(userRole);
      return userRole === role;
    },
    [user],
  );
  // Memoize the provided value so consumers only re-render when an actual
  // auth field/callback changes, not on every AuthProvider render. The
  // callbacks below are already useCallback-stable.
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      hasRole,
      refreshUser,
      updateUser,
    }),
    [user, token, loading, login, logout, hasRole, refreshUser, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
