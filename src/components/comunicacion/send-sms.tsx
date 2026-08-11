import { useState, useMemo, useEffect, useCallback } from "react";
import { Send, Zap, Calendar, Users, MessageSquare, Info, AlertCircle, Clock, Search, X, Check, Trash2, FileUp, Filter } from "lucide-react";
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
import { useContacts } from "@/hooks/use-contacts";
import { useContactGroups, usePermissions } from "@/hooks/use-platform";

import { useWallets, useRateTiers } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { smsStats } from "@/lib/sms-utils";


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
  
  const { data: contactsData } = useContacts({ pageSize: 200 });
  const { data: groupsData } = useContactGroups();
  const { data: walletsData } = useWallets();
  const { data: tiersData } = useRateTiers();

  const contacts = contactsData?.items ?? [];
  const groups = groupsData ?? [];
  const wallet = walletsData?.find(w => w.channel === 'sms');
  const balance = wallet?.balance ?? 0;

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

  const doSendBulk = useServerFn(sendBulkSms);

  const handleSend = async (isFlash: boolean) => {
    if (!msg.trim()) return toast.error("Mensaje vacío");
    if (stats.valid === 0) return toast.error("Sin destinatarios válidos");
    if (cost > balance) return toast.error("Saldo insuficiente");

    setSending(true);
    try {
      await doSendBulk({ 
        data: { 
          recipients: allRecipients, 
          body: msg, 
          isFlash,
          scheduledAt: mode === 'schedule' ? `${date}T${time}:00Z` : null
        } 
      });
      toast.success(mode === 'schedule' ? "Envío programado" : "SMS enviado correctamente");
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
    </div>
  );

}
