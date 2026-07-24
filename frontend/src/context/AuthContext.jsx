import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import authApi from "../api/authApi";
import { tokenStorage } from "../utils/storage";

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
  }, []);

  /**
   * Login: call API, store token + user.
   */
  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    const { token: newToken, user: userData } = response.data.data;

    tokenStorage.setToken(newToken);
    tokenStorage.setUser(userData);
    setToken(newToken);
    setUser(userData);

    return userData;
  }, []);

  /**
   * Logout: invalidate token on server, clear local state.
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if server call fails, clear local state
    } finally {
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
