import { Link } from "react-router-dom";
import {
  TbBrandFacebook,
  TbBrandInstagram,
  TbBrandYoutube,
  TbMapPin,
  TbMail,
  TbPhone,
} from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

const QUICK_LINKS = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#announcements", label: "Announcements" },
  { href: "#events", label: "Events" },
  { href: "#careers", label: "Careers" },
];

const linkClass = "block text-[12px] text-[#aebbd6] transition hover:text-blue-300";
const colHeading = "mb-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-blue-300";

/**
 * LandingFooter — deep-navy footer: brand + tagline + social placeholders,
 * quick links, account links, and contact details. Also the "Contact" anchor
 * target for the nav.
 */
export default function LandingFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-navy-950 px-5 pb-4 pt-12 sm:px-8 lg:px-12">
      <h2 className="sr-only">Site footer</h2>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand + social */}
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <img
                src="/pac-logo.jpg"
                alt="Philippine Advent College seal"
                className="h-[34px] w-[34px] flex-none rounded-full border-2 border-blue-500 bg-navy-900 object-cover"
              />
              <span>
                <span className="block text-[13px] font-extrabold text-white" style={SERIF}>
                  Philippine Advent College
                </span>
                <span className="block text-[8px] uppercase tracking-[0.12em] text-blue-300">
                  Alumni Tracking System
                </span>
              </span>
            </div>
            <p className="mb-3 max-w-[230px] text-[11.5px] leading-[1.6] text-[#8ea0c4]">
              The school that prepares students to serve — connecting graduates
              since 1975.
            </p>
            <div className="flex gap-2">
              {[
                // Real PAC Facebook page.
                { icon: TbBrandFacebook, label: "Facebook", href: "https://www.facebook.com/PACollege1975/" },
                // TODO: replace with official PAC Instagram once created.
                { icon: TbBrandInstagram, label: "Instagram", href: "https://www.instagram.com/" },
                // TODO: replace with official PAC YouTube once created.
                { icon: TbBrandYoutube, label: "YouTube", href: "https://www.youtube.com/" },
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
            <Link to="/login" className={linkClass}>Log in</Link>
            <Link to="/register" className={linkClass}>Register</Link>
            <Link to="/forgot-password" className={linkClass}>Forgot password</Link>
            {/* TODO: real help center URL */}
            <a href="#" className={linkClass}>Help center</a>
          </div>

          {/* Contact */}
          <div>
            <h3 className={colHeading}>Contact</h3>
            {/* TODO: confirm real phone number before launch */}
            <p className="mb-2 flex items-center gap-1.5 text-[12px] text-[#aebbd6]">
              <TbMapPin aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
              Sindangan, Zamboanga del Norte
            </p>
            <a href="mailto:alumni@pac.edu.ph" className="mb-2 flex items-center gap-1.5 text-[12px] text-[#aebbd6] transition hover:text-blue-300">
              <TbMail aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
              alumni@pac.edu.ph
            </a>
            <p className="flex items-center gap-1.5 text-[12px] text-[#aebbd6]">
              <TbPhone aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
              (065) 000-0000
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-3.5 text-center">
          <span className="text-[11px] text-[#7286a8]">
            © {new Date().getFullYear()} Philippine Advent College. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
