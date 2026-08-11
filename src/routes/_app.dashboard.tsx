import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
  Ticket,
  Bolt,
  Rocket,
} from "lucide-react";
import { motion } from "framer-motion";
import { NovaHero } from "@/components/common/nova-hero";
import { KpiCard } from "@/components/common/kpi-card";
import { QuickActionButton, type QuickAction } from "@/components/common/quick-action";
import { ActivityTimeline, type TimelineItem } from "@/components/common/activity-timeline";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Centro de Comando · SMS CNM" },
      {
        name: "description",
        content:
          "Centro de comando de SMS CNM: recomendaciones de CNM Nova, KPIs, actividad reciente y acciones rápidas para operar tu cuenta.",
      },
    ],
  }),
  component: DashboardPage,
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function DashboardPage() {
  const setNovaOpen = useUIStore((s) => s.setNovaOpen);

  const quickActions: QuickAction[] = [
    { label: "Enviar SMS", description: "Mensaje rápido", icon: Send, tone: "primary" },
    { label: "Crear campaña", description: "Nuevo envío masivo", icon: Rocket, tone: "nova" },
    {
      label: "Importar Excel",
      description: "Cargar contactos",
      icon: FileSpreadsheet,
      tone: "info",
    },
    { label: "Nuevo cliente", description: "Añadir al CRM", icon: UserPlus, tone: "success" },
    { label: "Ir al CRM", description: "Gestionar contactos", icon: Users, tone: "neutral" },
    { label: "Recargar saldo", description: "Añadir créditos", icon: CreditCard, tone: "primary" },
  ];

  const timeline: TimelineItem[] = [];


  const sample = [12, 18, 14, 22, 19, 28, 26, 34, 30, 42, 38, 46];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Centro de Comando
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Panorama general
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ver reportes</span>
          </Button>
          <Button size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Nueva campaña
          </Button>
        </div>
      </motion.header>

      {/* CNM Nova hero */}
      <NovaHero greeting={getGreeting()} userName="Nicolás" onOpenNova={() => setNovaOpen(true)} />

      {/* KPIs */}
      <section aria-labelledby="kpis-title">
        <div className="mb-3 flex items-baseline justify-between">
          <h2
            id="kpis-title"
            className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Indicadores clave
          </h2>
          <span className="text-[11px] text-muted-foreground">Últimos 30 días</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            index={0}
            tone="primary"
            label="Saldo disponible"
            value="$0"
            unit="COP"
            icon={Wallet}
            hint="Ir a Finanzas > Wallet"
          />
          <KpiCard
            index={1}
            tone="info"
            label="SMS disponibles"
            value="0"
            icon={MessageSquare}
            hint="Requiere recarga"
          />
          <KpiCard
            index={2}
            tone="success"
            label="SMS enviados hoy"
            value="0"
            icon={Send}
            sparkline={[0, 0, 0, 0, 0, 0]}
          />
          <KpiCard
            index={3}
            tone="primary"
            label="SMS este mes"
            value="0"
            icon={TrendingUp}
            sparkline={[0, 0, 0, 0, 0, 0]}
          />
          <KpiCard
            index={4}
            tone="success"
            label="Tasa de entrega"
            value="0"
            unit="%"
            icon={CheckCircle2}
            progress={{ value: 0, label: "Sin datos" }}
          />
          <KpiCard
            index={5}
            tone="warning"
            label="Flash SMS"
            value="0"
            icon={Zap}
            sparkline={[0, 0, 0, 0, 0, 0]}
          />
          <KpiCard
            index={6}
            tone="nova"
            label="Campañas activas"
            value="0"
            icon={Rocket}
            hint="Sin actividad"
          />
          <KpiCard
            index={7}
            tone="info"
            label="Prospectos nuevos"
            value="0"
            icon={Users}
            sparkline={[0, 0, 0, 0, 0, 0]}
          />
          <KpiCard
            index={8}
            tone="nova"
            label="Automatizaciones"
            value="0"
            icon={Activity}
            hint="Esperando eventos"
          />
        </div>

      </section>

      {/* Bottom row: Quick actions + Timeline */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Acciones rápidas
            </h2>
            <span className="text-[11px] text-muted-foreground">Atajos frecuentes</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((a, i) => (
              <QuickActionButton key={a.label} action={a} index={i} />
            ))}
          </div>
        </div>

        <motion.aside
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5 shadow-xs"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Actividad reciente</h2>
            </div>
            <button
              type="button"
              className="text-[11px] font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Ver todo
            </button>
          </div>
          {timeline.length > 0 ? (
            <ActivityTimeline items={timeline} />
          ) : (
            <p className="py-10 text-center text-xs text-muted-foreground">
              No hay actividad reciente.
            </p>
          )}

        </motion.aside>
      </section>
    </div>
  );
}
