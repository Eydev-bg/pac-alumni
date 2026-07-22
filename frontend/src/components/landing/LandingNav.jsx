import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TbMenu2, TbX } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Center section links — each anchor-scrolls to its section id on this page.
// "Home" targets the hero; "Contact" targets the footer.
const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#announcements", label: "Announcements" },
  { href: "#events", label: "Events" },
  { href: "#careers", label: "Careers" },
  { href: "#contact", label: "Contact" },
];

const REGISTER_BTN =
  "rounded-lg bg-blue-600 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40";
const LOGIN_BTN =
  "rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300";

/**
 * LandingNav — sticky, translucent-navy public navigation.
 * Three zones: brand · section links (center) · Log in + Register (right).
 * Below md the center links collapse into a hamburger disclosure while the
 * Log in / Register actions stay visible in the top bar.
 */
export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("home");

  // Track the section currently in view so the matching nav link highlights.
  // IntersectionObserver (no scroll listener) avoids per-frame jank; the
  // asymmetric rootMargin focuses the "active" band around the viewport middle.
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Brand — logo mark always; wordmark only from md up (hidden below md
            so it can't wrap or crowd the actions on small screens). */}
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/pac-logo.jpg"
            alt="Philippine Advent College seal"
            className="h-9 w-9 flex-none rounded-full border border-slate-200 bg-white object-cover"
          />
          <span
            className="hidden truncate whitespace-nowrap text-[13px] font-extrabold leading-none tracking-[0.03em] text-slate-800 md:block"
            style={SERIF}
          >
            Philippine Advent College
          </span>
        </a>

        {/* Center links (desktop) */}
        <div className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeId === link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={`group relative text-[12px] font-medium transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-1 left-0 h-[1.5px] rounded-full bg-blue-600 transition-[width] duration-300 ease-out motion-reduce:transition-none ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            );
          })}
        </div>

        {/* Right actions + mobile toggle */}
        <div className="flex shrink-0 items-center gap-2.5">
          <Link to="/login" className={LOGIN_BTN}>
            Log in
          </Link>
          <Link to="/register" className={REGISTER_BTN}>
            Register
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="ml-1 rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 lg:hidden"
          >
            {menuOpen ? (
              <TbX aria-hidden="true" className="h-5 w-5" />
            ) : (
              <TbMenu2 aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col">
            {NAV_LINKS.map((link) => {
              const isActive = activeId === link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-2 py-2.5 text-sm font-medium transition hover:bg-slate-50 ${
                    isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
