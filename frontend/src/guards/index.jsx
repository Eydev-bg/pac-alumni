import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLE_DASHBOARDS = {
  admin: "/admin/dashboard",
  alumni: "/alumni/dashboard",
};

/**
 * LoadingScreen — full-screen centered spinner.
 * Exported so it can double as the router's Suspense fallback for lazy
 * route chunks (reused, not re-implemented).
 */
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
}

/**
 * ProtectedRoute — blocks unauthenticated users.
 * Redirects to /login if not authenticated.
 */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

/**
 * RoleGuard — blocks users without the required role.
 * Must be nested inside ProtectedRoute.
 */
export function RoleGuard({ roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;
  // SECURITY (defense in depth): never fail open. RoleGuard is always nested
  // inside ProtectedRoute today, but if it is ever mounted on its own an
  // unauthenticated user must still be blocked — send them to /login rather
  // than rendering the protected child route.
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // `isAuthenticated` is `!!token && !!user`, so `user` is non-null here and
  // its role comes from the same API payload the old sessionStorage fallback
  // was written from — the fallback could never know more than `user` does.
  const userRole = user?.role;

  // Still no role? Show loading (will resolve on next render)
  if (!userRole) return <LoadingScreen />;

  // Check role
  if (!roles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

/**
 * GuestRoute — only accessible when NOT authenticated.
 * If authenticated, redirects to the user's role-based dashboard.
 *
 * IMPORTANT: Never redirect to /login from here — /login is INSIDE
 * GuestRoute, so that would cause an infinite redirect loop.
 */
export function GuestRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  // Still checking auth state — show loading
  if (loading) return <LoadingScreen />;

  // Not authenticated — show the guest page (login, register, etc.)
  if (!isAuthenticated) return <Outlet />;

  // Authenticated — figure out where to redirect. `user` is non-null here
  // (isAuthenticated requires it); see RoleGuard for why no storage fallback.
  const role = user?.role;

  // If we have a role and a matching dashboard, redirect there
  if (role && ROLE_DASHBOARDS[role]) {
    return <Navigate to={ROLE_DASHBOARDS[role]} replace />;
  }

  // Edge case: authenticated but no role found.
  // Show loading — AuthContext will either resolve the user or clear the token.
  return <LoadingScreen />;
}
