import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquare,
  Users,
  Send,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { ChartCard } from "@/components/common/chart-card";
import { Widget } from "@/components/common/widget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · SMS CNM" },
      {
        name: "description",
        content:
          "Visión general de tu cuenta SMS CNM: métricas, campañas y actividad reciente.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Dashboard"
        description="Bienvenido de nuevo. Aquí tienes un resumen de tu actividad."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Exportar
            </Button>
            <Button size="sm" className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Nueva campaña
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="SMS enviados"
          value="—"
          icon={MessageSquare}
          delta={{ value: "0%", direction: "neutral" }}
          hint="últimos 30 días"
        />
        <MetricCard
          label="Contactos activos"
          value="—"
          icon={Users}
          delta={{ value: "0%", direction: "neutral" }}
          hint="últimos 30 días"
        />
        <MetricCard
          label="Tasa de entrega"
          value="—"
          icon={TrendingUp}
          delta={{ value: "0%", direction: "neutral" }}
          hint="promedio"
        />
        <MetricCard
          label="Campañas activas"
          value="—"
          icon={Activity}
          hint="en curso"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Actividad de envíos"
          description="Volumen diario de mensajes"
          className="lg:col-span-2"
          actions={
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Ver detalle
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          }
        >
          <div className="grid h-64 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Gráfica lista para conectarse a datos
          </div>
        </ChartCard>

        <Widget
          title="Estado del sistema"
          actions={
            <Badge
              variant="secondary"
              className="gap-1 bg-success/10 text-success"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Operativo
            </Badge>
          }
          footer="Actualizado hace instantes"
        >
          <ul className="space-y-3 text-sm">
            {["API REST", "Envío de SMS", "Webhooks", "Panel"].map((s) => (
              <li
                key={s}
                className="flex items-center justify-between text-foreground"
              >
                <span>{s}</span>
                <span className="text-xs text-muted-foreground">100%</span>
              </li>
            ))}
          </ul>
        </Widget>
      </div>
    </div>
  );
}
