import { useState, useMemo, useEffect } from "react";
import { MessageCircle, Send, AlertCircle, Wallet, Users, Search, Filter, Trash2, FileUp, FileText, Info, Calendar, Clock, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useWallets, useRateTiers } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { useWhatsAppAccounts, useSendWhatsAppIndividual, useSendWhatsAppBulk, useWhatsAppTemplates, useSendWhatsAppTemplate } from "@/hooks/use-whatsapp";
import { useContacts } from "@/hooks/use-contacts";
import { useContactGroups } from "@/hooks/use-platform";

type SendMode = "individual" | "bulk";
type MessageType = "text" | "template";

export function SendWhatsAppIndividual() {
  const [mode, setMode] = useState<SendMode>("individual");
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  const [toManual, setToManual] = useState("");
  const [msg, setMsg] = useState("");
  
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const { data: contactsData } = useContacts({ pageSize: 200 });
  const { data: groupsData } = useContactGroups();
  const { data: walletsData } = useWallets();
  const { data: tiersData } = useRateTiers();
  const { data: accounts = [] } = useWhatsAppAccounts();
  const { data: allTemplates = [] } = useWhatsAppTemplates();
  
  const sendIndividualMutation = useSendWhatsAppIndividual();
  const sendBulkMutation = useSendWhatsAppBulk();
  const sendTemplateMutation = useSendWhatsAppTemplate();

  const contacts = contactsData?.items ?? [];
  const groups = groupsData ?? [];
  const wallet = walletsData?.find(w => w.channel === 'whatsapp');
  const balance = wallet?.balance ?? 0;
  
  const connectedAccount = accounts.find(a => a.status === 'connected');
  
  const templates = useMemo(() => {
    return allTemplates.filter(t => (t.status as string) === 'APPROVED');
  }, [allTemplates]);

  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  // Reset variables when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const vars: Record<string, string> = {};
      selectedTemplate.variables.forEach((v: string) => {
        const num = v.replace(/{{|}}/g, "");
        vars[num] = "";
      });
      setTemplateVariables(vars);
    }
  }, [selectedTemplate]);

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
    const units = stats.valid || 1;
    return tiersData?.find(t => t.channel === 'whatsapp' && t.isActive && units >= t.fromQty && (t.toQty === 0 || units <= t.toQty));
  }, [tiersData, stats.valid]);

  const unitPrice = whatsappTier?.unitPrice ?? 0;
  const totalCost = unitPrice * (stats.valid || 0);
  const balanceAfter = balance - totalCost;
  const isInsufficient = balance < totalCost;

  const handleSend = async () => {
    if (!connectedAccount) return toast.error("No hay una cuenta de WhatsApp conectada.");
    if (stats.valid === 0) return toast.error("Sin destinatarios válidos.");
    if (isInsufficient) return toast.error("Saldo insuficiente.");

    if (messageType === "text" && !msg.trim()) return toast.error("El mensaje no puede estar vacío.");
    if (messageType === "template" && !selectedTemplateId) return toast.error("Selecciona una plantilla.");

    try {
      if (messageType === "template") {
        // Por ahora envío individual con plantilla (se puede iterar para bulk)
        if (mode === "individual") {
          await sendTemplateMutation.mutateAsync({
            recipient: toManual.trim(),
            templateId: selectedTemplateId,
            variables: templateVariables,
            accountId: connectedAccount.id
          });
          toast.success("Plantilla enviada correctamente");
        } else {
          // Bulk con plantilla (Simulado por ahora, o llamar loop)
          toast.info("Procesando envío masivo de plantilla...");
          let success = 0;
          let failed = 0;
          for (const recipient of allRecipients) {
             try {
               await sendTemplateMutation.mutateAsync({
                 recipient,
                 templateId: selectedTemplateId,
                 variables: templateVariables,
                 accountId: connectedAccount.id,
                 batchId: "bulk-template-dispatch"
               });
               success++;
             } catch {
               failed++;
             }
          }
          toast.success(`Envío masivo completado. Éxito: ${success}, Fallo: ${failed}`);
        }
      } else {
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
      }
      
      setToManual("");
      setSelectedContacts(new Set());
      setMsg("");
      setSelectedTemplateId("");
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
                <TabsTrigger value="individual" className="gap-2 text-xs sm:text-sm">
                  <Send className="h-4 w-4" /> Individual
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2 text-xs sm:text-sm">
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
          </CardHeader>
          <CardContent className="space-y-6">
            {!connectedAccount && (
              <Alert variant="destructive" className="bg-destructive/10 border-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Debes conectar una cuenta en Ajustes.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{mode === "individual" ? "Número de destino" : "Destinatarios Manuales"}</Label>
                {mode === "individual" ? (
                  <Input
                    placeholder="3001234567"
                    value={toManual}
                    onChange={(e) => setToManual(e.target.value)}
                  />
                ) : (
                  <Textarea
                    placeholder="3001234567, 3109876543"
                    value={toManual}
                    onChange={(e) => setToManual(e.target.value)}
                    className="min-h-[80px] font-mono text-sm"
                  />
                )}
              </div>

              {mode === "bulk" && (
                <div className="grid grid-cols-2 gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Users className="h-3.5 w-3.5" /> CRM ({selectedContacts.size})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle>Contactos CRM</DialogTitle></DialogHeader>
                      <ScrollArea className="h-[300px]">
                        {contacts.map(c => (
                          <div key={c.id} className="flex items-center gap-3 p-2 border-b">
                            <Checkbox checked={selectedContacts.has(c.id)} onCheckedChange={(checked) => {
                              const next = new Set(selectedContacts);
                              if (checked) next.add(c.id); else next.delete(c.id);
                              setSelectedContacts(next);
                            }} />
                            <div className="flex flex-col text-sm">
                              <span>{c.firstName} {c.lastName}</span>
                              <span className="text-muted-foreground font-mono">{c.phone}</span>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Función de importación próximamente")}>
                    <FileUp className="h-3.5 w-3.5" /> Importar
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tipo de Mensaje</Label>
                <Tabs value={messageType} onValueChange={(v) => setMessageType(v as MessageType)} className="h-8">
                  <TabsList className="h-8 p-0.5">
                    <TabsTrigger value="text" className="h-7 text-xs px-3">Texto Libre</TabsTrigger>
                    <TabsTrigger value="template" className="h-7 text-xs px-3">Plantilla</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {messageType === "text" ? (
                <div className="space-y-2">
                  <Label>Cuerpo del Mensaje</Label>
                  <Textarea
                    placeholder="Escribe tu mensaje..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    rows={4}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Seleccionar Plantilla Aprobada</Label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una plantilla..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.language.toUpperCase()})
                          </SelectItem>
                        ))}
                        {templates.length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground italic">No hay plantillas aprobadas.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="p-3 bg-muted/50 rounded-lg border border-dashed text-sm space-y-3">
                      <div className="flex items-start gap-2 text-muted-foreground italic">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>{selectedTemplate.body}</p>
                      </div>
                      
                      {selectedTemplate.variables.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <Label className="text-xs uppercase font-bold text-emerald-700">Variables de la Plantilla</Label>
                          {selectedTemplate.variables.map((v: string) => {
                            const num = v.replace(/{{|}}/g, "");
                            return (
                              <div key={num} className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Valor para {v}</Label>
                                <Input 
                                  size={1} 
                                  className="h-8 text-sm" 
                                  placeholder={`Ingresa valor para ${v}`}
                                  value={templateVariables[num] || ""}
                                  onChange={(e) => setTemplateVariables({...templateVariables, [num]: e.target.value})}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6 border-emerald-100 shadow-emerald-900/5">
          <CardHeader className="bg-emerald-50/50 pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-900">
              <Wallet className="h-4 w-4" />
              Resumen de Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destinatarios</span>
                <span className="font-medium">{stats.valid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo por envío</span>
                <span className="font-medium text-emerald-600">{formatCurrency(unitPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Costo Total</span>
                <span className="font-bold text-lg">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span>Saldo Actual</span>
                <span>{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 mt-1">
                <span>Saldo Proyectado</span>
                <span className={isInsufficient ? "text-destructive" : "text-emerald-700"}>
                  {formatCurrency(balanceAfter)}
                </span>
              </div>
            </div>

            {isInsufficient && (
              <Alert variant="destructive" className="py-2 px-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold uppercase">Saldo insuficiente</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSend}
              disabled={isInsufficient || stats.valid === 0 || (messageType === 'text' ? !msg.trim() : !selectedTemplateId) || !connectedAccount}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Send className="h-4 w-4 mr-2" />
              {mode === 'individual' ? 'Enviar Ahora' : 'Procesar Masivo'}
            </Button>
            
            <div className="flex items-center gap-2 p-3 rounded border bg-amber-50/50 border-amber-100 text-[11px] text-amber-800 italic">
               <Info className="h-3 w-3 shrink-0" />
               <p>Los envíos de plantillas están sujetos a las políticas comerciales de Meta.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
