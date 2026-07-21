import { Link } from "react-router-dom";
import { TbArrowRight } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * CtaBand — full-width navy closing call-to-action, centered.
 */
export default function CtaBand() {
  return (
    <section className="bg-[linear-gradient(120deg,var(--color-navy-800),var(--color-navy-900))] px-5 py-16 text-center sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300">
          Join the community
        </p>
        <h2 className="mb-2 text-[27px] font-extrabold leading-tight text-white sm:text-[30px]" style={SERIF}>
          Ready to reconnect with PAC?
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-[13px] leading-[1.65] text-[#c3cee2] sm:text-sm">
          Verify your Alumni ID, create your account, and step back into the
          Philippine Advent College community today.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-[9px] bg-gradient-to-r from-gold-500 to-gold-300 px-[22px] py-2.5 text-[13px] font-semibold text-navy-800 shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-gold-300/60"
          >
            Register with your ID <TbArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-[9px] border border-white/30 px-[18px] py-2.5 text-[13px] font-medium text-[#e6ecf7] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
