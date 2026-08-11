import { useState, useMemo } from "react";
import { MessageCircle, Send, AlertCircle, Wallet, Users, Search, Filter, Trash2, FileUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useWallets, useRateTiers } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { useWhatsAppAccounts, useSendWhatsAppIndividual, useSendWhatsAppBulk } from "@/hooks/use-whatsapp";
import { useContacts } from "@/hooks/use-contacts";
import { useContactGroups } from "@/hooks/use-platform";

type SendMode = "individual" | "bulk";

export function SendWhatsAppIndividual() {
  const [mode, setMode] = useState<SendMode>("individual");
  const [toManual, setToManual] = useState("");
  const [msg, setMsg] = useState("");
  
  // Destinatarios masivos
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const { data: contactsData } = useContacts({ pageSize: 200 });
  const { data: groupsData } = useContactGroups();
  const { data: walletsData } = useWallets();
  const { data: tiersData } = useRateTiers();
  const { data: accounts = [] } = useWhatsAppAccounts();
  
  const sendIndividualMutation = useSendWhatsAppIndividual();
  const sendBulkMutation = useSendWhatsAppBulk();

  const contacts = contactsData?.items ?? [];
  const groups = groupsData ?? [];
  const wallet = walletsData?.find(w => w.channel === 'whatsapp');
  const balance = wallet?.balance ?? 0;
  
  const connectedAccount = accounts.find(a => a.status === 'connected');

  // Lógica de destinatarios (Reutilizada de SMS)
  const validManualPhones = useMemo(() => {
    return toManual.split(/[\s,;]+/)
      .map(p => p.trim())
      .filter(p => /^3\d{9}$/.test(p))
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [toManual]);

  const allRecipients = useMemo(() => {
    const set = new Set<string>();
    validManualPhones.forEach(p => set.add(p));
    selectedContacts.forEach(id => {
      const c = contacts.find(c => c.id === id);
      if (c && /^3\d{9}$/.test(c.phone)) set.add(c.phone);
    });
    // Nota: Lógica de grupos podría expandirse aquí si los grupos tienen contactos asociados directamente en el frontend
    return Array.from(set);
  }, [validManualPhones, selectedContacts, contacts]);

  const stats = useMemo(() => {
    if (mode === "individual") {
      const valid = /^3\d{9}$/.test(toManual.trim());
      return { total: 1, valid: valid ? 1 : 0, invalid: !valid && toManual ? 1 : 0 };
    }
    const raw = toManual.split(/[\s,;]+/).filter(Boolean);
    const valid = allRecipients.length;
    const invalid = raw.length - validManualPhones.length;
    return { total: raw.length + selectedContacts.size, valid, invalid };
  }, [mode, toManual, allRecipients, validManualPhones, selectedContacts]);

  const whatsappTier = useMemo(() => {
    // Buscamos la tarifa de WhatsApp (tier 1 unidad o según volumen)
    const units = stats.valid || 1;
    return tiersData?.find(t => t.channel === 'whatsapp' && t.isActive && units >= t.fromQty && (t.toQty === 0 || units <= t.toQty));
  }, [tiersData, stats.valid]);

  const unitPrice = whatsappTier?.unitPrice ?? 0;
  const totalCost = unitPrice * (stats.valid || 0);
  const balanceAfter = balance - totalCost;
  const isInsufficient = balance < totalCost;

  const handleSend = async () => {
    if (!connectedAccount) {
      return toast.error("No hay una cuenta de WhatsApp conectada. Ve a Ajustes.");
    }
    
    if (stats.valid === 0) {
      return toast.error("Sin destinatarios válidos (formato: 3001234567)");
    }

    if (!msg.trim()) {
      return toast.error("El mensaje no puede estar vacío");
    }

    if (isInsufficient) {
      return toast.error("Saldo insuficiente");
    }

    try {
      if (mode === "individual") {
        await sendIndividualMutation.mutateAsync({
          recipient: toManual.trim(),
          body: msg.trim(),
          accountId: connectedAccount.id
        });
        toast.success("WhatsApp enviado correctamente");
      } else {
        const res = await sendBulkMutation.mutateAsync({
          recipients: allRecipients,
          body: msg.trim(),
          accountId: connectedAccount.id
        });
        toast.success(`Envío masivo completado. Enviados: ${res.sent}, Fallidos: ${res.failed}`);
      }
      
      setToManual("");
      setSelectedContacts(new Set());
      setSelectedGroups(new Set());
      setMsg("");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar WhatsApp");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SendMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" className="gap-2">
                  <Send className="h-4 w-4" /> Individual
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2">
                  <Users className="h-4 w-4" /> Masivo
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              {mode === "individual" ? "Mensaje Individual" : "Envío Masivo WhatsApp"}
            </CardTitle>
            <CardDescription>
              {mode === "individual" 
                ? "Envía un mensaje a un solo número de forma rápida." 
                : "Envía mensajes a múltiples contactos o grupos simultáneamente."}
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to">{mode === "individual" ? "Número de destino" : "Manual (comas o espacios)"}</Label>
                {mode === "individual" ? (
                  <Input
                    id="to"
                    placeholder="3001234567"
                    value={toManual}
                    onChange={(e) => setToManual(e.target.value)}
                    className={toManual && !/^3\d{9}$/.test(toManual.trim()) ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                ) : (
                  <Textarea
                    id="to"
                    placeholder="3001234567, 3109876543"
                    value={toManual}
                    onChange={(e) => setToManual(e.target.value)}
                    className="min-h-[100px] font-mono text-sm"
                  />
                )}
                <p className="text-[11px] text-muted-foreground">
                  {mode === "individual" 
                    ? "Formato: 10 dígitos sin espacios." 
                    : "Los números inválidos o duplicados se filtran automáticamente."}
                </p>
              </div>

              {mode === "bulk" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Users className="h-3.5 w-3.5" /> CRM ({selectedContacts.size})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Seleccionar contactos</DialogTitle>
                      </DialogHeader>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar contactos..." className="pl-9" />
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        {contacts.map(c => (
                          <div key={c.id} className="flex items-center gap-3 p-3 border-b hover:bg-muted/50">
                            <Checkbox 
                              checked={selectedContacts.has(c.id)}
                              onCheckedChange={checked => {
                                const next = new Set(selectedContacts);
                                if (checked) next.add(c.id); else next.delete(c.id);
                                setSelectedContacts(next);
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{c.firstName} {c.lastName}</span>
                              <span className="text-xs text-muted-foreground font-mono">{c.phone}</span>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedContacts(new Set())}>Limpiar</Button>
                        <DialogTrigger asChild>
                          <Button>Confirmar ({selectedContacts.size})</Button>
                        </DialogTrigger>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Filter className="h-3.5 w-3.5" /> Grupos ({selectedGroups.size})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Seleccionar Grupos</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {groups.length === 0 ? (
                          <p className="text-sm text-center text-muted-foreground py-8 font-mono">NO_GROUPS_DEFINED</p>
                        ) : (
                          groups.map(g => (
                            <div key={g.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                              <Checkbox 
                                checked={selectedGroups.has(g.id)}
                                onCheckedChange={checked => {
                                  const next = new Set(selectedGroups);
                                  if (checked) next.add(g.id); else next.delete(g.id);
                                  setSelectedGroups(next);
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{g.name}</span>
                                {g.description && <span className="text-xs text-muted-foreground">{g.description}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <FileUp className="h-3.5 w-3.5" /> Importar
                  </Button>
                </div>
              )}

              {mode === "bulk" && (stats.total > 0) && (
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-2" onClick={() => {
                  setToManual("");
                  setSelectedContacts(new Set());
                  setSelectedGroups(new Set());
                }}>
                  <Trash2 className="h-3 w-3" /> Limpiar lista
                </Button>
              )}
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
              <span>Tarifa unitaria</span>
              <span className="font-medium text-foreground">{formatCurrency(unitPrice)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Destinatarios válidos</span>
              <span className="font-medium text-foreground">{stats.valid.toLocaleString()}</span>
            </div>

            <Separator />

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Saldo disponible</span>
                <span className="font-medium text-foreground">{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Costo total estimado</span>
                <span className="text-foreground">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Saldo proyectado</span>
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
              disabled={sendIndividualMutation.isPending || sendBulkMutation.isPending || isInsufficient || stats.valid === 0 || !msg.trim() || !connectedAccount}
              className="w-full gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              {sendIndividualMutation.isPending || sendBulkMutation.isPending ? "Procesando..." : (mode === "individual" ? "Enviar WhatsApp" : "Iniciar Envío Masivo")}
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
