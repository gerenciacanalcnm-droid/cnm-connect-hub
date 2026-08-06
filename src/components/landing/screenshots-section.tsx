import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Code2,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";
import type { LandingScreenshot } from "@/config/landing-content";
import { cn } from "@/lib/utils";

const ICONS: Record<LandingScreenshot["surface"], LucideIcon> = {
  dashboard: BarChart3,
  crm: Users,
  analytics: BarChart3,
  nova: Sparkles,
  campaigns: Send,
  automations: Workflow,
  api: Code2,
};

function SurfaceMockup({
  surface,
  title,
}: {
  surface: LandingScreenshot["surface"];
  title: string;
}) {
  const Icon = ICONS[surface];
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/70 bg-background">
      <div className="absolute inset-0 grid-bg opacity-[0.2]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-nova/15" />
      <div className="relative flex h-full items-center justify-center">
        <div className="rounded-2xl border border-border/60 bg-card/80 px-5 py-4 shadow-md backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                SMS CNM · vista
              </div>
              <div className="text-sm font-semibold text-foreground">{title}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenshotsSection() {
  const { screenshots } = useLandingContent();
  const [index, setIndex] = useState(0);
  const current = screenshots[index];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Producto</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Diseñado con obsesión por el detalle.
          </h2>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-xl sm:p-6">
          <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <SurfaceMockup surface={current.surface} title={current.title} />
              <div className="mt-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <div className="text-sm font-semibold text-foreground">{current.title}</div>
                  <div className="text-xs text-muted-foreground">{current.description}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setIndex((i) => (i - 1 + screenshots.length) % screenshots.length)
                    }
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-accent"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIndex((i) => (i + 1) % screenshots.length)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-accent"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {screenshots.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                i === index
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <MessageSquare className="h-3 w-3" />
              {s.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
