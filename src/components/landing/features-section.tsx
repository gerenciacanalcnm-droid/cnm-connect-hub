import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Code2,
  LifeBuoy,
  Mail,
  MessageCircle,
  MessageSquare,
  Radio,
  Share2,
  Smartphone,
  Sparkles,
  Store,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";
import type { LandingFeature } from "@/config/landing-content";
import { cn } from "@/lib/utils";

const ICONS: Record<LandingFeature["icon"], LucideIcon> = {
  sms: MessageSquare,
  whatsapp: MessageCircle,
  email: Mail,
  hub: Radio,
  flash: Zap,
  crm: Users,
  analytics: BarChart3,
  automation: Workflow,
  api: Code2,
  nova: Sparkles,
  help: LifeBuoy,
  pwa: Bot,
  responsive: Smartphone,
  affiliates: Share2,
  distributors: Store,
};

const TONES: Record<LandingFeature["tone"], string> = {
  primary: "bg-primary/10 text-primary ring-primary/20",
  nova: "bg-nova/10 text-nova ring-nova/20",
  info: "bg-info/10 text-info ring-info/20",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/15 text-warning-foreground ring-warning/30",
};

export function FeaturesSection() {
  const { features } = useLandingContent();

  return (
    <section id="funciones" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Funciones</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Todo lo que necesitas para escalar tu comunicación.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Un stack completo pensado para equipos que envían millones de mensajes.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: (i % 6) * 0.05, duration: 0.4 }}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset transition-transform group-hover:scale-105",
                    TONES[f.tone],
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
