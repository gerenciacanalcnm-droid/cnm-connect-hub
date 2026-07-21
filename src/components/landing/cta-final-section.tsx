import { ArrowRight } from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";

export function CtaFinalSection() {
  const { ctaFinal } = useLandingContent();
  return (
    <section id="contacto" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 p-10 shadow-xl sm:p-16">
          <div className="absolute inset-0 -z-10 gradient-nova opacity-90" />
          <div className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-[0.2]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" />

          <div className="max-w-2xl">
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {ctaFinal.title}
            </h2>
            <p className="mt-4 text-lg text-white/85">{ctaFinal.subtitle}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={ctaFinal.primaryCta.href}
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-primary shadow-md transition-transform hover:scale-[1.02]"
              >
                {ctaFinal.primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={ctaFinal.secondaryCta.href}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                {ctaFinal.secondaryCta.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
