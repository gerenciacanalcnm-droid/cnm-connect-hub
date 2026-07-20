import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Recommendation = {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
};

const recommendations: Recommendation[] = [
  { icon: Wallet, text: "Tu saldo alcanza para 72.000 SMS." },
  { icon: Clock, text: "Tu mejor hora para enviar campañas es 10:00 AM." },
  { icon: TrendingUp, text: "La campaña anterior tuvo 98,7% de entrega." },
  { icon: CheckCircle2, text: "Hay 14 clientes sin seguimiento reciente." },
];

export type NovaHeroProps = {
  greeting: string;
  userName: string;
  onOpenNova?: () => void;
  className?: string;
};

export function NovaHero({
  greeting,
  userName,
  onOpenNova,
  className,
}: NovaHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "surface-elevated relative overflow-hidden p-6 sm:p-8",
        className,
      )}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-nova/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.15]" />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-nova/25 bg-nova/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-nova">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-nova"
              style={{ animation: "nova-pulse 2s ease-in-out infinite" }}
            />
            CNM Nova · Asistente IA
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {greeting}, {userName}{" "}
            <span className="inline-block motion-safe:animate-[wave_1.6s_ease-in-out_2] origin-[70%_70%]">
              👋
            </span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            He analizado tu cuenta esta mañana. Tengo{" "}
            <span className="font-medium text-foreground">
              4 recomendaciones
            </span>{" "}
            para mejorar tu operación hoy.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            onClick={onOpenNova}
            size="lg"
            className="h-11 gap-2 gradient-nova text-white shadow-md transition-transform hover:scale-[1.02] hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" />
            Ver recomendaciones
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            className="group flex items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-nova/40 hover:shadow-md"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-nova/10 text-nova ring-1 ring-inset ring-nova/20 transition-colors group-hover:bg-nova/15">
              <rec.icon className="h-4 w-4" />
            </div>
            <p className="min-w-0 pt-0.5 text-sm leading-snug text-foreground">
              {rec.text}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
