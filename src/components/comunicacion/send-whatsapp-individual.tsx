import { useState, useMemo, useEffect } from "react";
import { MessageCircle, Send, AlertCircle, Wallet, Users, Search, Filter, Trash2, FileUp, FileText, Info, Calendar, Clock, Globe, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useWallets, useRateTiers, useMyWallet } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { useWhatsAppAccounts, useSendWhatsAppIndividual, useSendWhatsAppBulk, useWhatsAppTemplates, useSendWhatsAppTemplate, useCreateWhatsAppSchedule } from "@/hooks/use-whatsapp";
import { useContacts } from "@/hooks/use-contacts";
import { useContactGroups } from "@/hooks/use-platform";

type SendMode = "individual" | "bulk" | "schedule";
type MessageType = "text" | "template";

export function SendWhatsAppIndividual() {
  const [mode, setMode] = useState<SendMode>("individual");
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  const [limitError, setLimitError] = useState<string | null>(null);
  
  const [toManual, setToManual] = useState("");
  const [msg, setMsg] = useState("");

  
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const { data: contactsData } = useContacts({ pageSize: 200 });
  const { data: groupsData } = useContactGroups();
  const { data: myWallet } = useMyWallet("whatsapp");
  const { data: tiersData } = useRateTiers();
  const { data: allAccounts = [] } = useWhatsAppAccounts();
  const accounts = useMemo(() => {
    // Regular users ONLY see accounts assigned to their company.
    // The hook/repository should ideally filter this, but we'll double-shield here.
    return allAccounts.filter(a => a.novaStatus === 'ASSIGNED');
  }, [allAccounts]);


  const { data: allTemplates = [] } = useWhatsAppTemplates();
  
  const sendIndividualMutation = useSendWhatsAppIndividual();
  const sendBulkMutation = useSendWhatsAppBulk();
  const sendTemplateMutation = useSendWhatsAppTemplate();
  const createScheduleMutation = useCreateWhatsAppSchedule();

  const contacts = contactsData?.items ?? [];
  const groups = groupsData ?? [];
  const wallet = myWallet;
  const balance = wallet?.balance ?? 0;
  
  const connectedAccount = useMemo(() => {
    if (selectedAccountId) return accounts.find(a => a.id === selectedAccountId);
    return accounts.find(a => a.isDefault) || accounts.find(a => a.isPrimary) || accounts.find(a => a.status === 'connected');
  }, [accounts, selectedAccountId]);


  useEffect(() => {
    if (connectedAccount && !selectedAccountId) {
      setSelectedAccountId(connectedAccount.id);
    }
  }, [connectedAccount, selectedAccountId]);

  
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
      const uniqueVars = Array.isArray(selectedTemplate.variables) 
        ? [...new Set(selectedTemplate.variables)] 
        : [];
      
      uniqueVars.forEach((v: string) => {
        const num = v.replace(/{{|}}/g, "");
        vars[num] = "";
      });
      setTemplateVariables(vars);
    }
  }, [selectedTemplate]);

  const validManualPhones = useMemo(() => {
    return toManual.split(/[\s,;]+/)
      .map(p => p.trim().replace(/\D/g, "")) // Remove non-digits
      .map(p => {
        // Normalize Colombian numbers
        if (p.length === 10 && p.startsWith("3")) return "57" + p;
        if (p.length === 12 && p.startsWith("573")) return p;
        return p;
      })
      .filter(p => /^573\d{9}$/.test(p))
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [toManual]);

  const allRecipients = useMemo(() => {
    const set = new Set<string>();
    validManualPhones.forEach(p => set.add(p));
    selectedContacts.forEach(id => {
      const c = contacts.find(c => c.id === id);
      if (c) {
        const cleaned = c.phone.replace(/\D/g, "");
        let normalized = cleaned;
        if (cleaned.length === 10 && cleaned.startsWith("3")) normalized = "57" + cleaned;
        if (/^573\d{9}$/.test(normalized)) set.add(normalized);
      }
    });
    return Array.from(set);
  }, [validManualPhones, selectedContacts, contacts]);

  const stats = useMemo(() => {
    if (mode === "individual") {
      const cleaned = toManual.trim().replace(/\D/g, "");
      let normalized = cleaned;
      if (cleaned.length === 10 && cleaned.startsWith("3")) normalized = "57" + cleaned;
      const valid = normalized.length === 12 && /^573\d{9}$/.test(normalized);
      return { total: 1, valid: valid ? 1 : 0, invalid: !valid && toManual ? 1 : 0 };
    }
    const raw = toManual.split(/[\s,;]+/).filter(Boolean);
    const valid = allRecipients.length;
    const invalid = Math.max(0, raw.length - validManualPhones.length);
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
    setLimitError(null);
    if (!connectedAccount) return toast.error("Conecta primero una cuenta de WhatsApp Business.");
    
    // Check limits via RPC before sending
    try {
      const { data: limitCheck, error: rpcError } = await supabase.rpc('check_whatsapp_limits', {
        _company_id: connectedAccount.company_id
      });
      
      if (rpcError) throw rpcError;
      
      const check = limitCheck as any;
      if (check && !check.allowed) {
        const msg = "Has alcanzado el límite de mensajes configurado para tu empresa";
        setLimitError(msg);
        return toast.error(msg, {
          description: `Razón: ${check.reason} (${check.current}/${check.limit})`
        });
      }
    } catch (e: any) {
      console.error("Limit check failed:", e);
      // Fallback: allow sending if RPC fails but log it
    }

    if (stats.valid === 0) return toast.error("Sin destinatarios válidos.");
    if (isInsufficient) {
      return toast.error(
        `Saldo insuficiente. Disponible: ${formatCurrency(balance)}, Requerido: ${formatCurrency(totalCost)}, Faltante: ${formatCurrency(totalCost - balance)}`
      );
    }


    if (messageType === "text" && !msg.trim()) return toast.error("El mensaje no puede estar vacío.");
    if (messageType === "template" && !selectedTemplateId) return toast.error("Selecciona una plantilla.");

    if (mode === "schedule") {
      if (!scheduledDate || !scheduledTime) return toast.error("Selecciona fecha y hora para la programación.");
      const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

      try {
        await createScheduleMutation.mutateAsync({
          accountId: connectedAccount.id,
          recipients: allRecipients,
          body: messageType === 'text' ? msg.trim() : undefined,
          templateId: messageType === 'template' ? selectedTemplateId : undefined,
          variables: messageType === 'template' ? templateVariables : undefined,
          scheduledAt,
          timezone,
          estimatedCost: totalCost
        });
        toast.success("Envío de WhatsApp programado correctamente");
        
        setToManual("");
        setSelectedContacts(new Set());
        setMsg("");
        setSelectedTemplateId("");
        setScheduledDate("");
        setScheduledTime("");
      } catch (err: any) {
        toast.error(err.message || "Error al programar WhatsApp");
      }
      return;
    }

    const batchId = crypto.randomUUID();

    try {
      if (mode === "individual") {
        if (messageType === "template") {
          await sendTemplateMutation.mutateAsync({
            recipient: toManual.trim(),
            templateId: selectedTemplateId,
            variables: templateVariables,
            accountId: connectedAccount.id
          });
        } else {
          await sendIndividualMutation.mutateAsync({
            recipient: toManual.trim(),
            body: msg.trim(),
            accountId: connectedAccount.id
          });
        }
        toast.success("WhatsApp enviado correctamente");
      } else {
        // Bulk sending
        const res = await sendBulkMutation.mutateAsync({
          recipients: allRecipients,
          body: messageType === 'text' ? msg.trim() : undefined,
          templateId: messageType === 'template' ? selectedTemplateId : undefined,
          variables: messageType === 'template' ? templateVariables : undefined,
          accountId: connectedAccount.id,
          batchId: batchId
        });

        toast.success(`Envío masivo completado. Total: ${res.total}, Enviados: ${res.sent}, Fallidos: ${res.failed}`);
        
        if (res.failed > 0) {
          console.warn("Detalles de errores:", res.errors);
        }
      }
      
      setToManual("");
      setSelectedContacts(new Set());
      setSelectedGroups(new Set());
      setMsg("");
      setSelectedTemplateId("");
    } catch (err: any) {
      console.error("[whatsapp.handleSend] Error:", err.message);
      const technicalMsg = err.message || "Error desconocido";
      
      let errorTitle = "Error de Envío";
      if (technicalMsg.includes("META_TEMPLATE_PARAMETER_ERROR")) {
        errorTitle = "META_TEMPLATE_PARAMETER_ERROR";
      } else if (technicalMsg.includes("META_AUTH_ERROR")) {
        errorTitle = "Authentication Error";
      }

      toast.error(errorTitle, {
        duration: 10000,
        description: technicalMsg.includes("132012") 
          ? "Los parámetros enviados no coinciden con la estructura de la plantilla aprobada en Meta."
          : technicalMsg
      });
    }

  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SendMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="individual" className="gap-2 text-xs sm:text-sm">
                  <Send className="h-4 w-4" /> Individual
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2 text-xs sm:text-sm">
                  <Users className="h-4 w-4" /> Masivo
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2 text-xs sm:text-sm">
                  <Calendar className="h-4 w-4" /> Programar
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
            {limitError && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Límite Alcanzado</Divider>
                <AlertDescription className="text-xs">
                  {limitError}
                </AlertDescription>
              </Alert>
            )}

            {mode === "schedule" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-emerald-50/30 rounded-lg border border-emerald-100">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-emerald-600" /> Fecha de Envío
                  </Label>
                  <Input 
                    type="date" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-emerald-600" /> Hora (24h)
                  </Label>
                  <Input 
                    type="time" 
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-emerald-600" /> Zona Horaria
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuenta de Envío</Label>
                {accounts.length > 0 ? (
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="w-full bg-emerald-50/50 border-emerald-100 focus:ring-emerald-500">
                      <SelectValue placeholder="Seleccionar cuenta de envío" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{acc.alias}</span>
                            <span className="text-xs text-slate-400">({acc.displayPhone || acc.phoneNumberId})</span>
                            {acc.isPrimary && <Badge variant="secondary" className="h-4 text-[9px] px-1">Principal</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert variant="destructive" className="bg-destructive/10 border-none py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      No hay cuentas conectadas. Ve a Ajustes para configurar una.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número de destino</Label>
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
                      <DialogFooter>
                        <DialogTrigger asChild>
                          <Button className="w-full">Cerrar</Button>
                        </DialogTrigger>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-3.5 w-3.5" /> Grupos ({selectedGroups.size})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Grupos de Contactos</DialogTitle></DialogHeader>
                      <ScrollArea className="h-[300px]">
                        {groups.map((g: any) => (
                          <div key={g.id} className="flex items-center gap-3 p-2 border-b">
                            <Checkbox checked={selectedGroups.has(g.id)} onCheckedChange={(checked) => {
                              const next = new Set(selectedGroups);
                              if (checked) next.add(g.id); else next.delete(g.id);
                              setSelectedGroups(next);
                            }} />
                            <div className="flex flex-col text-sm">
                              <span>{g.name}</span>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                      <DialogFooter>
                        <DialogTrigger asChild>
                          <Button className="w-full">Cerrar</Button>
                        </DialogTrigger>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                          <div className="p-2 text-xs text-muted-foreground italic">Saldo insuficiente</div>
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
                          {([...new Set(selectedTemplate.variables)] as string[]).map((v: string) => {
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

            {isInsufficient && totalCost > 0 && (
              <Alert variant="destructive" className="py-2 px-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold uppercase">
                  Saldo insuficiente. Necesitas {formatCurrency(totalCost)} para realizar este envío.
                </AlertDescription>
              </Alert>
            )}

            {!connectedAccount && accounts.length > 0 && (
              <Alert variant="destructive" className="py-2 px-3 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 font-bold">
                  Selecciona una cuenta de envío para continuar.
                </AlertDescription>
              </Alert>
            )}

            {messageType === 'template' && selectedTemplateId && (selectedTemplate?.variables && Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.length > 0) && 
             Object.keys(templateVariables).some(k => !templateVariables[k]?.trim()) && (
              <Alert variant="destructive" className="py-2 px-3 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800 font-bold">
                  Completa todas las variables de la plantilla.
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4 p-3 bg-slate-50 border rounded-lg text-[10px] space-y-1 font-mono">
              <div className="flex justify-between font-bold border-b pb-1 mb-1 text-slate-700">
                <span>DIAGNÓSTICO TÉCNICO</span>
              </div>

              <div className="flex justify-between">
                <span>Cuenta:</span>
                <span className={connectedAccount ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>
                  {connectedAccount ? "OK" : "ERROR"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Número:</span>
                <span className={stats.valid > 0 ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>
                  {stats.valid > 0 ? "OK" : "ERROR"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Plantilla:</span>
                <span className={selectedTemplateId ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>
                  {selectedTemplateId ? "OK" : "ERROR"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estado Meta:</span>
                <span className={String(selectedTemplate?.status) === 'APPROVED' ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>
                  {String(selectedTemplate?.status || "N/A")}
                </span>
              </div>

              {messageType === 'template' && selectedTemplate && (
                <>
                  <Separator className="my-1 opacity-50" />
                  <div className="flex justify-between font-bold text-[9px] text-slate-500 uppercase">
                    <span>Estructura Meta</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Body Vars:</span>
                    <span>{(selectedTemplate.body?.match(/{{(\d+)}}/g) || []).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nova envía:</span>
                    <span>{Object.keys(templateVariables).length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-dashed">
                    <span>ESTRUCTURA:</span>
                    <span className="flex items-center gap-1">
                      {Object.keys(templateVariables).length === (selectedTemplate.body?.match(/{{(\d+)}}/g) || []).length ? (
                        <><ShieldCheck className="h-3 w-3 text-emerald-600" /> <span className="text-emerald-600 font-bold">MATCH</span></>
                      ) : (
                        <><ShieldAlert className="h-3 w-3 text-destructive" /> <span className="text-destructive font-bold">MISMATCH</span></>
                      )}
                    </span>
                  </div>
                </>
              )}

              <Separator className="my-1 opacity-50" />
              <div className="flex justify-between">
                <span>Costo:</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo:</span>
                <span className={!isInsufficient ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>
                  {formatCurrency(balance)}
                </span>
              </div>
              
              {(sendIndividualMutation.error || sendTemplateMutation.error) && (
                <div className="mt-2 pt-2 border-t border-red-100 text-red-700 space-y-1 overflow-hidden">
                  <div className="flex justify-between">
                    <span>ERROR:</span>
                    <span className="font-bold">META_API_FAILURE</span>
                  </div>
                  <div className="break-all text-[9px] opacity-80 leading-tight">
                    {String(sendIndividualMutation.error || sendTemplateMutation.error)}
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4 font-bold uppercase tracking-tight h-11"
              disabled={
                !connectedAccount || 
                stats.valid === 0 || 
                isInsufficient || 
                (messageType === "text" && !msg.trim()) || 
                (messageType === "template" && !selectedTemplateId) ||
                (messageType === "template" && selectedTemplate && Object.keys(templateVariables).length !== (selectedTemplate.body?.match(/{{(\d+)}}/g) || []).length) ||
                sendIndividualMutation.isPending || 
                sendTemplateMutation.isPending
              }
              onClick={handleSend}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendIndividualMutation.isPending || sendTemplateMutation.isPending ? (
                "Procesando..."
              ) : (
                mode === 'individual' ? 'Enviar' : mode === 'schedule' ? 'Programar WhatsApp' : 'Procesar Masivo'
              )}
            </Button>
            
            <div className="flex items-center gap-2 p-3 rounded border bg-amber-50/50 border-amber-100 text-[11px] text-amber-800 italic mt-4">
               <Info className="h-3 w-3 shrink-0" />
               <p>Los envíos de plantillas están sujetos a las políticas comerciales de Meta.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
