import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaymentGateways, useGatewayMutations } from "@/hooks/use-commercial";
import type { PaymentGateway } from "@/types/commercial";
import { CreditCard, Wallet, Landmark, Banknote, Settings, Plug } from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<string, typeof CreditCard> = {
  paypal: Wallet,
  stripe: CreditCard,
  transferencia: Landmark,
  bancolombia: Landmark,
  pse: Banknote,
  wompi: Plug,
  nequi: Wallet,
};

const CONFIG_FIELDS: Record<string, string[]> = {
  default: ["public_key", "private_key", "webhook_secret"],
  transferencia: ["bank_name", "account_number", "account_holder"],
};

export const Route = createFileRoute("/_admin/admin/pagos")({
  head: () => ({ meta: [{ title: "Métodos de Pago — Super Admin" }] }),
  component: PagosPage,
});

function PagosPage() {
  const { data: gateways = [], isLoading } = usePaymentGateways();
  const { update, test } = useGatewayMutations();
  const [editing, setEditing] = useState<PaymentGateway | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});

  const openConfig = (g: PaymentGateway) => {
    const fields = CONFIG_FIELDS[g.code] ?? CONFIG_FIELDS.default;
    const next: Record<string, string> = {};
    for (const f of fields) next[f] = String((g.config as Record<string, unknown>)[f] ?? "");
    setConfig(next);
    setEditing(g);
  };

  const saveConfig = async () => {
    if (!editing) return;
    await update.mutateAsync({ id: editing.id, config, status: "configured" });
    toast.success("Credenciales guardadas");
    setEditing(null);
  };

  return (
    <AdminPage title="Métodos de Pago" description="Habilita, prueba y configura pasarelas.">
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gateways.map((g) => {
            const Icon = ICONS[g.code] ?? CreditCard;
            return (
              <Card key={g.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{g.name}</CardTitle>
                      <CardDescription className="mt-0.5">{g.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.mode === "sandbox" && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                        Sandbox
                      </Badge>
                    )}
                    <Switch
                      checked={g.isEnabled}
                      onCheckedChange={async (v) => {
                        await update.mutateAsync({ id: g.id, is_enabled: v });
                        toast.success(v ? `${g.name} activado` : `${g.name} desactivado`);
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Modo</span>
                    <Select
                      value={g.mode}
                      onValueChange={(v) =>
                        update.mutate({ id: g.id, mode: v as PaymentGateway["mode"] })
                      }
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="live">Producción</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {g.lastTestMessage && (
                    <p
                      className={`text-xs ${g.lastTestOk ? "text-success" : "text-muted-foreground"}`}
                    >
                      {g.lastTestMessage}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openConfig(g)}
                    >
                      <Settings className="mr-1.5 h-4 w-4" />
                      Configurar credenciales
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={test.isPending}
                      onClick={async () => {
                        const res = await test.mutateAsync(g.id);
                        if (res.ok) toast.success(res.message);
                        else toast.error(res.message);
                      }}
                    >
                      Probar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credenciales — {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {Object.keys(config).map((f) => (
              <div key={f} className="grid gap-1.5">
                <Label className="capitalize">{f.replace(/_/g, " ")}</Label>
                <Input
                  value={config[f]}
                  type={f.includes("secret") || f.includes("private") ? "password" : "text"}
                  onChange={(e) => setConfig((c) => ({ ...c, [f]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveConfig} disabled={update.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
