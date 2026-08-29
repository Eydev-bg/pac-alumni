import LandingNav from "../../components/landing/LandingNav";
import HeroSection from "../../components/landing/HeroSection";
import AboutSection from "../../components/landing/AboutSection";
import HowItWorksSection from "../../components/landing/HowItWorksSection";
import FeaturesSection from "../../components/landing/FeaturesSection";
import ContactSection from "../../components/landing/ContactSection";
import LandingFooter from "../../components/landing/LandingFooter";

/**
 * LandingPage — public marketing home at `/`.
 *
 * Composes the landing sections in the approved order: Hero, About, How It
 * Works, Features, Contact, Footer. WhyJoinSection,
 * AnnouncementsPreview, GallerySection, CareersPreview, and CtaBand from an
 * earlier iteration are NOT rendered here (per the latest approved
 * structure) but are left in place under components/landing/ in case they're
 * wanted again later — nothing was deleted, only unlinked from this page.
 *
 * All dynamic sections (stats, events, stories) currently render static
 * placeholder data shaped like the future API response; wiring real data
 * later is just passing a fetched prop to each *Preview / StatStrip
 * component.
 *
 * Inter is applied at the root as the base UI font; headings opt into
 * Playfair Display via inline styles, mirroring the existing convention in
 * LoginPage.jsx.
 */
export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-white text-navy-800"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <LandingNav />
      <main>
        <HeroSection />
        <AboutSection />
        <HowItWorksSection />
        <FeaturesSection />

        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}
