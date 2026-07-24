import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppRouter from "./routes/AppRouter";

export default function App() {
  return (
    // BrowserRouter wraps everything so ThemeProvider can read the current path
    // (via useLocation) and scope the `dark` class to /alumni routes only.
    // ThemeProvider still sits OUTSIDE AuthProvider so the theme applies on the
    // login page too, before any user is known.
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
