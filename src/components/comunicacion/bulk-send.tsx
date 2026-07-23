import { useMemo, useState } from "react";
import { Users, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmsComposer } from "./sms-composer";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";

const AUDIENCES = [
  { id: "all", name: "Toda la base", size: 12480 },
  { id: "vip", name: "Clientes VIP", size: 1204 },
  { id: "inactive", name: "Inactivos 90 días", size: 3210 },
  { id: "cart", name: "Carrito abandonado", size: 812 },
];

export function BulkSend() {
  const [audience, setAudience] = useState("all");
  const [msg, setMsg] = useState("");
  const [numbers, setNumbers] = useState("");
  const size = AUDIENCES.find((a) => a.id === audience)?.size ?? 0;
  const extra = useMemo(
    () => numbers.split(/[\s,;\n]+/).filter((n) => n.trim().length > 6).length,
    [numbers],
  );
  const total = size + extra;
  const cost = total * 0.19;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle>Envío masivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Audiencia</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {formatNumber(a.size)} contactos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Números adicionales (opcional)</Label>
            <Textarea
              rows={3}
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              placeholder="+52551..., +52552..."
              className="font-mono text-sm"
            />
          </div>
          <SmsComposer value={msg} onChange={setMsg} rows={6} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            Resumen del envío
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Audiencia" value={formatNumber(size)} />
          <Row label="Adicionales" value={formatNumber(extra)} />
          <div className="border-t border-border pt-3">
            <Row label="Total destinatarios" value={formatNumber(total)} strong />
            <Row label="Costo estimado" value={`$ ${cost.toFixed(2)} MXN`} strong />
          </div>
          <Button
            className="mt-2 w-full gap-2"
            onClick={() => toast.success(`Envío programado a ${formatNumber(total)} destinatarios`)}
          >
            <Send className="h-4 w-4" /> Enviar ahora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
