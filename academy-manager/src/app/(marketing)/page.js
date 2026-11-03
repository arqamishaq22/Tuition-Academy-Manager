import {
  Navbar,
  Hero,
  TrustedStrip,
  Features,
  HowItWorks,
  Stats,
  Pricing,
  Testimonials,
  FAQ,
  FinalCTA,
  Footer,
} from "@/components/sections";

export const metadata = {
  title: "Academy Manager - Run Your Academy Without Paper Registers",
  description:
    "Smart management SaaS web application for Pakistani tuition academies, coaching centers, and private tutors. Track attendance, fees in PKR, report cards, and automated WhatsApp parent alerts.",
};

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B1020] dark:text-slate-100 overflow-x-hidden font-body selection:bg-primary-500 selection:text-white">
      {/* 1. Sticky Glass Navbar */}
      <Navbar />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 2. Hero with Animated Gradient Mesh & Floating Preview */}
        <Hero />

        {/* 3. Trusted Subjects Strip */}
        <TrustedStrip />

        {/* 4. Core Academy Features Grid */}
        <Features />

        {/* 5. 3-Step Setup Flow */}
        <HowItWorks />

        {/* 6. Animated Numerical Stats Strip */}
        <Stats />

        {/* 7. PKR Pricing with Monthly/Yearly Toggle */}
        <Pricing />

        {/* 8. Academy Owner Testimonials Carousel */}
        <Testimonials />

        {/* 9. FAQ Accordion */}
        <FAQ />

        {/* 10. Final Call To Action */}
        <FinalCTA />
      </main>

      {/* 11. Multi-Column Footer */}
      <Footer />
    </div>
  );
}
