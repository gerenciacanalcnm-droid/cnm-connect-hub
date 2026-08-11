import { useMemo } from "react";
import { CreditCard, Landmark, Wallet, ArrowDownRight } from "lucide-react";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { useRecharges } from "@/hooks/use-recharges";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Recharge } from "@/types/recharge";

const METHOD_ICON = { card: CreditCard, transfer: Landmark, paypal: Wallet };
const METHOD_LABEL = { card: "Tarjeta", transfer: "Transferencia", paypal: "PayPal" };

export function RechargeHistory() {
  const { data, isLoading, error, refetch } = useRecharges();

  const columns = useMemo<ColumnDef<Recharge>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString("es-CO"),

      },
      {
        accessorKey: "reference",
        header: "Referencia",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.reference}</span>,
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "smsCredits",
        header: "SMS",
        cell: ({ row }) => formatNumber(row.original.smsCredits),
      },
      {
        accessorKey: "method",
        header: "Método",
        cell: ({ row }) => {
          const Icon = METHOD_ICON[row.original.method];
          return (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {METHOD_LABEL[row.original.method]}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status === "completed" ? "completed" : row.original.status}
          />
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
      searchPlaceholder="Buscar por referencia…"
      exportFilename="historial-recargas"
      emptyTitle="Aún no hay recargas"
      emptyDescription="Compra tu primer paquete para empezar a enviar SMS."
    />
  );
}
