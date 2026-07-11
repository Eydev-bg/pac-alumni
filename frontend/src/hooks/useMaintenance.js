import { useContext } from "react";
import { MaintenanceContext } from "../context/MaintenanceContext";

/**
 * useMaintenance — access the admin maintenance-mode status/store.
 *
 * Usage: const { enabled, message, setStatus } = useMaintenance();
 */
export function useMaintenance() {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return ctx;
}
