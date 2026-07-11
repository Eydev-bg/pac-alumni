import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import adminApi from "../api/adminApi";

export const MaintenanceContext = createContext(null);

/**
 * MaintenanceProvider — admin-scoped store for the maintenance-mode status.
 *
 * Wraps the admin shell so the persistent banner and the System settings tab
 * share one source of truth: the provider fetches the current status once on
 * mount, and the settings page calls setStatus() after a successful save so the
 * banner reflects the change immediately (no refetch, no page reload).
 */
export function MaintenanceProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminApi
      .getMaintenanceSettings()
      .then((res) => {
        if (!active) return;
        setEnabled(res.data.data.is_enabled);
        setMessage(res.data.data.message || "");
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setStatus = useCallback((isEnabled, msg = "") => {
    setEnabled(isEnabled);
    setMessage(msg || "");
  }, []);

  const value = useMemo(
    () => ({ enabled, message, loading, setStatus }),
    [enabled, message, loading, setStatus]
  );

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}
