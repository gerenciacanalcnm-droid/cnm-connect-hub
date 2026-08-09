import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { KpiCard } from "@/components/common/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallets, useWalletTransactions, useWalletMutations } from "@/hooks/use-commercial";
import type { Wallet as WalletModel, WalletTransaction } from "@/types/commercial";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Wallet, TrendingDown, Coins, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet y Saldos — Super Admin" },
      {
        name: "description",
        content: "Control de saldos, créditos y movimientos por empresa y canal.",
      },
      { property: "og:title", content: "Wallet y Saldos — Super Admin" },
      {
        property: "og:description",
        content: "Control de saldos, créditos y movimientos por empresa y canal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletPage,
});

const STATUS_TONE: Record<WalletModel["status"], string> = {
  active: "border-success/40 text-success",
  inactive: "border-border text-muted-foreground",
  suspended: "border-destructive/30 text-destructive",
};

function WalletPage() {
  const { data: wallets = [], isLoading } = useWallets();
  const { data: txs = [] } = useWalletTransactions();
  const { adjust } = useWalletMutations();

  const [target, setTarget] = useState<WalletModel | null>(null);
  const [amount, setAmount] = useState("0");
  const [units, setUnits] = useState("0");
  const [type, setType] = useState("adjustment");
  const [description, setDescription] = useState("");

  const totals = useMemo(
    () => ({
      balance: wallets.reduce((a, w) => a + w.balance, 0),
      consumed: wallets.reduce((a, w) => a + w.consumed, 0),
      credits: wallets.reduce((a, w) => a + w.credits, 0),
    }),
    [wallets],
  );

  const submit = async () => {
    if (!target) return;
    await adjust.mutateAsync({
      wallet_id: target.id,
      amount: Number(amount) || 0,
      units: Number(units) || 0,
      type,
      description,
    });
    toast.success("Saldo ajustado correctamente");
    setTarget(null);
    setAmount("0");
    setUnits("0");
    setDescription("");
    setType("adjustment");
  };

  const columns = useMemo<ColumnDef<WalletModel, unknown>[]>(
    () => [
      { accessorKey: "companyName", header: "Empresa" },
      {
        accessorKey: "channel",
        header: "Canal",
        cell: (c) => <Badge variant="outline">{String(c.getValue()).toUpperCase()}</Badge>,
      },
      {
        accessorKey: "balance",
        header: "Saldo",
        cell: (c) => (
          <span className="font-medium">
            {formatCurrency(Number(c.getValue()), c.row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "consumed",
        header: "Consumido",
        cell: (c) => formatCurrency(Number(c.getValue()), c.row.original.currency),
      },
      {
        accessorKey: "credits",
        header: "Créditos",
        cell: (c) => formatNumber(Number(c.getValue())),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: (c) => (
          <Badge variant="outline" className={STATUS_TONE[c.row.original.status]}>
            {c.row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (c) => (
          <Button size="sm" variant="outline" onClick={() => setTarget(c.row.original)}>
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Ajustar
          </Button>
        ),
      },
    ],
    [],
  );

  const txColumns = useMemo<ColumnDef<WalletTransaction, unknown>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: (c) => new Date(String(c.getValue())).toLocaleString("es-CO"),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: (c) => <Badge variant="outline">{String(c.getValue())}</Badge>,
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: (c) => formatCurrency(Number(c.getValue())),
      },
      { accessorKey: "units", header: "Unidades" },
      {
        accessorKey: "balanceAfter",
        header: "Saldo posterior",
        cell: (c) => (c.getValue() == null ? "—" : formatCurrency(Number(c.getValue()))),
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
      title="Wallet y Saldos"
      description="Saldo disponible, consumo y movimientos por empresa y canal."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Saldo total" value={formatCurrency(totals.balance)} icon={Wallet} />
        <KpiCard
          label="Consumo total"
          value={formatCurrency(totals.consumed)}
          icon={TrendingDown}
        />
        <KpiCard label="Créditos" value={formatNumber(totals.credits)} icon={Coins} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billeteras por empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={wallets} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={txColumns} data={txs} />
        </CardContent>
      </Card>

      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar saldo — {target?.companyName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Positivo acredita, negativo debita"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidades / créditos</Label>
                <Input type="number" value={units} onChange={(e) => setUnits(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                  <SelectItem value="bonus">Bono</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={adjust.isPending}>
              Aplicar ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
