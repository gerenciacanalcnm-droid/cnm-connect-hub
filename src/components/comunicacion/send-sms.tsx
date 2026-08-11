import { useState, useMemo, useEffect } from "react";
import { Send, Zap, Calendar, Users, MessageSquare, Info, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SmsComposer } from "./sms-composer";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendSmsMessage } from "@/lib/communication.functions";
import { formatCurrency } from "@/lib/format";

type SendMode = "direct" | "bulk" | "schedule";

export function SendSms() {
  const [mode, setMode] = useState<SendMode>("direct");
  const [destMode, setDestMode] = useState<"manual" | "crm">("manual");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [isFlash, setIsFlash] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Programación
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  
  const doSend = useServerFn(sendSmsMessage);

  // Estimaciones (Mock - deberían venir del motor comercial)
  const recipientsCount = useMemo(() => {
    if (destMode === "crm") return 1250; // Mock de contactos seleccionados
    return to.split(/[\s,;]+/).filter(n => n.trim().length > 5).length;
  }, [to, destMode]);

  const basePrice = isFlash ? 105 : 30; // Precios de prueba
  const estimatedCost = recipientsCount * basePrice;
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const balance = wallet?.balance ?? 0;

  // En una implementación real, usaríamos un hook que consulte la wallet del contexto de empresa
  useEffect(() => {
    // Simular carga de saldo
    setWallet({ balance: 150000 });
  }, []);

  const handleSend = async (flash: boolean = false) => {
    if (!msg.trim()) return toast.error("El mensaje no puede estar vacío");
    if (recipientsCount === 0) return toast.error("Agregue destinatarios");
    
    if (estimatedCost > balance) {
      return toast.error("Saldo insuficiente");
    }

    setSending(true);
    try {
      // En un masivo real, esto llamaría a una función de batch
      const res = await doSend({
        data: {
          to: destMode === "manual" ? to.split(',')[0].trim() : "BATCH_PROCESS",
          body: msg,
          isFlash: flash
        }
      });
      
      if (res.ok) {
        toast.success(mode === "schedule" ? "SMS programado" : "SMS enviado correctamente");
        if (mode === "direct") setTo("");
        setMsg("");
      }
    } catch (e: any) {
      toast.error(e.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* Selector de Modo */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SendMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="direct" className="gap-2">
                  <Send className="h-4 w-4" /> Enviar ahora
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2">
                  <Users className="h-4 w-4" /> Masivo
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Calendar className="h-4 w-4" /> Programar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Destinatarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Destinatarios</CardTitle>
            <CardDescription>Indica a quién quieres enviar el mensaje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                variant={destMode === "manual" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDestMode("manual")}
                className="flex-1"
              >
                Manual (Números)
              </Button>
              <Button 
                variant={destMode === "crm" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDestMode("crm")}
                className="flex-1"
              >
                Contactos / CRM
              </Button>
            </div>

            {destMode === "manual" ? (
              <div className="space-y-2">
                <Label>Números de teléfono</Label>
                <Textarea 
                  placeholder="3001234567, 3109876543..."
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separa los números por comas o espacios.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Seleccionar Contactos o Grupos</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda la base (1.250 contactos)</SelectItem>
                    <SelectItem value="vips">Clientes VIP (120)</SelectItem>
                    <SelectItem value="mkt">Marketing Octubre (450)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensaje */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SmsComposer 
              value={msg} 
              onChange={setMsg} 
              rows={5}
              placeholder="Escribe el contenido de tu mensaje..."
            />
          </CardContent>
        </Card>

        {/* Programación (Condicional) */}
        {mode === "schedule" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" /> Detalles de Programación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fecha de envío</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hora (24h)</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar de Resumen */}
      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" /> Resumen de Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Destinatarios</span>
                <span className="font-medium text-foreground">{recipientsCount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tipo de envío</span>
                <Badge variant={isFlash ? "secondary" : "outline"} className={isFlash ? "bg-amber-100 text-amber-900 border-amber-200" : ""}>
                  {isFlash ? "⚡ SMS Flash" : "Normal"}
                </Badge>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Costo unitario</span>
                <span className="font-medium text-foreground">{formatCurrency(basePrice)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between text-base font-semibold">
                <span>Costo Total</span>
                <span>{formatCurrency(estimatedCost)}</span>
              </div>

              <div className="rounded-lg bg-muted p-3 space-y-1.5 mt-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Saldo disponible</span>
                  <span>{formatCurrency(balance)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span>Saldo resultante</span>
                  <span className={balance < estimatedCost ? "text-destructive" : "text-green-600"}>
                    {formatCurrency(balance - estimatedCost)}
                  </span>
                </div>
              </div>
            </div>

            {balance < estimatedCost && (
              <Alert variant="destructive" className="py-2 px-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Saldo insuficiente para completar el envío.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2 pt-2">
              <Button 
                onClick={() => handleSend(false)} 
                disabled={sending || balance < estimatedCost}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {mode === "schedule" ? "Programar Envío" : "Enviar ahora"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setIsFlash(true);
                  handleSend(true);
                }}
                disabled={sending || balance < (recipientsCount * 105)}
                className="w-full gap-2 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              >
                <Zap className="h-4 w-4 text-amber-500" />
                ⚡ Enviar SMS Flash
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info lateral */}
        <Card className="bg-muted/50 border-none shadow-none">
          <CardContent className="pt-6 text-[11px] text-muted-foreground leading-relaxed">
            <p>
              El costo final puede variar según la cantidad de partes del mensaje. 
              Un SMS normal tiene 160 caracteres. Los mensajes concatenados descuentan múltiples unidades de la wallet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
