import { useState, useRef, useEffect } from "react";
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
  Type,
  Image as ImageIcon,
  Video,
  File as FileIcon,
  MousePointer2,
  Trash2,
  Variable
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
  headerType: z.enum(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]),
  headerText: z.string().optional(),
  headerHandle: z.string().optional(),
  body: z.string().min(1, "El cuerpo del mensaje es requerido"),
  footer: z.string().optional(),
  buttons: z.array(z.object({
    type: z.enum(["QUICK_REPLY", "URL", "PHONE"]),
    text: z.string().min(1),
    url: z.string().optional(),
    phoneNumber: z.string().optional(),
  })).max(10).optional(),
});

export function WhatsAppTemplates() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [selectedComponent, setSelectedComponent] = useState<'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const { data: templates = [], isLoading } = useWhatsAppTemplates();
  const { data: accounts = [] } = useWhatsAppAccounts();
  const syncMutation = useSyncWhatsAppTemplates();
  const saveMutation = useSaveWhatsAppTemplate();
  const submitMutation = useSubmitWhatsAppTemplateToMeta();
  
  const connectedAccount = accounts.find(a => a.status === 'connected');

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: `template_${Date.now()}`,
      category: "MARKETING",
      language: "es",
      headerType: "NONE",
      headerText: "",
      body: "",
      footer: "",
      buttons: [],
    },
    mode: "onChange"
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
      const variables = values.body.match(/\{\{\d+\}\}/g)?.map(v => v.replace(/[\{\}]/g, "")) || [];
      
      const payload: any = {
        name: values.name,
        category: values.category,
        language: values.language,
        body: values.body,
        footer: values.footer,
        buttons: values.buttons,
        variables,
        metadata: {
          header_type: values.headerType,
          header_text: values.headerText,
          header_handle: values.headerHandle
        }
      };

      await saveMutation.mutateAsync(payload);
      
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
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="p-6 border-b">
                <DialogTitle>Editor Visual de Plantilla</DialogTitle>
                <DialogDescription>Configura los componentes de tu plantilla y previsualiza el resultado.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-1 overflow-hidden">
                {/* IZQUIERDA: Componentes */}
                <div className="w-64 border-r p-4 space-y-4">
                  <h4 className="font-semibold text-sm">COMPONENTES</h4>
                  <div className="grid gap-2">
                    <Button variant="outline" className="justify-start gap-2" onClick={() => setSelectedComponent("HEADER")}>
                      <Type className="h-4 w-4" /> + Encabezado
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" onClick={() => setSelectedComponent("BODY")}>
                      <FileText className="h-4 w-4" /> + Cuerpo
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" onClick={() => setSelectedComponent("FOOTER")}>
                      <Type className="h-4 w-4" /> + Pie de página
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" onClick={() => setSelectedComponent("BUTTONS")}>
                      <MousePointer2 className="h-4 w-4" /> + Botón
                    </Button>
                  </div>
                </div>

                {/* CENTRO: Preview */}
                <div className="flex-1 bg-slate-50 p-8 flex flex-col items-center overflow-y-auto">
                   <div className="bg-[#E7FFDB] rounded-lg shadow-sm w-full max-w-sm p-3 relative space-y-2 border border-slate-200">
                    {form.watch("headerType") !== "NONE" && (
                      <div className="font-bold text-sm border-b pb-1">
                        {form.watch("headerType") === "TEXT" ? (form.watch("headerText") || "Texto del encabezado") : "Archivo adjunto..."}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {(() => {
                        try {
                          const body = form.watch("body") || "Cuerpo del mensaje...";
                          // Replace {{n}} with real examples if provided, otherwise default to "Ejemplo"
                          return body.replace(/\{\{(\d+)\}\}/g, (match, number) => {
                            const examples: Record<string, string> = {
                              "1": "Juan",
                              "2": "12345",
                              "3": "Bogotá",
                              "4": "Premium"
                            };
                            return examples[number] || `[Variable ${number}]`;
                          });
                        } catch (e) {
                          return "Error en preview de cuerpo";
                        }
                      })()}
                    </div>
                    {form.watch("footer") && (
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-black/10">{form.watch("footer")}</div>
                    )}
                    {(() => {
                      try {
                        const buttons = form.watch("buttons");
                        return buttons?.map((b: any, i: number) => (
                          <div key={i} className="bg-white text-blue-600 text-sm py-1 rounded border text-center shadow-sm font-medium">
                            {b?.text || "Botón sin texto"}
                          </div>
                        ));
                      } catch (e) {
                        return <div className="text-xs text-destructive">Error en botones</div>;
                      }
                    })()}
                   </div>
                </div>
                
                {/* DERECHA: Configuración */}
                <div className="w-80 p-6 border-l overflow-y-auto space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-2 mb-4">
                    <h4 className="font-semibold text-sm">CONFIGURACIÓN</h4>
                    {selectedComponent && (
                      <Badge variant="outline" className="text-[10px] bg-slate-100 uppercase font-mono">
                        {selectedComponent}
                      </Badge>
                    )}
                  </div>
                  {!selectedComponent && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 opacity-70">
                      <MousePointer2 className="h-12 w-12 mb-4 text-emerald-500 animate-pulse" />
                      <p className="text-sm font-medium">Editor completado</p>
                    </div>
                  )}

                  <Form {...form}>
                    <form className="space-y-6">
                      {selectedComponent === "HEADER" && (
                        <div className="space-y-4">
                          <FormField control={form.control} name="headerType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de encabezado</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NONE">Sin encabezado</SelectItem>
                                  <SelectItem value="TEXT">Texto</SelectItem>
                                  <SelectItem value="IMAGE">Imagen</SelectItem>
                                  <SelectItem value="VIDEO">Video</SelectItem>
                                  <SelectItem value="DOCUMENT">Documento</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          {form.watch("headerType") === "TEXT" && (
                            <FormField control={form.control} name="headerText" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contenido del encabezado</FormLabel>
                                <FormControl><Input {...field} placeholder="Máx. 60 caracteres" maxLength={60} /></FormControl>
                              </FormItem>
                            )} />
                          )}
                          {["IMAGE", "VIDEO", "DOCUMENT"].includes(form.watch("headerType")) && (
                            <div className="p-4 bg-muted rounded-lg border text-xs text-muted-foreground flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              El archivo se especificará al momento del envío.
                            </div>
                          )}
                        </div>
                      )}

                      {selectedComponent === "BODY" && (
                        <div className="space-y-4">
                          <FormField control={form.control} name="body" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cuerpo del mensaje</FormLabel>
                              <FormControl>
                                <Textarea {...field} ref={bodyRef} className="h-48 resize-none" placeholder="Escribe aquí tu mensaje..." />
                              </FormControl>
                              <Button 
                                type="button"
                                size="sm" 
                                variant="outline" 
                                className="w-full mt-2 gap-2" 
                                onClick={() => {
                                  const textarea = bodyRef.current;
                                  if (!textarea) return;
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const text = form.getValues("body");
                                  const variables = (text.match(/\{\{\d+\}\}/g) || []);
                                  const nextIndex = variables.length + 1;
                                  const insertion = `{{${nextIndex}}}`;
                                  const newText = text.substring(0, start) + insertion + text.substring(end);
                                  form.setValue("body", newText, { shouldValidate: true });
                                  
                                  setTimeout(() => {
                                    textarea.focus();
                                    const newPos = start + insertion.length;
                                    textarea.setSelectionRange(newPos, newPos);
                                  }, 0);
                                }}
                              >
                                <Variable className="h-4 w-4" /> Insertar variable
                              </Button>
                              <FormDescription>Máximo 1024 caracteres.</FormDescription>
                            </FormItem>
                          )} />
                          
                          {/* Variables detectadas */}
                          <div className="space-y-2 pt-2">
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variables Detectadas</h5>
                            {(form.watch("body").match(/\{\{\d+\}\}/g) || []).map((v, i) => (
                              <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded border text-sm">
                                <Badge variant="outline" className="bg-indigo-50 font-mono text-indigo-600 border-indigo-200">{v}</Badge>
                                <span className="text-xs text-muted-foreground">Ejemplo: [Valor real]</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedComponent === "FOOTER" && (
                        <FormField control={form.control} name="footer" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pie de página (opcional)</FormLabel>
                            <FormControl><Input {...field} placeholder="Máx. 60 caracteres" maxLength={60} /></FormControl>
                            <FormDescription>Texto pequeño al final del mensaje.</FormDescription>
                          </FormItem>
                        )} />
                      )}

                      {selectedComponent === "BUTTONS" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <FormLabel>Botones ({form.watch("buttons")?.length || 0}/10)</FormLabel>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 text-xs gap-1"
                              disabled={(form.watch("buttons")?.length || 0) >= 10}
                              onClick={() => {
                                const current = form.getValues("buttons") || [];
                                form.setValue("buttons", [...current, { type: "QUICK_REPLY", text: "Nueva respuesta" }]);
                              }}
                            >
                              <Plus className="h-3 w-3" /> Agregar
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {form.watch("buttons")?.map((button, index) => {
                              if (!button) return null;
                              return (
                                <div key={index} className="p-3 bg-slate-50 rounded-lg border space-y-3 relative group">
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      const current = form.getValues("buttons") || [];
                                      form.setValue("buttons", current.filter((_, i) => i !== index));
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                  <FormField control={form.control} name={`buttons.${index}.type`} render={({ field }) => (
                                    <FormItem>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="QUICK_REPLY">Respuesta rápida</SelectItem>
                                          <SelectItem value="URL">Enlace (URL)</SelectItem>
                                          <SelectItem value="PHONE">Teléfono</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )} />
                                  <FormField control={form.control} name={`buttons.${index}.text`} render={({ field }) => (
                                    <FormItem>
                                      <FormControl><Input {...field} placeholder="Texto del botón" className="h-8 text-xs" /></FormControl>
                                    </FormItem>
                                  )} />
                                  {button.type === "URL" && (
                                    <FormField control={form.control} name={`buttons.${index}.url`} render={({ field }) => (
                                      <FormItem>
                                        <FormControl><Input {...field} placeholder="https://..." className="h-8 text-xs" /></FormControl>
                                      </FormItem>
                                    )} />
                                  )}
                                  {button.type === "PHONE" && (
                                    <FormField control={form.control} name={`buttons.${index}.phoneNumber`} render={({ field }) => (
                                      <FormItem>
                                        <FormControl><Input {...field} placeholder="+54 11..." className="h-8 text-xs" /></FormControl>
                                      </FormItem>
                                    )} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </div>
              <DialogFooter className="p-6 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={form.handleSubmit(onSubmit)}>Guardar borrador</Button>
                <Button className="bg-emerald-600" onClick={async () => {
                  try {
                    const isValid = await form.trigger();
                    if (!isValid) return;

                    const val = form.getValues();
                    const variables = val.body.match(/\{\{\d+\}\}/g)?.map(v => v.replace(/[\{\}]/g, "")) || [];
                    const payload: any = {
                      name: val.name,
                      category: val.category,
                      language: val.language,
                      body: val.body,
                      footer: val.footer,
                      buttons: val.buttons,
                      variables,
                      metadata: {
                        header_type: val.headerType,
                        header_text: val.headerText,
                        header_handle: val.headerHandle
                      }
                    };
                    const saved = await saveMutation.mutateAsync(payload) as any;
                    if (saved?.id) await handleSubmitToMeta(saved.id);
                    setIsCreateOpen(false);
                    form.reset();
                  } catch (err) {
                    // Handled by mutation toast
                  }
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
