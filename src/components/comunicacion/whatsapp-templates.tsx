import { useState } from "react";
import { 
  FileText, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PauseCircle,
  MoreVertical,
  ExternalLink,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWhatsAppTemplates, useSyncWhatsAppTemplates, useWhatsAppAccounts } from "@/hooks/use-whatsapp";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function WhatsAppTemplates() {
  const [search, setSearch] = useState("");
  const { data: templates = [], isLoading } = useWhatsAppTemplates();
  const { data: accounts = [] } = useWhatsAppAccounts();
  const syncMutation = useSyncWhatsAppTemplates();
  
  const connectedAccount = accounts.find(a => a.status === 'connected');

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSync = async () => {
    if (!connectedAccount) {
      return toast.error("No hay una cuenta de WhatsApp conectada para sincronizar.");
    }
    try {
      await syncMutation.mutateAsync(connectedAccount.id);
      toast.success("Plantillas sincronizadas correctamente desde Meta.");
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar plantillas");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Aprobada</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Rechazada</Badge>;
      case "PAUSED":
        return <Badge variant="secondary" className="gap-1 text-muted-foreground"><PauseCircle className="h-3 w-3" /> Pausada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            Plantillas de WhatsApp
          </h3>
          <p className="text-sm text-muted-foreground">
            Sincroniza y gestiona las plantillas oficiales aprobadas por Meta.
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncMutation.isPending || !connectedAccount}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={syncMutation.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Sincronizar con Meta
        </Button>
      </div>

      {!connectedAccount && (
        <Alert variant="destructive" className="bg-destructive/10 border-none">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cuenta no conectada</AlertTitle>
          <AlertDescription>
            Debes tener una cuenta de WhatsApp Business configurada y activa para sincronizar plantillas.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o categoría..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última actualización</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Cargando plantillas...</TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron plantillas. Haz clic en sincronizar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase">{template.id.split('-')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{template.category.toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs uppercase font-medium px-2 py-0.5 rounded bg-muted">
                          {template.language}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(template.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {template.updatedAt ? format(new Date(template.updatedAt), "dd MMM yyyy, HH:mm", { locale: es }) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Info className="h-4 w-4" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <ExternalLink className="h-4 w-4" /> Ver en Meta Business
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[13px] text-emerald-800">
        <Info className="h-4 w-4 shrink-0" />
        <p>
          Meta Cloud API es la única fuente de verdad. SMS CNM solo sincroniza y muestra el estado actual de tus plantillas para ser utilizadas en envíos.
        </p>
      </div>
    </div>
  );
}
