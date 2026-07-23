import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmsComposer } from "./sms-composer";
import { toast } from "sonner";

export function SendSms() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("CNM");
  const [msg, setMsg] = useState("Hola {{nombre}}, tu código es {{codigo}}.");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!to.trim() || !msg.trim()) return toast.error("Completa destinatario y mensaje");
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    toast.success(`SMS enviado a ${to}`);
    setTo("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Remitente</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNM">CNM</SelectItem>
                  <SelectItem value="CNMBank">CNMBank</SelectItem>
                  <SelectItem value="CNMShop">CNMShop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destinatario</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+52 55 1234 5678" />
            </div>
          </div>
          <SmsComposer value={msg} onChange={setMsg} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline">Guardar borrador</Button>
            <Button onClick={send} disabled={sending} className="gap-2">
              <Send className="h-4 w-4" />
              {sending ? "Enviando…" : "Enviar SMS"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-nova-soft/50 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-nova" />
            Vista previa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">{from}</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {msg || "Tu mensaje aparecerá aquí…"}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Usa <code className="rounded bg-muted px-1">{`{{nombre}}`}</code> para variables dinámicas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
