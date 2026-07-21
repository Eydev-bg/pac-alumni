import LandingNav from "../../components/landing/LandingNav";
import HeroSection from "../../components/landing/HeroSection";
import AboutSection from "../../components/landing/AboutSection";
import FeaturesSection from "../../components/landing/FeaturesSection";
import WhyJoinSection from "../../components/landing/WhyJoinSection";
import AnnouncementsPreview from "../../components/landing/AnnouncementsPreview";
import EventsPreview from "../../components/landing/EventsPreview";
import CareersPreview from "../../components/landing/CareersPreview";
import SuccessStories from "../../components/landing/SuccessStories";
import CtaBand from "../../components/landing/CtaBand";
import LandingFooter from "../../components/landing/LandingFooter";

/**
 * LandingPage — public marketing home at `/`.
 *
 * Composes the landing sections in the approved order. All dynamic sections
 * (stats, announcements, events, careers, stories) currently render static
 * placeholder data shaped like the future API response; wiring real data later
 * is just passing a fetched prop to each *Preview / StatStrip component.
 *
 * Inter is applied at the root as the base UI font (matching the approved
 * comp); headings opt into Playfair Display via inline styles, mirroring the
 * existing convention in LoginPage.jsx.
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
        <FeaturesSection />
        <WhyJoinSection />
        <AnnouncementsPreview />
        <EventsPreview />
        <CareersPreview />
        <SuccessStories />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
