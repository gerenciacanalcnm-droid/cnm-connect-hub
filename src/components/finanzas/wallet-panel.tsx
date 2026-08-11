import { useMemo, useState } from "react";
import { Wallet, Coins, TrendingDown, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useRechargeRequests,
  useCreateRecharge,
} from "@/hooks/use-commercial";
import { useCurrentCompany } from "@/context/company-context";
import { formatCurrency, formatNumber } from "@/lib/format";
import { toast } from "sonner";

const METHODS = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "tarjeta", label: "Tarjeta de crédito/débito" },
  { value: "pse", label: "PSE" },
];

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString("es-CO") : "—");

export function WalletPanel() {
  const company = useCurrentCompany();
  const { data: wallets = [] } = useWallets();
  const { data: txs = [] } = useWalletTransactions();
  const { data: recharges = [] } = useRechargeRequests();
  const createRecharge = useCreateRecharge();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("100000");
  const [method, setMethod] = useState("transferencia");
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "email" | "ia">("sms");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");


  const wallet = useMemo(
    () => wallets.find((w) => w.companyId === company.id) ?? wallets[0],
    [wallets, company.id],
  );

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    await createRecharge.mutateAsync({
      company_id: company.id,
      amount: value,
      channel: channel,
      payment_method: method,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
    });
    toast.success("Solicitud de recarga enviada. Queda pendiente de aprobación.");
    setOpen(false);
    setReference("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-nova/95 to-primary text-primary-foreground">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
              <Wallet className="h-4 w-4" /> Saldo actual
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {wallet ? formatCurrency(wallet.balance, wallet.currency) : "—"}
            </div>
            <div className="mt-1 text-sm opacity-90">
              Última recarga {wallet ? fmt(wallet.lastRechargeAt) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Coins className="h-4 w-4" /> Créditos disponibles
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {wallet ? formatNumber(wallet.credits) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <TrendingDown className="h-4 w-4" /> Consumo
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {wallet ? formatCurrency(wallet.consumed, wallet.currency) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Recargar saldo
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mis recargas</CardTitle>
          </CardHeader>
          <CardContent>
            {recharges.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no has solicitado recargas.
              </p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {recharges.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium">{formatCurrency(r.amount, r.currency)}</div>
                      <div className="text-xs text-muted-foreground">{fmt(r.createdAt)}</div>
                    </div>
                    <Badge variant="outline">{r.reviewStatus}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin movimientos registrados.
              </p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {txs.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium">{t.concept ?? t.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmt(t.createdAt)} · {t.type}
                      </div>
                    </div>
                    <span className={t.amount < 0 ? "text-destructive" : "text-success"}>
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recargar saldo</DialogTitle>
            <DialogDescription>
              La recarga queda pendiente hasta que se confirme el pago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Servicio a recargar</Label>
              <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="ia">IA (Nova)</SelectItem>
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
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Referencia (opcional)</Label>
              <Input
                value={reference}
                maxLength={120}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Textarea value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={createRecharge.isPending}>
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
