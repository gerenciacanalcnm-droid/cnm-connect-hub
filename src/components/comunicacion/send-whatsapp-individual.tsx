import { useState, useMemo } from "react";
import { MessageCircle, Send, AlertCircle, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useWallets, useRateTiers } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { useWhatsAppAccounts, useSendWhatsAppIndividual } from "@/hooks/use-whatsapp";

export function SendWhatsAppIndividual() {
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  
  const { data: walletsData } = useWallets();
  const { data: tiersData } = useRateTiers();
  const { data: accounts = [] } = useWhatsAppAccounts();
  const sendMutation = useSendWhatsAppIndividual();

  const wallet = walletsData?.find(w => w.channel === 'whatsapp');
  const balance = wallet?.balance ?? 0;
  
  const connectedAccount = accounts.find(a => a.status === 'connected');

  const isValidPhone = useMemo(() => {
    return /^3\d{9}$/.test(to.trim());
  }, [to]);

  const whatsappTier = useMemo(() => {
    // Buscamos la tarifa de WhatsApp (tier 1 unidad)
    return tiersData?.find(t => t.channel === 'whatsapp' && t.is_active);
  }, [tiersData]);

  const cost = whatsappTier?.unitPrice ?? 0;
  const balanceAfter = balance - cost;
  const isInsufficient = balance < cost;

  const handleSend = async () => {
    if (!connectedAccount) {
      return toast.error("No hay una cuenta de WhatsApp conectada. Ve a Ajustes.");
    }
    if (!isValidPhone) {
      return toast.error("Número de destino inválido (formato: 3001234567)");
    }
    if (!msg.trim()) {
      return toast.error("El mensaje no puede estar vacío");
    }
    if (isInsufficient) {
      return toast.error("Saldo insuficiente");
    }

    try {
      await sendMutation.mutateAsync({
        recipient: to.trim(),
        body: msg.trim(),
        accountId: connectedAccount.id
      });
      toast.success("WhatsApp enviado correctamente");
      setTo("");
      setMsg("");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar WhatsApp");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              Nuevo Mensaje de WhatsApp
            </CardTitle>
            <CardDescription>
              Envía un mensaje individual utilizando la Meta Cloud API oficial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!connectedAccount && (
              <Alert variant="destructive" className="bg-destructive/10 border-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Debes conectar una cuenta de WhatsApp en la pestaña <strong>Ajustes</strong> antes de enviar mensajes.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="to">Número de destino</Label>
              <Input
                id="to"
                placeholder="3001234567"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={to && !isValidPhone ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              <p className="text-[11px] text-muted-foreground">
                Formato colombiano de 10 dígitos sin espacios ni símbolos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg">Mensaje</Label>
              <Textarea
                id="msg"
                placeholder="Escribe tu mensaje aquí..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Detalles del Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Costo por mensaje</span>
              <span className="font-medium text-foreground">{formatCurrency(cost)}</span>
            </div>

            <Separator />

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Saldo disponible</span>
                <span className="font-medium text-foreground">{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Saldo después del envío</span>
                <span className={isInsufficient ? "text-destructive" : "text-emerald-600"}>
                  {formatCurrency(balanceAfter)}
                </span>
              </div>
            </div>

            {isInsufficient && (
              <Alert variant="destructive" className="py-2 px-3 border-none bg-destructive/10 mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[11px] font-bold uppercase">
                  Saldo insuficiente
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || isInsufficient || !isValidPhone || !msg.trim() || !connectedAccount}
              className="w-full gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? "Enviando..." : "Enviar WhatsApp"}
            </Button>
            
            {connectedAccount && (
              <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                Enviando desde: {connectedAccount.alias} ({connectedAccount.displayPhone})
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
