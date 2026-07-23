import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, TrendingUp, TrendingDown, MessageSquare, AlertTriangle, DollarSign, Percent } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonCards } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { useAnalyticsBreakdown } from "@/hooks/use-analytics";
import { formatNumber, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · SMS CNM" },
      { name: "description", content: "Métricas de entrega, costos y rendimiento por operador y país." },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_COLORS = ["oklch(0.58 0.22 300)", "oklch(0.65 0.18 250)", "oklch(0.7 0.16 190)", "oklch(0.75 0.14 140)", "oklch(0.65 0.14 60)"];

function AnalyticsPage() {
  const { data, isLoading, error, refetch } = useAnalyticsBreakdown();
  const [period, setPeriod] = useState("30d");

  const kpis = useMemo(() => {
    if (!data) return null;
    const sent = data.delivery.reduce((a, b) => a + b.y, 0);
    const failed = data.failures.reduce((a, b) => a + b.y, 0);
    const cost = data.cost.reduce((a, b) => a + b.y, 0);
    const rate = ((sent - failed) / sent) * 100;
    return { sent, failed, cost, rate };
  }, [data]);

  if (isLoading) return <div className="p-6"><SkeletonCards count={4} /></div>;
  if (error || !data || !kpis) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Analytics"
        description="Rendimiento, entregas y costos en tiempo real."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="ytd">Año en curso</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={() => toast.success("Exportando a Excel…")}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button className="gap-2" onClick={() => toast.success("Generando PDF…")}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={MessageSquare} label="SMS enviados" value={formatNumber(kpis.sent)} trend="+12.4%" up />
        <Kpi icon={Percent} label="Tasa entrega" value={`${kpis.rate.toFixed(1)}%`} trend="+0.8%" up tone="emerald" />
        <Kpi icon={AlertTriangle} label="Fallos" value={formatNumber(kpis.failed)} trend="-3.1%" up tone="amber" />
        <Kpi icon={DollarSign} label="Costo total" value={formatCurrency(kpis.cost, "MXN", "es-MX")} trend="+8.2%" tone="nova" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Entregas diarias</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.delivery.map(d => ({ date: d.x.slice(5), enviados: d.y }))}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.22 300)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.58 0.22 300)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0 / 0.3)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0 / 0.3)", fontSize: 12 }} />
                <Area type="monotone" dataKey="enviados" stroke="oklch(0.58 0.22 300)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Por operador</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byOperator} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data.byOperator.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Fallos vs. entregas</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.delivery.map((d, i) => ({ date: d.x.slice(5), enviados: d.y, fallos: data.failures[i]?.y ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0 / 0.3)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="enviados" stroke="oklch(0.58 0.22 300)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fallos" stroke="oklch(0.58 0.22 25)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Costo diario (MXN)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cost.map(d => ({ date: d.x.slice(5), costo: d.y }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0 / 0.3)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="costo" fill="oklch(0.65 0.18 250)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Distribución por país</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.byCountry.map((c) => (
            <div key={c.country} className="space-y-1">
              <div className="flex justify-between text-sm"><span className="font-medium">{c.country}</span><span className="text-muted-foreground">{c.value}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-nova to-primary" style={{ width: `${c.value}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, trend, up, tone = "primary" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; trend: string; up?: boolean; tone?: string;
}) {
  const bg = tone === "emerald" ? "bg-emerald-500/10 text-emerald-600"
    : tone === "amber" ? "bg-amber-500/10 text-amber-600"
    : tone === "nova" ? "bg-nova-soft text-nova"
    : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`rounded-lg p-2 ${bg}`}><Icon className="h-5 w-5" /></div>
          <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-600" : "text-destructive"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{trend}
          </span>
        </div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
