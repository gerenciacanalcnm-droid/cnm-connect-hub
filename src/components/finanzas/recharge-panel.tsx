import { useMemo, useState } from "react";
import { Sparkles, CreditCard, Landmark, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber } from "@/lib/format";
import { toast } from "sonner";
import type { RechargePackage } from "@/types/recharge";


export function RechargePanel() {
  const [selected, setSelected] = useState<RechargePackage | null>(null);
  const [method, setMethod] = useState("card");

  const packages: RechargePackage[] = [
    { id: "p1", name: "Básico", smsCredits: 1000, price: 50000, currency: "COP", popular: false },
    {
      id: "p2",
      name: "Profesional",
      smsCredits: 5000,
      price: 200000,
      currency: "COP",
      popular: true,
      bonus: 500,
    },
    {
      id: "p3",
      name: "Empresarial",
      smsCredits: 20000,
      price: 700000,
      currency: "COP",
      popular: false,
      bonus: 3000,
    },
    {
      id: "p4",
      name: "Master",
      smsCredits: 100000,
      price: 3000000,
      currency: "COP",
      popular: false,
      bonus: 20000,
    },
  ];


  const packs = packages ?? [];

  return (
    <div className="space-y-6">
      <Alert variant="destructive" className="border-warning/50 bg-warning/5 text-warning-foreground">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Módulo en transición</AlertTitle>
        <AlertDescription>
          Estamos migrando este panel al nuevo motor de Wallet. Por favor, realiza tus recargas
          desde la pestaña <strong>Wallet</strong> para asegurar que tu saldo se acredite
          correctamente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-nova/95 to-primary text-primary-foreground opacity-80">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
              <Wallet className="h-4 w-4" /> Saldo (Histórico)
            </div>
            <div className="mt-3 text-3xl font-semibold">{formatCurrency(0, "COP")}</div>
            <div className="mt-1 text-sm opacity-90">0 SMS disponibles</div>
          </CardContent>
        </Card>
        <Card className="opacity-80">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Consumo mes
            </div>
            <div className="mt-3 text-3xl font-semibold">{formatCurrency(0, "COP")}</div>
            <div className="mt-1 text-sm text-muted-foreground">0 SMS enviados</div>
          </CardContent>
        </Card>
        <Card className="opacity-80">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Proyección</div>
            <div className="mt-3 text-3xl font-semibold">{formatCurrency(0, "COP")}</div>
            <div className="mt-1 text-sm text-muted-foreground">estimado fin de mes</div>
          </CardContent>
        </Card>
      </div>


      <div>
        <h2 className="mb-3 text-lg font-semibold">Paquetes de recarga</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {packs.map((p) => (
            <Card
              key={p.id}
              className={`relative flex flex-col transition hover:shadow-md ${p.popular ? "border-nova ring-2 ring-nova/30" : ""}`}
            >
              {p.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-nova text-white">
                  <Sparkles className="mr-1 h-3 w-3" /> Más popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-3">
                <div>
                  <div className="text-3xl font-semibold">
                    {formatCurrency(p.price, p.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(p.smsCredits)} SMS
                  </div>
                </div>
                {p.bonus ? (
                  <div className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    + {formatNumber(p.bonus)} SMS de bonificación
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Sin bonificación</div>
                )}
                <div className="flex-1" />
                <Button className="w-full" onClick={() => setSelected(p)}>
                  Comprar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar recarga · {selected?.name}</DialogTitle>
            <DialogDescription>
              {selected &&
                `${formatNumber(selected.smsCredits + (selected.bonus ?? 0))} SMS por ${formatCurrency(selected.price, selected.currency)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Método de pago</Label>
            <RadioGroup value={method} onValueChange={setMethod} className="space-y-2">
              {[
                { v: "card", i: CreditCard, l: "Tarjeta de crédito/débito" },
                { v: "transfer", i: Landmark, l: "Transferencia bancaria (SPEI)" },
                { v: "paypal", i: Wallet, l: "PayPal" },
              ].map((m) => (
                <label
                  key={m.v}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                >
                  <RadioGroupItem value={m.v} id={m.v} />
                  <m.i className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{m.l}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success(`Recarga procesada · ${selected?.name}`);
                setSelected(null);
              }}
            >
              Pagar ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
