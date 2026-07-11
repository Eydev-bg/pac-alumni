import { MAINTENANCE } from "../config/constants";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";

/**
 * Public maintenance page shown to blocked (Alumni/Employer) users while
 * maintenance mode is on. The custom message is stashed in sessionStorage by
 * the axios 503 interceptor; falls back to a default if visited directly.
 */
export default function MaintenancePage() {
  const message =
    sessionStorage.getItem(MAINTENANCE.MESSAGE_KEY) ||
    MAINTENANCE.FALLBACK_MESSAGE;

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/25 flex items-center justify-center mb-6">
          <HiOutlineWrenchScrewdriver className="w-8 h-8 text-gold-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Under Maintenance
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.08] border border-white/[0.1] text-slate-200 hover:bg-white/[0.14] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
