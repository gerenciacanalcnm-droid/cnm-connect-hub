import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { companyName, id, daysAgo, int } from "@/services/mocks/seed";

type Recharge = { id: string; company: string; amount: number; method: string; status: "pending" | "paid" | "rejected"; receipt: string; createdAt: string };

const seed = Array.from({ length: 30 }, (_, i) => ({
  id: id("rc"),
  company: companyName(),
  amount: int(50_000, 5_000_000),
  method: ["Transferencia", "PSE", "Stripe", "PayPal"][i % 4]!,
  status: (["pending", "pending", "paid", "paid", "rejected"] as const)[i % 5]!,
  receipt: `comprobante-${i}.pdf`,
  createdAt: daysAgo(i),
})) as Recharge[];

export const Route = createFileRoute("/_admin/admin/recargas")({
  head: () => ({ meta: [{ title: "Recargas — Super Admin" }] }),
  component: RecargasPage,
});

function RecargasPage() {
  const [data, setData] = useState<Recharge[]>(seed);
  const [tab, setTab] = useState("all");
  const filtered = useMemo(() => tab === "all" ? data : data.filter((x) => x.status === tab), [data, tab]);
  const columns = useMemo<ColumnDef<Recharge, unknown>[]>(() => [
    { accessorKey: "company", header: "Empresa" },
    { accessorKey: "amount", header: "Monto", cell: (c) => formatCurrency(c.row.original.amount) },
    { accessorKey: "method", header: "Método" },
    { accessorKey: "createdAt", header: "Fecha" },
    { accessorKey: "receipt", header: "Comprobante", cell: (c) => <Button variant="ghost" size="sm" className="h-7"><FileText className="mr-1 h-3.5 w-3.5" />{c.row.original.receipt}</Button> },
    { accessorKey: "status", header: "Estado", cell: (c) => <StatusBadge status={c.row.original.status === "paid" ? "paid" : c.row.original.status === "pending" ? "pending" : "rejected"} /> },
    { id: "actions", header: "", cell: ({ row }) => row.original.status === "pending" ? (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setData((d) => d.map((x) => x.id === row.original.id ? { ...x, status: "paid" } : x)); toast.success("Recarga aprobada"); }}><Check className="h-4 w-4 text-emerald-600" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { setData((d) => d.map((x) => x.id === row.original.id ? { ...x, status: "rejected" } : x)); toast.error("Recarga rechazada"); }}><X className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) : null },
  ], []);

  return (
    <AdminPage title="Recargas" description="Solicitudes de recarga con aprobación manual.">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Todas ({data.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({data.filter((x) => x.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="paid">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <DataTable data={filtered} columns={columns} searchPlaceholder="Buscar empresa…" exportFilename="recargas" />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
