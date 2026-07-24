import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/admin-page";
import { KpiCard } from "@/components/common/kpi-card";
import { ChartCard } from "@/components/common/chart-card";
import { Button } from "@/components/ui/button";
import { Building2, Users, MessageSquare, DollarSign, TrendingUp, AlertTriangle, Activity, Wallet, Send, MessageCircle, Zap, Package, RefreshCw, ServerCog } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from "recharts";
import { StatusBadge } from "@/components/common/status-badge";

export const Route = createFileRoute("/_admin/admin/dashboard" as never)({
  head: () => ({ meta: [{ title: "Super Dashboard — SMS CNM Admin" }, { name: "description", content: "Centro de control ejecutivo de SMS CNM." }] }),
  component: SuperDashboard,
});

const revenue = Array.from({ length: 12 }, (_, i) => ({
  month: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i],
  ingresos: 8_000_000 + Math.round(Math.random() * 4_000_000),
  recargas: 6_000_000 + Math.round(Math.random() * 3_500_000),
}));

const traffic = Array.from({ length: 30 }, (_, i) => ({
  d: `${i + 1}`,
  sms: 40_000 + Math.round(Math.random() * 30_000),
  wa: 5_000 + Math.round(Math.random() * 8_000),
}));

const up = { value: "+12%", direction: "up" as const };
const down = { value: "-8%", direction: "down" as const };

function SuperDashboard() {
  return (
    <AdminPage
      title="Dashboard Ejecutivo"
      description="Métricas operativas y comerciales en tiempo real."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><RefreshCw className="mr-1.5 h-4 w-4" />Actualizar</Button>
          <Button size="sm">Exportar</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Empresas" value="248" icon={Building2} delta={up} />
        <KpiCard label="Usuarios activos" value="1.842" icon={Users} delta={up} />
        <KpiCard label="Clientes" value="3.517" icon={Users} delta={up} />
        <KpiCard label="Ingresos (mes)" value="$128.4M" icon={DollarSign} delta={up} tone="success" />
        <KpiCard label="Saldo vendido" value="$412M" icon={Wallet} delta={up} />
        <KpiCard label="Saldo disponible" value="$78.2M" icon={Wallet} />
        <KpiCard label="SMS enviados hoy" value="184K" icon={Send} delta={up} />
        <KpiCard label="WhatsApp enviados" value="21K" icon={MessageCircle} delta={up} tone="nova" />
        <KpiCard label="Campañas activas" value="132" icon={MessageSquare} />
        <KpiCard label="Recargas (mes)" value="612" icon={Package} delta={up} />
        <KpiCard label="Clientes nuevos" value="94" icon={TrendingUp} delta={up} tone="success" />
        <KpiCard label="Uso API" value="1.2M req" icon={Activity} />
        <KpiCard label="Errores 24h" value="42" icon={AlertTriangle} tone="destructive" delta={down} />
        <KpiCard label="Alertas" value="7" icon={Zap} tone="destructive" />
        <KpiCard label="Facturación" value="$142.8M" icon={DollarSign} tone="success" />
        <KpiCard label="Sistema" value="Operativo" icon={ServerCog} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ingresos vs Recargas" description="Últimos 12 meses">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              <Bar dataKey="recargas" fill="hsl(var(--nova))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tráfico de mensajería" description="SMS + WhatsApp últimos 30 días">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={traffic}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="d" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="sms" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
              <Area type="monotone" dataKey="wa" stroke="hsl(var(--nova))" fill="hsl(var(--nova) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Estado del sistema" description="Componentes críticos">
          <div className="space-y-3">
            {[
              { name: "API Gateway", s: "active" },
              { name: "SMS Gateway (Infobip)", s: "active" },
              { name: "Base de datos", s: "active" },
              { name: "CNM Nova", s: "active" },
              { name: "Webhooks", s: "active" },
            ].map((x) => (
              <div key={x.name} className="flex items-center justify-between">
                <span className="text-sm">{x.name}</span>
                <StatusBadge status={x.s} />
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Alertas recientes" description="Últimas 24 horas">
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" /> Rate limit del 92% para tenant "Retail Prime".</li>
            <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" /> 3 recargas pendientes de aprobación &gt;24h.</li>
            <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" /> Proveedor SMS reportó latencia elevada 03:12.</li>
          </ul>
        </ChartCard>
        <ChartCard title="Actividad" description="Últimos eventos">
          <ul className="space-y-3 text-sm">
            <li>+94 nuevos usuarios esta semana</li>
            <li>+18 empresas activadas</li>
            <li>512 campañas ejecutadas hoy</li>
            <li>7 tickets críticos abiertos</li>
          </ul>
        </ChartCard>
      </div>
    </AdminPage>
  );
}
