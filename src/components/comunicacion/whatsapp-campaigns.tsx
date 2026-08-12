import { useEffect, useState, useMemo } from "react";
import { 
  Plus, 
  LayoutTemplate, 
  Calendar, 
  Users, 
  CheckCircle2, 
  BarChart3,
  Search,
  Filter,
  MoreVertical,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  UserPlus,
  Play,
  Zap,
  Check,
  AlertTriangle,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWhatsAppCampaigns, useCreateWhatsAppCampaign, useStartWhatsAppCampaign, useWhatsAppCampaignDetails } from "@/hooks/use-whatsapp-campaigns";
import { useWhatsAppAccounts, useWhatsAppTemplates } from "@/hooks/use-whatsapp";
import { useMyWallet } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

function CampaignValidationDialog({ campaignId, isOpen, onOpenChange }: { campaignId: string, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { data } = useWhatsAppCampaignDetails(campaignId);
  const campaign = data?.campaign;
  const results = data?.results || [];

  const stats = useMemo(() => {
    return {
      total: campaign?.total_recipients || 0,
      sent: results.filter(r => r.wamid).length,
      failed: results.filter(r => r.status === 'failed').length,
      queued: results.filter(r => r.status === 'queued').length
    };
  }, [campaign, results]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-500" />
            Monitoreo de Campaña Real
          </DialogTitle>
          <DialogDescription>
            Validación de idempotencia y trazabilidad Meta Cloud API.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-50 border-none">
              <CardContent className="pt-4 pb-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Estado Actual</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-2 w-2 rounded-full animate-pulse ${campaign?.status === 'running' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span className="text-sm font-bold capitalize">{campaign?.status}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-none">
              <CardContent className="pt-4 pb-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Progreso Meta</p>
                <p className="text-xl font-bold mt-1">{stats.sent} / {stats.total}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Trazabilidad de Destinatarios (Muestra)</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border border-slate-100 bg-slate-50/50 p-2">
              <div className="space-y-1.5">
                {results.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-[10px] bg-white p-2 rounded border border-slate-50">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{r.phone}</span>
                      <span className="text-[8px] text-slate-400 font-mono truncate max-w-[150px]">{r.wamid || 'Esperando WAMID...'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`h-4 text-[8px] px-1 ${r.wamid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                        {r.wamid ? 'SENT' : r.status.toUpperCase()}
                      </Badge>
                      <span className="text-[8px] text-slate-400">Intento: {(r as any).attempt_count || 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Alert className="bg-blue-50 border-blue-100 py-2">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-[10px] text-blue-800 italic">
              Idempotencia garantizada: campaign_id + phone no producirá duplicados.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full bg-slate-900 text-white">
            Cerrar y Continuar en Segundo Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WhatsAppCampaigns() {
  const { data: myWallet } = useMyWallet("whatsapp");
  const companyId = myWallet?.company_id;
  const { data: campaigns, isLoading } = useWhatsAppCampaigns(companyId);
  const { data: accounts = [] } = useWhatsAppAccounts();
  const { data: allTemplates = [] } = useWhatsAppTemplates();
  const createCampaign = useCreateWhatsAppCampaign();
  const startCampaign = useStartWhatsAppCampaign();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [monitoringCampaignId, setMonitoringCampaignId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [manualPhones, setManualPhones] = useState("");

  // Hook into monitoring
  useEffect(() => {
    if (isValidating && createCampaign.data?.id) {
       // Optional: Auto-close creation and open monitoring
    }
  }, [isValidating, createCampaign.data]);

  
  const approvedTemplates = useMemo(() => 
    allTemplates.filter((t: any) => t.status === 'APPROVED'),
  [allTemplates]);

  const selectedTemplate = useMemo(() => 
    approvedTemplates.find((t: any) => t.id === selectedTemplateId),
  [approvedTemplates, selectedTemplateId]);

  const selectedAccount = useMemo(() => 
    accounts.find((a: any) => a.id === selectedAccountId),
  [accounts, selectedAccountId]);

  const filteredCampaigns = campaigns?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recipientStats = useMemo(() => {
    const raw = manualPhones.split(/[\n,]/).map(p => p.trim()).filter(p => p.length > 0);
    const valid = raw.filter(p => p.length > 5 && /^\+?[1-9]\d{1,14}$/.test(p.replace(/\D/g, '')));
    const invalid = raw.filter(p => !valid.includes(p));
    const unique = Array.from(new Set(valid.map(p => p.replace(/\D/g, ''))));
    const duplicates = valid.length - unique.length;
    
    return {
      total: raw.length,
      valid: unique.length,
      invalid: invalid.length,
      duplicates,
      uniqueList: unique
    };
  }, [manualPhones]);

  const costData = useMemo(() => {
    const cost = recipientStats.valid * 0.05;
    const currentBalance = myWallet?.balance || 0;
    const projectedBalance = currentBalance - cost;
    const isOverBalance = cost > currentBalance;
    
    return {
      cost,
      currentBalance,
      projectedBalance,
      isOverBalance
    };
  }, [recipientStats.valid, myWallet]);

  const handleCreate = async () => {
    if (!companyId) return;
    if (!name || !selectedAccountId || !selectedTemplateId || !manualPhones) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (recipientStats.valid === 0) {
      toast.error("Ingresa al menos un número de teléfono válido");
      return;
    }

    if (costData.isOverBalance) {
      toast.error("Saldo insuficiente para ejecutar esta campaña");
      return;
    }

    setIsValidating(true);
    
    try {
      // Step 1: Create Campaign (DRAFT)
      const campaign = await createCampaign.mutateAsync({
        companyId,
        accountId: selectedAccountId,
        templateId: selectedTemplateId,
        name,
        recipients: recipientStats.uniqueList.map(phone => ({ phone })),
        estimatedCost: costData.cost
      });
      
      // Step 2: Start Campaign flow (DRAFT -> VALIDATING -> READY -> QUEUED)
      await startCampaign.mutateAsync(campaign.id);
      
      toast.success("Campaña iniciada correctamente");
      setIsNewDialogOpen(false);
      setIsValidating(false);
      // Reset form
      setName("");
      setSelectedTemplateId("");
      setSelectedAccountId("");
      setManualPhones("");
    } catch (error: any) {
      setIsValidating(false);
      toast.error(error.message || "Error al procesar la campaña");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return <Badge variant="secondary">Borrador</Badge>;
      case 'validating': return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 animate-pulse">Validando</Badge>;
      case 'ready': return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Listo</Badge>;
      case 'scheduled': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Programada</Badge>;
      case 'queued': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">En cola</Badge>;
      case 'processing': return <Badge className="bg-emerald-500 animate-pulse">Enviando</Badge>;
      case 'completed': return <Badge className="bg-blue-600">Finalizada</Badge>;
      case 'failed': return <Badge variant="destructive">Fallida</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campañas de WhatsApp</h1>
          <p className="text-sm text-slate-500">Crea y gestiona envíos masivos para tus clientes</p>
        </div>
        
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Nueva Campaña
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Campaña</DialogTitle>
              <DialogDescription>
                Configura los detalles de tu envío masivo. El costo se descontará de tu Wallet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-700 font-bold">Nombre de la campaña</Label>
                <Input 
                  id="name" 
                  placeholder="Ej: TEST_CAMPAIGN_5" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-slate-200"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-700 font-bold">Cuenta de envío (WABA + Phone ID)</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Selecciona un número CONNECTED" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter((a: any) => a.nova_status === 'ASSIGNED' && a.status === 'connected').map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        <div className="flex flex-col">
                          <span className="font-bold">{acc.alias}</span>
                          <span className="text-[10px] text-slate-500">{acc.displayPhone || acc.phoneNumberId}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAccount && (
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 border border-slate-100 flex flex-col gap-0.5">
                    <span>WABA ID: {selectedAccount.businessAccountId || (selectedAccount as any).business_account_id}</span>
                    <span>Phone ID: {selectedAccount.phoneNumberId || (selectedAccount as any).phone_number_id}</span>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-700 font-bold">Plantilla (APPROVED)</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Selecciona una plantilla validada" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedTemplates.map((tpl: any) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.language.toUpperCase()})
                      </SelectItem>
                    ))}
                    {approvedTemplates.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500 italic">
                        No hay plantillas aprobadas disponibles.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div className="mt-1 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-[10px] text-blue-700 font-medium italic">
                    <p>{selectedTemplate.body}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-700 font-bold">Destinatarios</Label>
                  <Badge variant="outline" className="text-[10px] bg-slate-50">
                    {recipientStats.total} ingresados
                  </Badge>
                </div>
                <Textarea 
                  placeholder="Escribe o pega números (uno por línea)..."
                  className="min-h-[100px] font-mono text-sm border-slate-200 focus-visible:ring-emerald-500"
                  value={manualPhones}
                  onChange={(e) => setManualPhones(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[9px] gap-1">
                    <Check className="h-2.5 w-2.5" /> {recipientStats.valid} válidos
                  </Badge>
                  {recipientStats.duplicates > 0 && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 text-[9px] gap-1 bg-amber-50">
                      <Zap className="h-2.5 w-2.5" /> {recipientStats.duplicates} duplicados
                    </Badge>
                  )}
                  {recipientStats.invalid > 0 && (
                    <Badge variant="destructive" className="text-[9px] gap-1 px-1.5 py-0">
                      <AlertTriangle className="h-2.5 w-2.5" /> {recipientStats.invalid} inválidos
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white shadow-lg space-y-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Validación Pre-Envío</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                  <div className="text-slate-400">Destinatarios finales:</div>
                  <div className="text-right font-bold text-white">{recipientStats.valid}</div>
                  
                  <div className="text-slate-400">Costo Estimado:</div>
                  <div className="text-right font-bold text-emerald-400">{formatCurrency(costData.cost)}</div>
                  
                  <div className="text-slate-400">Saldo Actual:</div>
                  <div className="text-right font-medium text-slate-300">{formatCurrency(costData.currentBalance)}</div>
                  
                  <div className="text-slate-400 border-t border-white/5 pt-1">Saldo Proyectado:</div>
                  <div className={`text-right font-bold border-t border-white/5 pt-1 ${costData.isOverBalance ? 'text-red-400' : 'text-slate-200'}`}>
                    {formatCurrency(costData.projectedBalance)}
                  </div>
                </div>

                {costData.isOverBalance && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 py-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <AlertDescription className="text-[10px] text-red-400 font-bold ml-1">
                      Saldo insuficiente para ejecutar esta campaña
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex items-start gap-2 text-[9px] text-slate-500 bg-black/20 p-2 rounded-lg italic">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>El envío se procesará en segundo plano (Server-side Jobs). No es necesario mantener esta ventana abierta.</span>
                </div>
              </div>
            </div>

            <DialogFooter className="bg-slate-50/50 p-4 -mx-6 -mb-6 border-t rounded-b-lg">
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)} disabled={isValidating}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={createCampaign.isPending || startCampaign.isPending || costData.isOverBalance || recipientStats.valid === 0}
                className="bg-slate-900 hover:bg-black text-white px-8"
              >
                {createCampaign.isPending || startCampaign.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Iniciar Campaña Real
                  </>
                )}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Campañas</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">{campaigns?.length || 0}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <LayoutTemplate className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Disponible</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(myWallet?.balance || 0)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mensajes Enviados</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">
                  {campaigns?.reduce((acc, c) => acc + (c.total_sent || 0), 0) || 0}
                </h3>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nombre de campaña..." 
                className="pl-9 bg-slate-50/50 border-none focus-visible:ring-emerald-500" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 border-slate-200">
                <Filter className="h-3.5 w-3.5" /> Filtrar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
              <p className="text-sm">Cargando historial de campañas...</p>
            </div>
          ) : filteredCampaigns?.length === 0 ? (
            <div className="py-24 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 mb-4 border border-slate-100">
                <LayoutTemplate className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Sin campañas activas</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                Comienza a enviar mensajes masivos a tus clientes creando tu primera campaña.
              </p>
              <Button 
                variant="outline" 
                className="mt-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                onClick={() => setIsNewDialogOpen(true)}
              >
                Crear mi primera campaña
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-slate-400 font-medium bg-slate-50/30">
                    <th className="text-left py-3 px-4 uppercase tracking-wider text-[10px]">Campaña</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider text-[10px]">Estado</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider text-[10px]">Progreso</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider text-[10px]">Fecha creación</th>
                    <th className="text-right py-3 px-4 uppercase tracking-wider text-[10px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCampaigns?.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                          <Badge variant="outline" className="px-1.5 py-0 h-4 text-[9px] border-slate-200 text-slate-400">
                            {c.whatsapp_accounts?.alias || 'S/A'}
                          </Badge>
                          <span className="opacity-50">•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {c.whatsapp_templates?.name || 'Plantilla'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-900">{c.total_sent || 0} <span className="text-slate-400 font-normal">/ {c.total_recipients || 0}</span></span>
                            <span className="text-emerald-600">{Math.round(((c.total_sent || 0) / (c.total_recipients || 1)) * 100)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                              style={{ width: `${((c.total_sent || 0) / (c.total_recipients || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-900 font-medium">
                          {format(new Date(c.created_at), "d 'de' MMM", { locale: es })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {format(new Date(c.created_at), "HH:mm")}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-slate-600">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2">
                              <BarChart3 className="h-4 w-4" /> Ver Reporte
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <UserPlus className="h-4 w-4" /> Destinatarios
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  );
}