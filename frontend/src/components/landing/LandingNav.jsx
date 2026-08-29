import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TbMenu2, TbX } from "react-icons/tb";

// Center section links — each anchor-scrolls to its section id on this page.
// "Home" targets the hero; "Contact" targets the footer.
const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

// One solid CTA plus one plain text link, so the two never compete visually.
const JOIN_BTN =
  "rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.35)] focus:outline-none focus:ring-2 focus:ring-blue-400/50";
const SIGNIN_LINK =
  "text-[13px] font-medium text-slate-300 transition hover:text-white";

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
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
    <nav
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-white/10 bg-[var(--color-navy-950)]/95 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
          : "border-white/5 bg-[var(--color-navy-950)]/90"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/pac-logo.jpg"
            alt="Philippine Advent College seal"
            className="h-9 w-9 flex-none rounded-full border border-white/20 bg-white object-cover"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate whitespace-nowrap text-[15px] font-bold tracking-tight text-white">
              PAC Alumni
            </span>
          </span>
        </a>

        {/* Center links (desktop) */}
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeId === link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={`group relative px-3 py-2 text-[14px] font-medium transition-colors ${
                  isActive
                    ? "text-blue-400"
                    : "text-slate-300 hover:text-blue-400"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-1 left-0 h-[1.5px] rounded-full bg-blue-400 transition-[width] duration-300 ease-out motion-reduce:transition-none ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            );
          })}
        </div>

        {/* Right actions + mobile toggle */}
        <div className="flex shrink-0 items-center gap-4">
          <Link to="/login" className={SIGNIN_LINK}>
            Sign In
          </Link>
          <Link to="/register" className={JOIN_BTN}>
            Join Now
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="ml-1 rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 lg:hidden"
          >
            {menuOpen ? (
              <TbX aria-hidden="true" className="h-5 w-5" />
            ) : (
              <TbMenu2 aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel — always rendered so it can animate its height /
          opacity open and closed instead of popping in. */}
      <div
        id="landing-mobile-menu"
        className={`overflow-hidden transition-[max-height,opacity] duration-250 ease-out motion-reduce:transition-none lg:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-white/10 bg-[var(--color-navy-950)] px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-col">
            {NAV_LINKS.map((link) => {
              const isActive = activeId === link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-2 py-2.5 text-sm font-medium transition hover:bg-white/5 ${
                    isActive
                      ? "text-blue-400"
                      : "text-slate-300 hover:text-blue-400"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
