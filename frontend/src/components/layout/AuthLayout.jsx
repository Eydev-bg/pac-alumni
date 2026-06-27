import { Outlet } from "react-router-dom";

/**
 * AuthLayout — minimal wrapper for auth pages (login, forgot password, etc.)
 * The actual styling/background/branding lives inside each page (e.g. LoginPage).
 * This layout just renders the child route — no extra UI.
 */
export default function AuthLayout() {
  return <Outlet />;
}
