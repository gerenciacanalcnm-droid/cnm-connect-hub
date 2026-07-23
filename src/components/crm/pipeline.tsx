import { useMemo } from "react";
import { useCrmDeals } from "@/hooks/use-crm";
import { SkeletonCards } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Deal, DealStage } from "@/types/crm";
import { formatCurrency } from "@/lib/format";

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "lead", label: "Prospecto", color: "border-t-slate-400" },
  { id: "qualified", label: "Calificado", color: "border-t-blue-500" },
  { id: "proposal", label: "Propuesta", color: "border-t-indigo-500" },
  { id: "negotiation", label: "Negociación", color: "border-t-amber-500" },
  { id: "won", label: "Ganado", color: "border-t-emerald-500" },
  { id: "lost", label: "Perdido", color: "border-t-rose-500" },
];

export function Pipeline() {
  const { data, isLoading, error, refetch } = useCrmDeals();

  const grouped = useMemo(() => {
    const g: Record<DealStage, Deal[]> = { lead: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [] };
    for (const d of data ?? []) g[d.stage].push(d);
    return g;
  }, [data]);

  if (isLoading) return <SkeletonCards count={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1100px] grid-cols-6 gap-3">
        {STAGES.map((s) => {
          const deals = grouped[s.id];
          const total = deals.reduce((sum, d) => sum + d.amount, 0);
          return (
            <div key={s.id} className={`flex flex-col gap-2 rounded-xl border border-t-4 border-border bg-surface/30 p-3 ${s.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{deals.length} deals</div>
                </div>
                <div className="text-xs font-medium text-foreground">{formatCurrency(total, "MXN", "es-MX")}</div>
              </div>
              <div className="flex flex-col gap-2">
                {deals.slice(0, 8).map((d) => (
                  <Card key={d.id} className="cursor-pointer p-3 transition hover:shadow-md">
                    <div className="line-clamp-1 text-sm font-medium">{d.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">{d.companyName}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">{formatCurrency(d.amount, d.currency, "es-MX")}</div>
                      <Badge variant="outline" className="text-[10px]">{d.probability}%</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]">{d.ownerName.split(" ").map(x => x[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                      <span className="truncate">{d.ownerName}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
