import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

/**
 * useToast — access the app-wide toast helpers.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.error(err.response?.data?.message || "Something went wrong.");
 *   toast.success("Saved.");
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx.toast;
}
