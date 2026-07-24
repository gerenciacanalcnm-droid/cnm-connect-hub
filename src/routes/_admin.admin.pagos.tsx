import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminPaymentMethods } from "@/hooks/use-admin-settings";
import type { PaymentMethod } from "@/services/admin-settings.service";
import { CreditCard, Wallet, Landmark, Banknote, Settings } from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<PaymentMethod["provider"], typeof CreditCard> = {
  paypal: Wallet,
  stripe: CreditCard,
  transferencia: Landmark,
  pse: Banknote,
};

export const Route = createFileRoute("/_admin/admin/pagos")({
  head: () => ({ meta: [{ title: "Métodos de Pago — Super Admin" }] }),
  component: PagosPage,
});

function PagosPage() {
  const initial = useAdminPaymentMethods();
  const [methods, setMethods] = useState<PaymentMethod[]>(initial);
  return (
    <AdminPage title="Métodos de Pago" description="Habilita, prueba y configura pasarelas.">
      <div className="grid gap-4 md:grid-cols-2">
        {methods.map((m) => {
          const Icon = ICONS[m.provider];
          return (
            <Card key={m.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <div>
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <CardDescription className="mt-0.5 capitalize">{m.provider}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.test && <Badge variant="outline" className="border-amber-500/30 text-amber-600">Test</Badge>}
                  <Switch checked={m.enabled} onCheckedChange={(v) => { setMethods((ms) => ms.map((x) => x.id === m.id ? { ...x, enabled: v } : x)); toast.success(v ? `${m.name} activado` : `${m.name} desactivado`); }} />
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full"><Settings className="mr-1.5 h-4 w-4" />Configurar credenciales</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminPage>
  );
}
