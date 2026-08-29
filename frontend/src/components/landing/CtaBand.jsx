import { Link } from "react-router-dom";
import { TbArrowRight } from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * CtaBand — a short dark band between Features and Contact holding the
 * page's one focused conversion moment. Not a nav target, but it keeps a
 * stable id so it can be linked to later.
 */
export default function CtaBand() {
  return (
    <section
      id="get-started"
      className="relative scroll-mt-20 overflow-hidden bg-[linear-gradient(135deg,var(--color-navy-900)_0%,var(--color-navy-950)_100%)] px-5 py-16 sm:px-8 lg:px-12 lg:py-20"
    >
      {/* Centered glow — purely cosmetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_120%_at_50%_50%,rgba(37,99,235,0.14)_0%,transparent_60%)]"
      />

      <Reveal direction="up" className="relative mx-auto max-w-2xl text-center">
        <h2
          className="text-[26px] font-extrabold leading-tight text-white sm:text-[30px]"
          style={SERIF}
        >
          Ready to reconnect with your PAC community?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-[1.6] text-slate-300">
          Join thousands of Philippine Advent College graduates who are already
          connected.
        </p>

        <Link
          to="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.6)] transition hover:scale-[1.02] hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/60 motion-reduce:hover:scale-100"
        >
          Create Your Alumni Account
          <TbArrowRight aria-hidden="true" className="h-[18px] w-[18px]" />
        </Link>

        <p className="mt-4 text-[13px] text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-400 transition hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
