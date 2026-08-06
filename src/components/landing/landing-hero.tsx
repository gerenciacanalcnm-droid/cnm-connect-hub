import { motion } from "framer-motion";
import { ArrowRight, Code2, PlayCircle, Sparkles } from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";
import { DashboardMockup } from "./dashboard-mockup";

export function LandingHero() {
  const { hero } = useLandingContent();

  return (
    <section id="inicio" className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-10 top-40 h-[380px] w-[380px] rounded-full bg-nova/20 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.25]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-nova/25 bg-nova/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-nova"
          >
            <Sparkles className="h-3 w-3" />
            {hero.eyebrow}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {hero.title} <span className="text-gradient-nova">{hero.highlight}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <a
              href={hero.primaryCta.href}
              className="group inline-flex h-11 items-center gap-2 rounded-lg gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]"
            >
              {hero.primaryCta.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background/70 px-5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-accent"
            >
              <PlayCircle className="h-4 w-4" />
              {hero.secondaryCta.label}
            </a>
            <a
              href={hero.tertiaryCta.href}
              className="inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
            >
              <Code2 className="h-4 w-4" />
              {hero.tertiaryCta.label}
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-6 text-xs text-muted-foreground"
          >
            {hero.trustLine}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
          className="relative"
          style={{ perspective: 1200 }}
        >
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-nova/15 to-transparent blur-2xl" />
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
