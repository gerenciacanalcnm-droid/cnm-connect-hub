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
  Info,
  Plus,
  Send,
  Eye,
  Type
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  useWhatsAppTemplates, 
  useSyncWhatsAppTemplates, 
  useWhatsAppAccounts,
  useSaveWhatsAppTemplate,
  useSubmitWhatsAppTemplateToMeta
} from "@/hooks/use-whatsapp";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guiones bajos"),
  category: z.string().min(1, "La categoría es requerida"),
  language: z.string().min(1, "El idioma es requerido"),
  header: z.string().optional(),
  body: z.string().min(1, "El cuerpo del mensaje es requerido"),
  footer: z.string().optional(),
});

export function WhatsAppTemplates() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);

  const { data: templates = [], isLoading } = useWhatsAppTemplates();
  const { data: accounts = [] } = useWhatsAppAccounts();
  const syncMutation = useSyncWhatsAppTemplates();
  const saveMutation = useSaveWhatsAppTemplate();
  const submitMutation = useSubmitWhatsAppTemplateToMeta();
  
  const connectedAccount = accounts.find(a => a.status === 'connected');

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      category: "MARKETING",
      language: "es",
      header: "",
      body: "",
      footer: "",
    },
  });

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSync = async () => {
    if (!connectedAccount) {
      return toast.error("Conecta primero una cuenta de WhatsApp Business para enviar esta plantilla a Meta.");
    }
    try {
      await syncMutation.mutateAsync(connectedAccount.id);
      toast.success("Plantillas sincronizadas correctamente desde Meta.");
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar plantillas");
    }
  };

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    try {
      // Extraer variables del body {{1}}, {{2}}, etc.
      const variables = values.body.match(/\{\{\d+\}\}/g)?.map(v => v.replace(/[\{\}]/g, "")) || [];
      
      await saveMutation.mutateAsync({
        ...values,
        variables,
      });
      
      toast.success("Plantilla guardada localmente.");
      setIsCreateOpen(false);
      form.reset();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la plantilla");
    }
  };

  const handleSubmitToMeta = async (id: string) => {
    try {
      if (!connectedAccount) {
        return toast.error("Conecta primero una cuenta de WhatsApp Business para enviar esta plantilla a Meta.");
      }
      await submitMutation.mutateAsync(id);
      toast.success("Plantilla enviada a Meta para aprobación.");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar a Meta");
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

  const previewValues = form.watch();

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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Crear plantilla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="p-6 border-b">
                <DialogTitle>Editor Visual de Plantilla</DialogTitle>
                <DialogDescription>Configura los componentes de tu plantilla y previsualiza el resultado.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-1 overflow-hidden">
                {/* IZQUIERDA: Configuración */}
                <div className="w-1/3 border-r p-6 overflow-y-auto space-y-4">
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="category" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MARKETING">Marketing</SelectItem>
                                <SelectItem value="UTILITY">Utilidad</SelectItem>
                                <SelectItem value="AUTHENTICATION">Autenticación</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="language" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Idioma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="en">Inglés</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="header" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Encabezado (Texto)</FormLabel>
                          <FormControl><Input {...field} placeholder="Opcional..." /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="body" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuerpo</FormLabel>
                          <FormControl><Textarea className="h-32" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="footer" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pie de página</FormLabel>
                          <FormControl><Input {...field} placeholder="Opcional..." /></FormControl>
                        </FormItem>
                      )} />
                    </form>
                  </Form>
                </div>
                {/* CENTRO: Preview */}
                <div className="w-1/3 bg-slate-100 p-8 flex items-center justify-center">
                  <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-4 space-y-2 border border-slate-200">
                    {previewValues.header && <div className="font-bold text-sm border-b pb-1">{previewValues.header}</div>}
                    <div className="text-sm whitespace-pre-wrap">{previewValues.body || "Cuerpo del mensaje..."}</div>
                    {previewValues.footer && <div className="text-[11px] text-slate-500 pt-1">{previewValues.footer}</div>}
                  </div>
                </div>
                {/* DERECHA: Botones y Variables */}
                <div className="w-1/3 p-6 border-l overflow-y-auto space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Variables Detectadas</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(previewValues.body.match(/\{\{\d+\}\}/g) || []).map((v, i) => (
                        <Badge key={i} variant="outline" className="bg-indigo-50">{v}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={form.handleSubmit(onSubmit)}>Guardar borrador</Button>
                <Button className="bg-emerald-600" onClick={async () => {
                  const val = form.getValues();
                  const variables = val.body.match(/\{\{\d+\}\}/g)?.map(v => v.replace(/[\{\}]/g, "")) || [];
                  const saved = await saveMutation.mutateAsync({ ...val, variables }) as any;
                  if (saved?.id) await handleSubmitToMeta(saved.id);
                  setIsCreateOpen(false);
                }}>Enviar a Meta</Button>
              </DialogFooter>
            </DialogContent>

          </Dialog>

          <Button 
            onClick={handleSync} 
            disabled={syncMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={syncMutation.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sincronizar con Meta
          </Button>
        </div>
      </div>

      <Alert variant="destructive" className={`bg-destructive/10 border-none ${connectedAccount ? 'hidden' : ''}`}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Cuenta no conectada</AlertTitle>
        <AlertDescription>
          Debes tener una cuenta de WhatsApp Business configurada y activa para sincronizar plantillas.
        </AlertDescription>
      </Alert>

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
                      No se encontraron plantillas. Crea una nueva o sincroniza con Meta.
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
                      <TableCell>{getStatusBadge(template.status || "draft")}</TableCell>
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
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => {
                                setCurrentTemplate(template);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" /> Previsualizar
                            </DropdownMenuItem>
                            {template.status === "draft" && (
                              <DropdownMenuItem 
                                className="gap-2 text-emerald-600 focus:text-emerald-700"
                                onClick={() => handleSubmitToMeta(template.id)}
                              >
                                <Send className="h-4 w-4" /> Enviar a Meta
                              </DropdownMenuItem>
                            )}
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
      
      {/* Modal de Previsualización */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Plantilla</DialogTitle>
            <DialogDescription>
              {currentTemplate?.name} - {currentTemplate?.category}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-100 rounded-lg p-6 border border-slate-200 max-w-sm mx-auto w-full relative">
              <div className="bg-white rounded-lg shadow-sm p-4 space-y-2 text-sm border-l-4 border-l-emerald-500">
                {currentTemplate?.header && (
                  <div className="font-bold border-b pb-2 text-slate-800 flex items-center gap-2">
                    <Type className="h-3 w-3 text-slate-400" />
                    {currentTemplate.header}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-slate-700 py-1">
                  {currentTemplate?.body}
                </div>
                {currentTemplate?.footer && (
                  <div className="text-[11px] text-slate-500 pt-2 border-t mt-2">
                    {currentTemplate.footer}
                  </div>
                )}
              </div>
            </div>
            
            {currentTemplate?.variables && currentTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Variables detectadas</h4>
                <div className="flex flex-wrap gap-2">
                  {currentTemplate.variables.map((v: string) => (
                    <Badge key={v} variant="secondary">{"{{" + v + "}}"}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block">Idioma</span>
                <span className="font-medium uppercase">{currentTemplate?.language}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">Estado</span>
                <span className="font-medium">{currentTemplate?.status}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            {currentTemplate?.status === "draft" && (
              <Button 
                onClick={() => {
                  handleSubmitToMeta(currentTemplate.id);
                  setIsPreviewOpen(false);
                }}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar para aprobación
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[13px] text-emerald-800">
        <Info className="h-4 w-4 shrink-0" />
        <p>
          Las plantillas creadas aquí se guardan como borradores. Debes enviarlas a Meta para su revisión y aprobación oficial antes de poder enviarlas a tus contactos.
        </p>
      </div>
    </div>
  );
}
