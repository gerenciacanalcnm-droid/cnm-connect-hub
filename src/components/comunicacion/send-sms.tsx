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

    try {
      await doSendBulk({ data: { recipients: allRecipients, body: msg, isFlash } });
      toast.success("Envío programado");
      setToManual("");
      setSelectedContacts(new Set());
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
                <TabsTrigger value="direct">Enviar ahora</TabsTrigger>
                <TabsTrigger value="bulk">Masivo</TabsTrigger>
                <TabsTrigger value="schedule">Programar</TabsTrigger>
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
                className="font-mono"
              />
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Seleccionar Contactos ({selectedContacts.size})</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Seleccionar contactos</DialogTitle></DialogHeader>
                <ScrollArea className="h-[400px]">
                  {contacts.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-2 border-b">
                      <Checkbox 
                        checked={selectedContacts.has(c.id)}
                        onCheckedChange={checked => {
                          const next = new Set(selectedContacts);
                          if (checked) next.add(c.id); else next.delete(c.id);
                          setSelectedContacts(next);
                        }}
                      />
                      <span>{c.firstName} {c.lastName} ({c.phone})</span>
                    </div>
                  ))}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <SmsComposer value={msg} onChange={setMsg} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Válidos</span>
              <span className="font-bold text-green-600">{stats.valid}</span>
            </div>
            <div className="flex justify-between">
              <span>Inválidos</span>
              <span className="font-bold text-red-600">{stats.invalid}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Costo</span>
              <span>{formatCurrency(cost)} COP</span>
            </div>
            <Button className="w-full" onClick={() => handleSend(false)} disabled={balance < cost}>Enviar</Button>
            <Button variant="outline" className="w-full" onClick={() => handleSend(true)} disabled={balance < cost}>⚡ SMS Flash</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

}
