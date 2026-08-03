import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { StatsSection } from "@/components/landing/stats-section";
import { NovaSection } from "@/components/landing/nova-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PlansSection } from "@/components/landing/plans-section";
import { CalculatorSection } from "@/components/landing/calculator-section";
import { ScreenshotsSection } from "@/components/landing/screenshots-section";
import { ApiSection } from "@/components/landing/api-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaFinalSection } from "@/components/landing/cta-final-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { siteConfig } from "@/config/site";

const canonical = siteConfig.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SMS CNM — Plataforma inteligente de SMS empresariales" },
      {
        name: "description",
        content:
          "SMS Masivos, Flash SMS, CRM, automatizaciones y CNM Nova (IA) en una sola plataforma. Envía millones de mensajes con la infraestructura de CNM Digital Media.",
      },
      { name: "keywords", content: "SMS masivos, Flash SMS, SMS empresarial, CRM SMS, API SMS, CNM Nova, Colombia" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "SMS CNM — Plataforma inteligente de SMS empresariales" },
      {
        property: "og:description",
        content:
          "SMS Masivos, Flash SMS, CRM, automatizaciones y CNM Nova (IA) en una sola plataforma. Envía millones de mensajes con la infraestructura de CNM Digital Media.",
      },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SMS CNM — Plataforma inteligente de SMS empresariales" },
      {
        name: "twitter:description",
        content:
          "SMS Masivos, Flash SMS, CRM, automatizaciones y CNM Nova (IA) en una sola plataforma. Envía millones de mensajes con la infraestructura de CNM Digital Media.",
      },
    ],
    links: [{ rel: "canonical", href: canonical }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "SMS CNM",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          publisher: {
            "@type": "Organization",
            name: "CNM Digital Media SAS",
            url: "https://canalcnm.com",
            logo: "https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png",
          },
          offers: { "@type": "Offer", priceCurrency: "COP" },
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <LandingNavbar />
      <main>
        <LandingHero />
        <StatsSection />
        <NovaSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PlansSection />
        <CalculatorSection />
        <ScreenshotsSection />
        <ApiSection />
        <FaqSection />
        <CtaFinalSection />
      </main>
      <LandingFooter />
    </div>
  );
}
