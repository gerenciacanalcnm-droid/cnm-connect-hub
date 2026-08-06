import { CreditCard, Landmark, Plus, Wallet, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const METHODS = [
  { id: "1", type: "card", brand: "Visa", last4: "4242", exp: "08/28", primary: true },
  { id: "2", type: "card", brand: "Mastercard", last4: "8210", exp: "11/26", primary: false },
  { id: "3", type: "transfer", brand: "SPEI · BBVA", last4: "0031", exp: "", primary: false },
];

export function PaymentMethods() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button className="gap-2" onClick={() => toast.info("Añadir método próximamente")}>
          <Plus className="h-4 w-4" /> Añadir método
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {METHODS.map((m) => {
          const Icon = m.type === "card" ? CreditCard : m.type === "transfer" ? Landmark : Wallet;
          return (
            <Card
              key={m.id}
              className={m.primary ? "border-primary/50 ring-2 ring-primary/20" : ""}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{m.brand}</div>
                      <div className="font-mono text-xs text-muted-foreground">•••• {m.last4}</div>
                    </div>
                  </div>
                  {m.primary && (
                    <Badge className="gap-1">
                      <Star className="h-3 w-3" /> Principal
                    </Badge>
                  )}
                </div>
                {m.exp && <div className="text-xs text-muted-foreground">Vence {m.exp}</div>}
                <div className="flex gap-2 border-t border-border pt-3">
                  {!m.primary && (
                    <Button size="sm" variant="outline">
                      Marcar principal
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive">
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
