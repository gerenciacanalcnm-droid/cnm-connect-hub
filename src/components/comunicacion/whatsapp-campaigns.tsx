import { useState } from "react";
import { 
  Plus, 
  LayoutTemplate, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  BarChart3,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useWhatsAppCampaigns } from "@/hooks/use-whatsapp-campaigns";
import { useMyWallet } from "@/hooks/use-commercial";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function WhatsAppCampaigns() {
  const { data: myWallet } = useMyWallet("whatsapp");
  const companyId = myWallet?.company_id;
  const { data: campaigns, isLoading } = useWhatsAppCampaigns(companyId);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCampaigns = campaigns?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Borrador</Badge>;
      case 'scheduled': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Programada</Badge>;
      case 'running': return <Badge className="bg-emerald-500">En curso</Badge>;
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Campaña
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Campañas</p>
                <h3 className="text-2xl font-bold mt-1">{campaigns?.length || 0}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <LayoutTemplate className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Saldo Disponible</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(myWallet?.balance || 0)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Mensajes Enviados</p>
                <h3 className="text-2xl font-bold mt-1">
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar campaña..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Cargando campañas...</div>
          ) : filteredCampaigns?.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                <LayoutTemplate className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Sin campañas</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                Aún no has creado ninguna campaña de WhatsApp masiva.
              </p>
              <Button variant="outline" className="mt-6">
                Crear mi primera campaña
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-slate-500 font-medium">
                    <th className="text-left pb-3 pl-2">Campaña</th>
                    <th className="text-left pb-3">Estado</th>
                    <th className="text-left pb-3">Progreso</th>
                    <th className="text-left pb-3">Fecha</th>
                    <th className="text-right pb-3 pr-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCampaigns?.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <LayoutTemplate className="h-3 w-3" />
                          {c.whatsapp_templates?.name || 'Texto Libre'}
                        </div>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{c.total_sent || 0} / {c.total_recipients || 0}</span>
                            <span>{Math.round(((c.total_sent || 0) / (c.total_recipients || 1)) * 100)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all" 
                              style={{ width: `${((c.total_sent || 0) / (c.total_recipients || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-slate-600">
                          {format(new Date(c.created_at), "d 'de' MMMM", { locale: es })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {format(new Date(c.created_at), "HH:mm")}
                        </div>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem>Duplicar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
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
