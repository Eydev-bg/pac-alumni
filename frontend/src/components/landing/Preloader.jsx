// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/components/landing/Preloader.jsx
//  Branded intro for the public landing page ONLY (see LandingPage.jsx).
//  Deliberately NOT a route-level or app-level loader: it is a brand
//  moment, so it is scoped to the one page that wants it.
//
//  The overlay paints the SAME --color-navy-950 the hero uses, so the
//  cross-fade at the end reads as one continuous surface rather than a
//  screen swapping for another — there is no color flash between them.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from "react";

// Matches HeroSection's heading font (Playfair is loaded at 700/800 only,
// so this text stays at font-bold — 700 — to avoid a synthesised weight).
const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// `hold` = logo/word-mark on screen; `fade` = the cross-fade into the page.
// Full run is 1800 + 400 = 2200ms end to end. Visitors who asked for reduced
// motion get the same branding without the staged reveal, so they wait less.
const TIMINGS = {
  full: { hold: 1800, fade: 400 },
  reduced: { hold: 900, fade: 250 },
};

// Injected with the overlay and removed with it — nothing outlives the
// component. Names are `pacPre*` scoped so they can't collide with anything
// else on the page.
const KEYFRAMES = `
@keyframes pacPreGlow  { from { opacity: 0 } to { opacity: 1 } }
@keyframes pacPreFade  { from { opacity: 0 } to { opacity: 1 } }
@keyframes pacPreLogo  { from { opacity: 0; transform: scale(0.84) } to { opacity: 1; transform: scale(1) } }
@keyframes pacPreRise  { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
@keyframes pacPreDot   { 0%, 100% { opacity: 0.25; transform: scale(0.8) } 50% { opacity: 1; transform: scale(1) } }

/* One shared ease-out curve so the staged reveal feels like a single motion. */
.pac-pre-glow  { animation: pacPreGlow 1100ms ease-out both }
.pac-pre-logo  { animation: pacPreLogo 700ms cubic-bezier(0.22, 1, 0.36, 1) both }
.pac-pre-title { animation: pacPreRise 600ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both }
.pac-pre-sub   { animation: pacPreRise 600ms cubic-bezier(0.22, 1, 0.36, 1) 360ms both }
.pac-pre-dots  { animation: pacPreFade 400ms ease-out 600ms both }
.pac-pre-dot   { animation: pacPreDot 1400ms ease-in-out infinite }

/* Belt-and-braces with the JS check below: even if the media query flips
   after mount, no element here scales, rises, or pulses. The opacity
   cross-fade is kept — a fade carries no motion, and removing it would
   replace a smooth reveal with a hard flash. */
@media (prefers-reduced-motion: reduce) {
  .pac-pre-glow,
  .pac-pre-logo,
  .pac-pre-title,
  .pac-pre-sub,
  .pac-pre-dots,
  .pac-pre-dot {
    animation: none !important;
  }
}
`;

/**
 * Preloader — wraps the landing page and plays a short branded reveal.
 *
 * `children` stay MOUNTED the whole time and are hidden with opacity, never
 * conditional rendering, so the hero photo, logo, and webfonts are already
 * downloading while the intro plays. The overlay, by contrast, unmounts
 * completely once its fade finishes, so it leaves nothing invisible sitting
 * over the page swallowing clicks.
 */
export default function Preloader({ children }) {
  // Read once at mount: this only picks timings, and re-timing a reveal
  // that is already running would be worse than letting it finish.
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const { hold, fade } = reduced ? TIMINGS.reduced : TIMINGS.full;

  // intro → exiting (cross-fade) → done (overlay unmounted)
  const [phase, setPhase] = useState("intro");
  const done = phase === "done";

  useEffect(() => {
    const toExit = window.setTimeout(() => setPhase("exiting"), hold);
    const toDone = window.setTimeout(() => setPhase("done"), hold + fade);
    return () => {
      window.clearTimeout(toExit);
      window.clearTimeout(toDone);
    };
  }, [hold, fade]);

  // Without this the page scrolls behind the overlay and the reveal lands
  // somewhere down the page instead of on the hero. Restores whatever was
  // there before, on both the phase change and an early unmount.
  useEffect(() => {
    if (done) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [done]);

  return (
    <div className="relative">
      {/* Always in the DOM — hidden by opacity so its images/fonts load now. */}
      <div
        className="relative z-0 transition-opacity ease-out"
        style={{
          opacity: phase === "intro" ? 0 : 1,
          transitionDuration: `${fade}ms`,
        }}
      >
        {children}
      </div>

      {!done && (
        <div
          // Decorative: the real content underneath is already exposed to
          // assistive tech, so there is nothing here worth announcing.
          aria-hidden="true"
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[var(--color-navy-950)] transition-opacity ease-out ${
            phase === "exiting" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${fade}ms` }}
        >
          <style>{KEYFRAMES}</style>

          {/* Depth wash behind the mark, echoing the hero's radial glow.
              Uses the blue token via color-mix rather than a repeated hex;
              it is a lone decorative layer, so if a browser can't parse it
              the glow simply doesn't paint and nothing else is affected. */}
          <div
            className="pac-pre-glow pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 44%, color-mix(in srgb, var(--color-blue-600) 20%, transparent) 0%, transparent 60%)",
            }}
          />

          <div className="relative flex flex-col items-center px-6 text-center">
            <img
              src="/pac-logo.jpg"
              alt=""
              className="pac-pre-logo h-20 w-20 rounded-full border border-white/20 bg-white object-cover shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            />

            {/* Not an <h1>: the hero below already owns that, and a second
                one would muddy the document outline for no benefit. */}
            <p
              className="pac-pre-title mt-6 text-[1.75rem] font-bold tracking-tight text-white sm:text-[2rem]"
              style={SERIF}
            >
              PAC Alumni
            </p>

            <p className="pac-pre-sub mt-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-400">
              Philippine Advent College
            </p>

            <div className="pac-pre-dots mt-8 flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="pac-pre-dot h-1.5 w-1.5 rounded-full bg-blue-400"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
