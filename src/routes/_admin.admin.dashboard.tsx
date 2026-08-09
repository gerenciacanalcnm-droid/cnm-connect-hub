import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { KpiCard } from "@/components/common/kpi-card";
import { ChartCard } from "@/components/common/chart-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  DollarSign,
  Wallet,
  Package,
  RefreshCw,
  Coins,
  TrendingDown,
  Tag,
  Activity,
  Inbox,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  useCommercialHistory,
  useCommercialPlans,
  useCommercialPromotions,
  useRechargeRequests,
  useWallets,
  useWalletTransactions,
} from "@/hooks/use-commercial";
import { useUsers } from "@/hooks/use-users";
import { formatCurrency, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Super Dashboard — SMS CNM Admin" },
      { name: "description", content: "Centro de control ejecutivo de SMS CNM." },
      { property: "og:title", content: "Super Dashboard — SMS CNM Admin" },
      { property: "og:description", content: "Centro de control ejecutivo de SMS CNM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuperDashboard,
});

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function SuperDashboard() {
  const wallets = useWallets();
  const txs = useWalletTransactions();
  const recharges = useRechargeRequests();
  const plans = useCommercialPlans();
  const promotions = useCommercialPromotions();
  const history = useCommercialHistory();
  const users = useUsers();

  const refetchAll = () => {
    void wallets.refetch();
    void txs.refetch();
    void recharges.refetch();
    void history.refetch();
  };

  const walletRows = wallets.data ?? [];
  const rechargeRows = recharges.data ?? [];
  const txRows = txs.data ?? [];
  const historyRows = history.data ?? [];

  const companies = useMemo(
    () => new Set(walletRows.map((w) => w.companyId)).size,
    [walletRows],
  );
  const totals = useMemo(
    () => ({
      balance: walletRows.reduce((a, w) => a + w.balance, 0),
      consumed: walletRows.reduce((a, w) => a + w.consumed, 0),
      credits: walletRows.reduce((a, w) => a + w.credits, 0),
    }),
    [walletRows],
  );

  const approved = rechargeRows.filter((r) => r.reviewStatus === "aprobada");
  const pending = rechargeRows.filter((r) => r.reviewStatus === "pendiente");
  const revenue = approved.reduce((a, r) => a + r.amount, 0);

  const monthly = useMemo(() => {
    const base = MONTHS.map((month) => ({ month, ingresos: 0, recargas: 0 }));
    for (const r of approved) {
      const d = new Date(r.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const slot = base[d.getMonth()];
      if (slot) {
        slot.ingresos += r.amount;
        slot.recargas += 1;
      }
    }
    return base;
  }, [approved]);

  const hasRevenue = monthly.some((m) => m.ingresos > 0);
  const activePlans = (plans.data ?? []).filter((p) => p.isActive);
  const activePromos = (promotions.data ?? []).filter((p) => p.status === "active");

  return (
    <AdminPage
      title="Dashboard Ejecutivo"
      description="Métricas comerciales reales del Motor Comercial."
      actions={
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Actualizar
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Empresas con wallet" value={formatNumber(companies)} icon={Building2} />
        <KpiCard label="Usuarios" value={formatNumber(users.data?.length ?? 0)} icon={Users} />
        <KpiCard
          label="Ingresos aprobados"
          value={formatCurrency(revenue)}
          icon={DollarSign}
          tone="success"
        />
        <KpiCard label="Saldo disponible" value={formatCurrency(totals.balance)} icon={Wallet} />
        <KpiCard
          label="Consumo total"
          value={formatCurrency(totals.consumed)}
          icon={TrendingDown}
        />
        <KpiCard label="Créditos" value={formatNumber(totals.credits)} icon={Coins} />
        <KpiCard label="Recargas aprobadas" value={formatNumber(approved.length)} icon={Package} />
        <KpiCard
          label="Recargas pendientes"
          value={formatNumber(pending.length)}
          icon={Inbox}
          tone={pending.length ? "warning" : "primary"}
        />
        <KpiCard label="Planes activos" value={formatNumber(activePlans.length)} icon={Package} />
        <KpiCard label="Promociones activas" value={formatNumber(activePromos.length)} icon={Tag} />
        <KpiCard label="Movimientos wallet" value={formatNumber(txRows.length)} icon={Activity} />
        <KpiCard
          label="Eventos comerciales"
          value={formatNumber(historyRows.length)}
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ingresos por mes" description="Recargas aprobadas del año en curso">
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={DollarSign}
              title="Sin ingresos registrados"
              description="Cuando se aprueben recargas verás aquí la evolución mensual."
            />
          )}
        </ChartCard>

        <ChartCard title="Recargas pendientes" description="Requieren revisión del administrador">
          {pending.length ? (
            <ul className="space-y-3 text-sm">
              {pending.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{r.companyName}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{r.channel.toUpperCase()}</Badge>
                    <span className="font-medium">{formatCurrency(r.amount, r.currency)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Todo al día"
              description="No hay recargas pendientes de aprobación."
            />
          )}
        </ChartCard>
      </div>

      <ChartCard title="Actividad comercial" description="Últimos eventos registrados">
        {historyRows.length ? (
          <ul className="space-y-3 text-sm">
            {historyRows.slice(0, 10).map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  <Badge variant="outline" className="mr-2">
                    {h.eventType}
                  </Badge>
                  {h.description ?? h.companyName ?? "—"}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(h.createdAt).toLocaleDateString("es-CO")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Activity}
            title="Sin actividad"
            description="Los eventos del Motor Comercial aparecerán aquí."
          />
        )}
      </ChartCard>
    </AdminPage>
  );
}
