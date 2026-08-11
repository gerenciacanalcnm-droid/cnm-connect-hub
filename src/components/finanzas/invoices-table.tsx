import { useMemo } from "react";
import { Download, FileText } from "lucide-react";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/use-invoices";
import type { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export function InvoicesTable() {
  const { data, isLoading, error, refetch } = useInvoices();

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Factura",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2 font-mono text-sm">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.number}
          </span>
        ),
      },
      { accessorKey: "concept", header: "Concepto" },
      {
        accessorKey: "issuedAt",
        header: "Emitida",
        cell: ({ row }) => new Date(row.original.issuedAt).toLocaleDateString("es-CO"),
      },
      {
        accessorKey: "dueAt",
        header: "Vence",
        cell: ({ row }) => new Date(row.original.dueAt).toLocaleDateString("es-CO"),
      },
      {
        accessorKey: "amount",
        header: "Importe",
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`Descargando ${row.original.number}.pdf`);
            }}
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        ),
      },
    ],
    [],
  );

  if (isLoading) return <SkeletonTable rows={8} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      searchPlaceholder="Buscar por número o concepto…"
      exportFilename="facturas"
      emptyTitle="Sin facturas"
      emptyDescription="Tus facturas aparecerán aquí cuando emitamos la primera."
    />
  );
}
