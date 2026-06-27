import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLE_DASHBOARDS = {
  admin: "/admin/dashboard",
  alumni: "/alumni/dashboard",
};

function LoadingScreen() {
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
  if (!isAuthenticated) return <Outlet />;

  // Try to get role from user object or sessionStorage fallback
  let userRole = user?.role;
  if (!userRole) {
    try {
      const stored = sessionStorage.getItem("pac_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        userRole = parsed.role;
      }
    } catch (e) {
      // ignore
    }
  }

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

  // Authenticated — figure out where to redirect
  let role = user?.role;
  if (!role) {
    try {
      const stored = sessionStorage.getItem("pac_auth_user");
      if (stored) role = JSON.parse(stored).role;
    } catch (e) {
      // ignore
    }
  }

  // If we have a role and a matching dashboard, redirect there
  if (role && ROLE_DASHBOARDS[role]) {
    return <Navigate to={ROLE_DASHBOARDS[role]} replace />;
  }

  // Edge case: authenticated but no role found.
  // Show loading — AuthContext will either resolve the user or clear the token.
  return <LoadingScreen />;
}
