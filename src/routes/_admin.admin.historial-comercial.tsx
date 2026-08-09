import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommercialHistory } from "@/hooks/use-commercial";
import type { CommercialHistoryEntry } from "@/types/commercial";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/historial-comercial")({
  head: () => ({
    meta: [
      { title: "Historial Comercial — Super Admin" },
      {
        name: "description",
        content: "Trazabilidad de planes, recargas, promociones y movimientos comerciales.",
      },
      { property: "og:title", content: "Historial Comercial — Super Admin" },
      {
        property: "og:description",
        content: "Trazabilidad de planes, recargas, promociones y movimientos comerciales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistorialComercialPage,
});

function HistorialComercialPage() {
  const { data: entries = [], isLoading } = useCommercialHistory();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) =>
      [e.eventType, e.entityType, e.companyName, e.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [entries, q]);

  const columns = useMemo<ColumnDef<CommercialHistoryEntry, unknown>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: (c) => new Date(String(c.getValue())).toLocaleString("es-CO"),
      },
      {
        accessorKey: "eventType",
        header: "Evento",
        cell: (c) => <Badge variant="outline">{String(c.getValue())}</Badge>,
      },
      {
        accessorKey: "entityType",
        header: "Entidad",
        cell: (c) => String(c.getValue() ?? "—"),
      },
      {
        accessorKey: "companyName",
        header: "Empresa",
        cell: (c) => String(c.getValue() ?? "—"),
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: (c) =>
          c.getValue() == null
            ? "—"
            : formatCurrency(Number(c.getValue()), c.row.original.currency),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: (c) => (
          <span className="text-muted-foreground">{String(c.getValue() ?? "—")}</span>
        ),
      },
    ],
    [],
  );

  return (
    <AdminPage
      title="Historial Comercial"
      description="Auditoría de todos los eventos del Motor Comercial."
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Eventos</CardTitle>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar evento, empresa…"
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} />
          )}
        </CardContent>
      </Card>
    </AdminPage>
  );
}
