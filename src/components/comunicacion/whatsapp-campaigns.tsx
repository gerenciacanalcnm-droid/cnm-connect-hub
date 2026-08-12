import { useState, useMemo } from "react";
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
  UserPlus
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
import { useWhatsAppCampaigns, useCreateWhatsAppCampaign } from "@/hooks/use-whatsapp-campaigns";
import { useWhatsAppAccounts, useWhatsAppTemplates } from "@/hooks/use-whatsapp";
import { useMyWallet } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export function WhatsAppCampaigns() {
  const { data: myWallet } = useMyWallet("whatsapp");
  const companyId = myWallet?.company_id;
  const { data: campaigns, isLoading } = useWhatsAppCampaigns(companyId);
  const { data: accounts = [] } = useWhatsAppAccounts(companyId);
  const { data: allTemplates = [] } = useWhatsAppTemplates(companyId);
  const createCampaign = useCreateWhatsAppCampaign();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [manualPhones, setManualPhones] = useState("");
  
  const approvedTemplates = useMemo(() => 
    allTemplates.filter((t: any) => t.status === 'APPROVED'),
  [allTemplates]);

  const selectedTemplate = useMemo(() => 
    approvedTemplates.find((t: any) => t.id === selectedTemplateId),
  [approvedTemplates, selectedTemplateId]);

  const filteredCampaigns = campaigns?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!companyId) return;
    if (!name || !selectedAccountId || !selectedTemplateId || !manualPhones) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    const phones = manualPhones
      .split(/[\n,]/)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    if (phones.length === 0) {
      toast.error("Ingresa al menos un número de teléfono válido");
      return;
    }

    try {
      await createCampaign.mutateAsync({
        companyId,
        accountId: selectedAccountId,
        templateId: selectedTemplateId,
        name,
        recipients: phones.map(phone => ({ phone })),
        estimatedCost: phones.length * 0.05 // Mock cost calculation
      });
      
      toast.success("Campaña encolada correctamente");
      setIsNewDialogOpen(false);
      // Reset form
      setName("");
      setSelectedTemplateId("");
      setManualPhones("");
    } catch (error: any) {
      toast.error(error.message || "Error al crear la campaña");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Borrador</Badge>;
      case 'scheduled': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Programada</Badge>;
      case 'queued': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">En cola</Badge>;
      case 'processing': return <Badge className="bg-emerald-500 animate-pulse">Procesando</Badge>;
      case 'completed': return <Badge className="bg-blue-600">Completada</Badge>;
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
                <Label htmlFor="name">Nombre de la campaña</Label>
                <Input 
                  id="name" 
                  placeholder="Ej: Ofertas de Verano 2024" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Cuenta de envío</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un número de WhatsApp" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter((a: any) => a.nova_status === 'ASSIGNED').map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.alias} ({acc.displayPhone || acc.phoneNumberId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Plantilla</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una plantilla aprobada" />
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
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-dashed text-xs text-slate-600 italic">
                    <p>{selectedTemplate.body}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Destinatarios</Label>
                  <Badge variant="outline" className="text-[10px]">
                    {manualPhones.split(/[\n,]/).filter(p => p.trim().length > 5).length} números
                  </Badge>
                </div>
                <Textarea 
                  placeholder="Pega aquí los números de teléfono (uno por línea o separados por coma)..."
                  className="min-h-[120px] font-mono text-sm"
                  value={manualPhones}
                  onChange={(e) => setManualPhones(e.target.value)}
                />
                <p className="text-[10px] text-slate-400">
                  Formato internacional recomendado: +573001234567
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Resumen de Campaña</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Costo estimado: <span className="font-bold">{formatCurrency((manualPhones.split(/[\n,]/).filter(p => p.trim().length > 5).length) * 0.05)}</span>
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    Tu saldo actual en Wallet: {formatCurrency(myWallet?.balance || 0)}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={createCampaign.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {createCampaign.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Encolando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Lanzar Campaña
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