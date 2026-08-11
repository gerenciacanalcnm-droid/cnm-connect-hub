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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useWallets,
  useWalletTransactions,
  useWalletMutations,
  useRechargeRequests,
} from "@/hooks/use-commercial";
import type {
  Wallet as WalletModel,
  WalletTransaction,
  WalletOperationType,
} from "@/types/commercial";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Wallet, TrendingDown, Coins, SlidersHorizontal, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet y Saldos — Super Admin" },
      {
        name: "description",
        content: "Gestión de saldo, créditos, movimientos y recargas por empresa.",
      },
      { property: "og:title", content: "Wallet y Saldos — Super Admin" },
      {
        property: "og:description",
        content: "Gestión de saldo, créditos, movimientos y recargas por empresa.",
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

const CREDIT_TYPES: { value: WalletOperationType; label: string }[] = [
  { value: "RECARGA", label: "Recarga" },
  { value: "AJUSTE_CREDITO", label: "Ajuste crédito" },
  { value: "REEMBOLSO", label: "Reembolso" },
  { value: "CORRECCION", label: "Corrección" },
];

const DEBIT_TYPES: { value: WalletOperationType; label: string }[] = [
  { value: "AJUSTE_DEBITO", label: "Ajuste débito" },
  { value: "CORRECCION", label: "Corrección" },
];

const PAYMENT_METHODS = ["transferencia", "tarjeta", "efectivo", "pasarela", "cortesia"];

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleString("es-CO") : "—");

function WalletPage() {
  const { data: wallets = [], isLoading } = useWallets();
  const { data: allTxs = [] } = useWalletTransactions();
  const { data: recharges = [] } = useRechargeRequests();
  const { operate } = useWalletMutations();

  const [managed, setManaged] = useState<WalletModel | null>(null);
  const [formMode, setFormMode] = useState<"add" | "adjust" | null>(null);
  const [type, setType] = useState<WalletOperationType>("RECARGA");
  const [amount, setAmount] = useState("0");
  const [units, setUnits] = useState("0");
  const [concept, setConcept] = useState("");
  const [method, setMethod] = useState("transferencia");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const totals = useMemo(
    () => ({
      balance: wallets.reduce((a, w) => a + w.balance, 0),
      consumed: wallets.reduce((a, w) => a + w.consumed, 0),
      credits: wallets.reduce((a, w) => a + w.credits, 0),
    }),
    [wallets],
  );

  const walletTxs = useMemo(
    () => (managed ? allTxs.filter((t) => t.walletId === managed.id) : []),
    [allTxs, managed],
  );
  const walletRecharges = useMemo(
    () => (managed ? recharges.filter((r) => r.companyId === managed.companyId) : []),
    [recharges, managed],
  );

  const resetForm = () => {
    setFormMode(null);
    setAmount("0");
    setUnits("0");
    setConcept("");
    setReference("");
    setNotes("");
    setMethod("transferencia");
  };

  const openForm = (mode: "add" | "adjust") => {
    setFormMode(mode);
    setType(mode === "add" ? "RECARGA" : "AJUSTE_DEBITO");
  };

  const submit = async () => {
    if (!managed) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value === 0) {
      toast.error("Indica un valor distinto de cero");
      return;
    }
    if (!concept.trim()) {
      toast.error("El concepto es obligatorio");
      return;
    }
    await operate.mutateAsync({
      wallet_id: managed.id,
      type,
      amount: formMode === "add" ? Math.abs(value) : value,
      units: Number(units) || 0,
      concept: concept.trim(),
      payment_method: method,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
    });
    toast.success(formMode === "add" ? "Saldo agregado" : "Saldo ajustado");
    resetForm();
  };

  const columns = useMemo<ColumnDef<WalletModel, unknown>[]>(
    () => [
      { accessorKey: "companyName", header: "Empresa" },
      {
        accessorKey: "planCode",
        header: "Plan",
        cell: (c) => <Badge variant="outline">{c.row.original.planCode ?? "sin plan"}</Badge>,
      },
      {
        accessorKey: "balance",
        header: "Saldo actual",
        cell: (c) => (
          <span className="font-medium">
            {formatCurrency(c.row.original.balance, c.row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "credits",
        header: "Créditos",
        cell: (c) => formatNumber(c.row.original.credits),
      },
      {
        accessorKey: "consumed",
        header: "Consumo",
        cell: (c) => formatCurrency(c.row.original.consumed, c.row.original.currency),
      },
      {
        accessorKey: "lastRechargeAt",
        header: "Última recarga",
        cell: (c) =>
          c.row.original.lastRechargeAt
            ? new Date(c.row.original.lastRechargeAt).toLocaleDateString("es-CO")
            : "—",
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
          <Button size="sm" variant="outline" onClick={() => setManaged(c.row.original)}>
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Gestionar saldo
          </Button>
        ),
      },
    ],
    [],
  );

  const txColumns = useMemo<ColumnDef<WalletTransaction, unknown>[]>(
    () => [
      { accessorKey: "createdAt", header: "Fecha", cell: (c) => fmtDate(c.row.original.createdAt) },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: (c) => <Badge variant="outline">{c.row.original.type}</Badge>,
      },
      {
        accessorKey: "concept",
        header: "Concepto",
        cell: (c) => c.row.original.concept ?? "—",
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: (c) => (
          <span className={c.row.original.amount < 0 ? "text-destructive" : "text-success"}>
            {formatCurrency(c.row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "balanceBefore",
        header: "Saldo anterior",
        cell: (c) =>
          c.row.original.balanceBefore == null ? "—" : formatCurrency(c.row.original.balanceBefore),
      },
      {
        accessorKey: "balanceAfter",
        header: "Saldo posterior",
        cell: (c) =>
          c.row.original.balanceAfter == null ? "—" : formatCurrency(c.row.original.balanceAfter),
      },
      {
        accessorKey: "reference",
        header: "Referencia",
        cell: (c) => c.row.original.reference ?? "—",
      },
    ],
    [],
  );

  const typeOptions = formMode === "add" ? CREDIT_TYPES : DEBIT_TYPES;

  return (
    <AdminPage
      title="Wallet y Saldos"
      description="Administra el saldo, los créditos y los movimientos financieros de cada empresa."
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
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={wallets}
              searchPlaceholder="Buscar empresa…"
              exportFilename="wallets"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes (todas las empresas)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={txColumns} data={allTxs.slice(0, 50)} />
        </CardContent>
      </Card>

      {/* Gestión de saldo por empresa */}
      <Dialog
        open={Boolean(managed)}
        onOpenChange={(o) => {
          if (!o) {
            setManaged(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestionar saldo — {managed?.companyName}</DialogTitle>
            <DialogDescription>
              Canal {managed?.channel.toUpperCase()} · Plan {managed?.planCode ?? "sin plan"}
            </DialogDescription>
          </DialogHeader>

          {managed && (
            <div className="space-y-4">
              <div className={formMode ? "hidden" : "block"}>
                <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Saldo actual</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {formatCurrency(managed.balance, managed.currency)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Créditos disponibles</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {formatNumber(managed.credits)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Consumo</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {formatCurrency(managed.consumed, managed.currency)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => openForm("add")}>
                  <Plus className="mr-1.5 h-4 w-4" /> Agregar saldo
                </Button>
                <Button variant="outline" onClick={() => openForm("adjust")}>
                  <Minus className="mr-1.5 h-4 w-4" /> Ajustar saldo
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  const tabsTrigger = document.querySelector('[value="movimientos"]') as HTMLElement;
                  tabsTrigger?.click();
                }}>
                  Ver movimientos
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  const tabsTrigger = document.querySelector('[value="recargas"]') as HTMLElement;
                  tabsTrigger?.click();
                }}>
                  Ver recargas
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  const tabsTrigger = document.querySelector('[value="consumo"]') as HTMLElement;
                  tabsTrigger?.click();
                }}>
                  Ver consumo
                </Button>
              </div>

              <Tabs defaultValue="movimientos">
                <TabsList>
                  <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
                  <TabsTrigger value="recargas">Recargas</TabsTrigger>
                  <TabsTrigger value="consumo">Consumo</TabsTrigger>
                </TabsList>
                <TabsContent value="movimientos" className="max-h-72 overflow-auto">
                  {walletTxs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Sin movimientos registrados.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border text-sm">
                      {walletTxs.map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                          <div>
                            <div className="font-medium">{t.concept ?? t.type}</div>
                            <div className="text-xs text-muted-foreground">
                              {fmtDate(t.createdAt)} · {t.type}
                              {t.reference ? ` · ref ${t.reference}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={t.amount < 0 ? "text-destructive" : "text-success"}>
                              {formatCurrency(t.amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t.balanceBefore == null ? "—" : formatCurrency(t.balanceBefore)} →{" "}
                              {t.balanceAfter == null ? "—" : formatCurrency(t.balanceAfter)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
                <TabsContent value="recargas" className="max-h-72 overflow-auto">
                  {walletRecharges.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Sin solicitudes de recarga.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border text-sm">
                      {walletRecharges.map((r) => (
                        <li key={r.id} className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-medium">
                              {formatCurrency(r.amount, r.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fmtDate(r.createdAt)} · {r.mode} · {r.gatewayCode ?? "manual"}
                              {r.receiptPath && <span className="ml-2 text-primary underline cursor-pointer">Ver comprobante</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{r.reviewStatus}</Badge>
                            {r.reviewStatus === "pendiente" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 text-success px-2" onClick={async () => {
                                  if(confirm("¿Aprobar esta recarga?")) {
                                    const { reviewRecharge } = await import("@/lib/commercial.functions");
                                    try {
                                      await reviewRecharge({ data: { id: r.id, status: "aprobada", note: "Aprobada por Super Admin" } });
                                      toast.success("Recarga aprobada");
                                    } catch (e: any) {
                                      toast.error(e.message);
                                    }
                                  }
                                }}>Aprobar</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-destructive px-2" onClick={async () => {
                                  const note = prompt("Motivo del rechazo:");
                                  if(note) {
                                    const { reviewRecharge } = await import("@/lib/commercial.functions");
                                    try {
                                      await reviewRecharge({ data: { id: r.id, status: "rechazada", note } });
                                      toast.success("Recarga rechazada");
                                    } catch (e: any) {
                                      toast.error(e.message);
                                    }
                                  }
                                }}>Rechazar</Button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
                <TabsContent value="consumo">
                  <div className="grid gap-3 py-3 sm:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground">Consumo acumulado</div>
                        <div className="mt-1 text-xl font-semibold">
                          {formatCurrency(managed.consumed, managed.currency)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground">Última actualización</div>
                        <div className="mt-1 text-xl font-semibold">
                          {fmtDate(managed.updatedAt)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}


          {managed && formMode === "add" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Monto a acreditar"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Créditos (opcional)</Label>
                  <Input type="number" value={units} onChange={(e) => setUnits(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo de operación</Label>
                  <Select value={type} onValueChange={(v) => setType(v as WalletOperationType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDIT_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Método de pago</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Concepto</Label>
                <Input
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  maxLength={200}
                  placeholder="Ej. Recarga corporativa agosto"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Referencia</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={120}
                  placeholder="Comprobante, factura o transacción"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo actual {formatCurrency(managed.balance, managed.currency)} + {amount || 0} ={" "}
                {formatCurrency(managed.balance + (Number(amount) || 0), managed.currency)}
              </p>
            </div>
          )}

          {managed && formMode === "adjust" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor a descontar</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Monto a debitar"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Referencia</Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ref. del ajuste"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo / Concepto</Label>
                <Input
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej. Corrección por error en envío"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo actual {formatCurrency(managed.balance, managed.currency)} - {amount || 0} ={" "}
                {formatCurrency(managed.balance - (Number(amount) || 0), managed.currency)}
              </p>
            </div>
          )}

          <DialogFooter>
            {formMode ? (
              <>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={submit} disabled={operate.isPending}>
                  Confirmar operación
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setManaged(null)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
