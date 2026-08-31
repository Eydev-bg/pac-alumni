import { Link } from "react-router-dom";
import { TbBrandFacebook, TbMapPin, TbMail, TbPhone } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

const QUICK_LINKS = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

const linkClass =
  "block text-[13px] text-[#aebbd6] transition hover:text-blue-300";
const colHeading =
  "mb-3 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-blue-300";

/**
 * LandingFooter — deep-navy footer: brand + tagline + the college's real
 * Facebook page, quick links, account links, and contact details. The
 * dedicated ContactSection now owns the "#contact" nav anchor, so this
 * footer no longer carries that id (kept it before ContactSection existed).
 */
export default function LandingFooter() {
  return (
    <footer className="bg-navy-950 px-5 pb-4 pt-12 sm:px-8 lg:px-12">
      <h2 className="sr-only">Site footer</h2>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand + social */}
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <img
                src="/pac-logo.jpg"
                alt="Philippine Advent College seal"
                className="h-[34px] w-[34px] flex-none rounded-full border-2 border-[var(--color-gold-500)] bg-navy-900 object-cover"
              />
              <span>
                <span
                  className="block text-[15px] font-extrabold text-white"
                  style={SERIF}
                >
                  Philippine Advent College
                </span>
                <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-blue-300">
                  Alumni Tracking System
                </span>
              </span>
            </div>
            <p className="mb-4 max-w-[240px] text-[12.5px] leading-[1.6] text-[#8ea0c4]">
              Connecting Philippine Advent College graduates since 1975.
            </p>
            <div className="flex gap-2">
              {[
                // Real PAC Facebook page.
                {
                  icon: TbBrandFacebook,
                  label: "Facebook",
                  href: "https://www.facebook.com/PACollege1975/",
                },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.18] text-[#c9d3e8] transition hover:border-blue-500/50 hover:text-blue-300"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className={colHeading}>Quick links</h3>
            {QUICK_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Account */}
          <div>
            <h3 className={colHeading}>Account</h3>
            <Link to="/login" className={linkClass}>
              Log in
            </Link>
            <Link to="/register" className={linkClass}>
              Register
            </Link>
            <Link to="/forgot-password" className={linkClass}>
              Forgot password
            </Link>
          </div>

          {/* Contact */}
          <div>
            <h3 className={colHeading}>Contact</h3>
            <p className="mb-2 flex items-center gap-1.5 text-[13px] text-[#aebbd6]">
              <TbMapPin aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
              Ramon Magsaysay, Sindangan, Zamboanga del Norte, 7112
            </p>
            <a
              href="mailto:philippineadventcollege@gmail.com"
              className="mb-2 flex items-center gap-1.5 text-[13px] text-[#aebbd6] transition hover:text-blue-300"
            >
              <TbMail aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
              philippineadventcollege@gmail.com
            </a>
            <p className="flex items-center gap-1.5 text-[13px] text-[#aebbd6]">
              <TbPhone aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
              (63+) 9399185586
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-white/10 pt-5 text-center">
          <span className="text-[12px] text-[#7286a8]">
            © {new Date().getFullYear()} Philippine Advent College. All rights
            reserved.
          </span>
          <span aria-hidden="true" className="text-[12px] text-[#48587a]">
            ·
          </span>
          <Link
            to="/terms-of-use"
            className="text-[12px] text-[#7286a8] transition hover:text-blue-300"
          >
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  );
}
