import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppRouter from "./routes/AppRouter";

export default function App() {
  return (
    // BrowserRouter wraps everything so child providers have access to routing.
    // ThemeProvider sits OUTSIDE AuthProvider so the theme applies on the login
    // page too, before any user is known. AuthProvider hydrates the theme from
    // the backend on login/refresh.
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
