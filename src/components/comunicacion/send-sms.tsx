import { useState, useMemo, useEffect, useCallback } from "react";
import { Send, Zap, Calendar, Users, MessageSquare, Info, AlertCircle, Clock, Search, X, Check, Trash2, FileUp, Filter, History } from "lucide-react";
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
import { SmsComposer } from "./sms-composer";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendSmsMessage } from "@/lib/communication.functions";
import { sendBulkSms } from "@/lib/sms-bulk.functions";
import { createSmsSchedule, listSmsSchedules, cancelSmsSchedule } from "@/lib/sms-schedule.functions";
import { getCurrentCompany } from "@/lib/platform.functions";
import { useContacts } from "@/hooks/use-contacts";
import { useContactGroups, usePermissions } from "@/hooks/use-platform";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useWallets, useRateTiers } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { smsStats } from "@/lib/sms-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";



type SendMode = "direct" | "bulk" | "schedule";

export function SendSms() {
  const [mode, setMode] = useState<SendMode>("direct");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  
  // Programación
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  const [toManual, setToManual] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();
  const { data: contactsData } = useContacts({ pageSize: 200 });
  const { data: groupsData } = useContactGroups();
  const { data: walletsData } = useWallets();
  const { data: tiersData } = useRateTiers();
  const { data: companyData } = useServerFn(getCurrentCompany)({ data: undefined }) as any; // Using serverFn directly as hook might hydration mismatch if not handled

  const contacts = contactsData?.items ?? [];
  const groups = groupsData ?? [];
  const wallet = walletsData?.find(w => w.channel === 'sms');
  const balance = wallet?.balance ?? 0;
  const companyTimezone = companyData?.timezone ?? "America/Bogota";

  const fetchSchedules = useServerFn(listSmsSchedules);
  const { data: schedulesRaw, refetch: refetchSchedules } = useQuery({
    queryKey: ["sms-schedules"],
    queryFn: async () => {
      const res = await fetchSchedules();
      return JSON.parse(res as string);
    }
  });
  const schedules = (schedulesRaw ?? []) as any[];

  const doSendBulk = useServerFn(sendBulkSms);
  const doCreateSchedule = useServerFn(createSmsSchedule);
  const doCancelSchedule = useServerFn(cancelSmsSchedule);

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
    const raw = toManual.split(/[\s,;]+/).filter(Boolean);
    const valid = allRecipients.length;
    const invalid = raw.length - validManualPhones.length;
    return { total: raw.length + selectedContacts.size, valid, invalid };
  }, [toManual, allRecipients, selectedContacts]);

  const cost = useMemo(() => {
    const tier = tiersData?.find(t => stats.valid >= t.fromQty && (t.toQty === 0 || stats.valid <= t.toQty));
    return (tier?.unitPrice ?? 30) * stats.valid;
  }, [stats.valid, tiersData]);

  const handleSend = async (isFlash: boolean) => {
    if (!msg.trim()) return toast.error("Mensaje vacío");
    if (stats.valid === 0) return toast.error("Sin destinatarios válidos");
    if (cost > balance) return toast.error("Saldo insuficiente");

    setSending(true);
    try {
      if (mode === 'schedule') {
        if (!date || !time) throw new Error("Debes seleccionar fecha y hora");
        
        await doCreateSchedule({
          data: {
            recipients: allRecipients,
            body: msg,
            isFlash,
            scheduledAt: `${date}T${time}:00`, // Timezone handled by DB or explicit string
            timezone: companyTimezone,
            estimatedCost: cost
          }
        });
        toast.success("Envío programado correctamente");
        refetchSchedules();
      } else {
        await doSendBulk({ 
          data: { 
            recipients: allRecipients, 
            body: msg, 
            isFlash,
            scheduledAt: null
          } 
        });
        toast.success("SMS enviado correctamente");
      }
      
      setToManual("");
      setSelectedContacts(new Set());
      setSelectedGroups(new Set());
      setMsg("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await doCancelSchedule({ data: { id } });
      toast.success("Programación cancelada");
      refetchSchedules();
    } catch (e: any) {
      toast.error(e.message);
    }
  };


  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SendMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="direct" className="gap-2"><Send className="h-4 w-4" /> Enviar ahora</TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2"><Users className="h-4 w-4" /> Envío masivo</TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2"><Calendar className="h-4 w-4" /> Programar</TabsTrigger>

              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Destinatarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Manual (comas)</Label>
              <Textarea 
                value={toManual} 
                onChange={(e) => setToManual(e.target.value)}
                placeholder="3001234567, 3109876543"
                className="min-h-[100px] font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Separa los números por comas o espacios. Los duplicados se eliminan automáticamente.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Users className="h-4 w-4" /> CRM ({selectedContacts.size})
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
                      <div key={c.id} className="flex items-center gap-3 p-3 border-b hover:bg-muted/50 transition-colors">
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
                  <Button variant="outline" className="flex-1 gap-2">
                    <Filter className="h-4 w-4" /> Grupos ({selectedGroups.size})
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

              <Button variant="outline" className="flex-1 gap-2">
                <FileUp className="h-4 w-4" /> Importar
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-2" onClick={() => {
              setToManual("");
              setSelectedContacts(new Set());
              setSelectedGroups(new Set());
            }}>
              <Trash2 className="h-3.5 w-3.5" /> Limpiar toda la lista
            </Button>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SmsComposer value={msg} onChange={setMsg} rows={5} />
          </CardContent>
        </Card>

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


      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Válidos</span>
              <span className="font-medium text-foreground">{stats.valid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Inválidos</span>
              <span className="font-medium text-destructive">{stats.invalid.toLocaleString()}</span>
            </div>
            
            <Separator />
            
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>SMS totales</span>
                <span className="font-medium text-foreground">{stats.valid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Costo estimado</span>
                <span>{formatCurrency(cost)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3 space-y-1.5 mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Saldo disponible</span>
                <span>{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span>Saldo proyectado</span>
                <span className={balance < cost ? "text-destructive" : "text-green-600"}>
                  {formatCurrency(balance - cost)}
                </span>
              </div>
            </div>

            {balance < cost && (
              <Alert variant="destructive" className="py-2 px-3 border-none bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[11px] font-medium uppercase tracking-wider">
                  Saldo insuficiente
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2 pt-2">
              <Button 
                onClick={() => handleSend(false)} 
                disabled={sending || balance < cost || stats.valid === 0}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {mode === "schedule" ? "Programar Envío" : "Enviar ahora"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => handleSend(true)}
                disabled={sending || balance < cost || stats.valid === 0}
                className="w-full gap-2 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              >
                <Zap className="h-4 w-4 text-amber-500" />
                ⚡ Enviar SMS Flash
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Listado de Programaciones */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Programaciones de Envío
              </CardTitle>
              <CardDescription>Consulta y gestiona tus envíos programados</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchSchedules()}>
              <Clock className="h-4 w-4 mr-2" /> Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No tienes programaciones activas</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium">Fecha y Hora</th>
                      <th className="text-left p-3 font-medium">Tipo</th>
                      <th className="text-left p-3 font-medium">Destinatarios</th>
                      <th className="text-left p-3 font-medium">Costo Est.</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-right p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(s.scheduled_at), "PPP", { locale: es })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(s.scheduled_at), "p")} ({s.timezone})
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          {s.is_flash ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                              <Zap className="h-3 w-3" /> Flash
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                              <Send className="h-3 w-3" /> Normal
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 font-mono">{s.recipients?.length ?? 0}</td>
                        <td className="p-3 font-medium">{formatCurrency(s.estimated_cost)}</td>
                        <td className="p-3">
                          <Badge 
                            variant="secondary" 
                            className={
                              s.status === 'COMPLETADO' ? "bg-green-100 text-green-700" :
                              s.status === 'FALLIDO' ? "bg-red-100 text-red-700" :
                              s.status === 'CANCELADO' ? "bg-gray-100 text-gray-700" :
                              s.status === 'ENVIANDO' || s.status === 'PROCESANDO' ? "bg-blue-100 text-blue-700 animate-pulse" :
                              "bg-primary/10 text-primary"
                            }
                          >
                            {s.status}
                          </Badge>
                          {s.error_reason && (
                            <p className="text-[10px] text-destructive mt-1 max-w-[150px] truncate" title={s.error_reason}>
                              {s.error_reason}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {s.status === 'PROGRAMADO' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-red-50"
                              onClick={() => handleCancel(s.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


