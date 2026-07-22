import { Link } from "react-router-dom";
import { TbArrowRight } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * CtaBand — full-width navy closing call-to-action, centered.
 */
export default function CtaBand() {
  return (
    <section className="bg-[linear-gradient(135deg,var(--color-blue-600)_0%,var(--color-blue-700)_100%)] px-5 py-16 text-center sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100">
          Join the community
        </p>
        <h2 className="mb-2 text-[27px] font-extrabold leading-tight text-white sm:text-[30px]" style={SERIF}>
          Ready to reconnect with PAC?
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-[13px] leading-[1.65] text-blue-100 sm:text-sm">
          Verify your Alumni ID, create your account, and step back into the
          Philippine Advent College community today.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-[22px] py-2.5 text-[13px] font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            Register with your ID <TbArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-[9px] border border-white/30 px-[18px] py-2.5 text-[13px] font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
