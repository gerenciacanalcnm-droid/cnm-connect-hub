import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, TrendingDown, Trophy } from "lucide-react";
import { useLandingContent } from "@/hooks/use-landing-content";
import { useRateTiers } from "@/hooks/use-commercial";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LandingPlan, LandingPlanBadge } from "@/config/landing-content";

const BADGES: Record<
  Exclude<LandingPlanBadge, null>,
  { label: string; icon: typeof Sparkles; className: string }
> = {
  "top-seller": {
    label: "Más vendido",
    icon: Sparkles,
    className: "bg-primary text-primary-foreground",
  },
  "best-price": { label: "Mejor precio", icon: Trophy, className: "gradient-nova text-white" },
  "best-saving": {
    label: "Mayor ahorro",
    icon: TrendingDown,
    className: "bg-success text-success-foreground",
  },
};

function PlanCard({ plan, index }: { plan: LandingPlan; index: number }) {
  const highlight = plan.badge === "top-seller";
  const Badge = plan.badge ? BADGES[plan.badge] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
        highlight ? "border-primary/50 ring-1 ring-primary/30" : "border-border/70",
      )}
    >
      {Badge && (
        <div
          className={cn(
            "absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm",
            Badge.className,
          )}
        >
          <Badge.icon className="h-3 w-3" />
          {Badge.label}
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {plan.volumeLabel}
      </p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight text-foreground">
          {formatCurrency(plan.pricePerSms, plan.currency)}
        </span>
        <span className="text-sm font-medium text-muted-foreground">/ SMS</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Volumen mensual estimado: {formatNumber(plan.volume)}
      </p>

      <ul className="mt-5 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            {f}
          </li>
        ))}
      </ul>

      <a
        href={plan.cta.href}
        className={cn(
          "mt-6 inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-all",
          highlight
            ? "gradient-brand text-primary-foreground shadow-md hover:scale-[1.02]"
            : "border border-border bg-background text-foreground hover:bg-accent",
        )}
      >
        {plan.cta.label}
      </a>
    </motion.div>
  );
}

export function PlansSection() {
  const { plans: fallbackPlans } = useLandingContent();
  const { data: tiers } = useRateTiers();

  /** Los precios por volumen provienen del Motor Comercial (rate_tiers). */
  const plans = useMemo<LandingPlan[]>(() => {
    const sms = (tiers ?? []).filter((t) => t.channel === "sms" && t.isActive);
    if (sms.length === 0) return fallbackPlans;
    const sorted = [...sms].sort((a, b) => a.fromQty - b.fromQty);
    const cheapest = Math.min(...sorted.map((t) => t.unitPrice));
    return sorted.map((t, i) => ({
      id: t.id,
      volume: t.toQty || t.fromQty,
      volumeLabel: `${formatNumber(t.fromQty)} – ${t.toQty ? formatNumber(t.toQty) : "∞"} SMS`,
      pricePerSms: t.unitPrice,
      currency: t.currency,
      badge:
        t.unitPrice === cheapest
          ? "best-price"
          : i === Math.floor(sorted.length / 2)
            ? "top-seller"
            : null,
      features: fallbackPlans[Math.min(i, fallbackPlans.length - 1)]?.features ?? [],
      cta: { label: "Empezar ahora", href: "/register" },
    }));
  }, [tiers, fallbackPlans]);

  return (
    <section id="planes" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Planes</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Precios por volumen, sin sorpresas.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Mientras más envías, menos pagas por SMS. Sin mensualidades ni permanencia.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((p, i) => (
            <PlanCard key={p.id} plan={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
