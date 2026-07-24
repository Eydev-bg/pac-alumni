import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Custom hook to access theme context.
 * Usage: const { theme, setTheme, resolvedTheme } = useTheme();
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
