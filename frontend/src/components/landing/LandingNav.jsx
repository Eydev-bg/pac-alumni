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
  "rounded-[7px] bg-gradient-to-r from-gold-500 to-gold-300 px-3.5 py-1.5 text-[12px] font-semibold text-navy-800 transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-gold-300/60";
const LOGIN_BTN =
  "rounded-[7px] border border-white/25 px-3 py-1.5 text-[12px] font-medium text-[#e6ecf7] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40";

/**
 * LandingNav — sticky, translucent-navy public navigation.
 * Three zones: brand · section links (center) · Log in + Register (right).
 * Below md the center links collapse into a hamburger disclosure while the
 * Log in / Register actions stay visible in the top bar.
 */
export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b border-gold-500/18 bg-navy-950/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Brand — logo mark always; wordmark only from md up (hidden below md
            so it can't wrap or crowd the actions on small screens). */}
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/pac-logo.jpg"
            alt="Philippine Advent College seal"
            className="h-9 w-9 flex-none rounded-full border-2 border-gold-500 bg-navy-900 object-cover"
          />
          <span
            className="hidden truncate whitespace-nowrap text-[13px] font-extrabold leading-none tracking-[0.03em] text-white md:block"
            style={SERIF}
          >
            Philippine Advent College
          </span>
        </a>

        {/* Center links (desktop) */}
        <div className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[12px] font-medium text-[#c9d3e8] transition hover:text-gold-300"
            >
              {link.label}
            </a>
          ))}
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
            className="ml-1 rounded-lg p-1.5 text-[#c9d3e8] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 lg:hidden"
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
          className="border-t border-white/10 bg-navy-950/95 px-4 py-3 lg:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-[#c9d3e8] transition hover:bg-white/6 hover:text-gold-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
