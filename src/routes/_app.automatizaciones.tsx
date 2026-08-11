import { createFileRoute } from "@tanstack/react-router";
import { Zap, Plus, Play, Pause, Trash2, History, Settings2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAutomationsStore, Automation, AutomationStatus } from "@/hooks/use-automations";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const automationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  status: z.enum(["ACTIVA", "PAUSADA", "BORRADOR"]),
  channel: z.string().optional(),
  trigger_type: z.string().min(1, "El disparador es obligatorio"),
  action_type: z.string().min(1, "La acción es obligatoria"),
});

type AutomationFormValues = z.infer<typeof automationSchema>;

export const Route = createFileRoute("/_app/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones · SMS CNM" }] }),
  component: AutomationsPage,
});

function AutomationsPage() {
  const { automations, isLoading, fetchAutomations, saveAutomation, removeAutomation, updateStatus, getLogs } = useAutomationsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "BORRADOR",
      channel: "WhatsApp",
      trigger_type: "whatsapp_message",
      action_type: "send_whatsapp",
    },
  });

  const onSubmit = async (values: AutomationFormValues) => {
    try {
      await saveAutomation({
        id: selectedAutomation?.id,
        name: values.name,
        description: values.description,
        status: values.status as AutomationStatus,
        channel: values.channel,
        trigger_config: { type: values.trigger_type },
        actions_config: [{ type: values.action_type }],
      });
      
      toast.success(selectedAutomation ? "Automatización actualizada" : "Automatización creada");
      setIsDialogOpen(false);
      setSelectedAutomation(null);
      form.reset();
    } catch (error) {
      toast.error("Error al guardar la automatización");
    }
  };

  const handleEdit = (automation: Automation) => {
    setSelectedAutomation(automation);
    form.reset({
      name: automation.name,
      description: automation.description || "",
      status: automation.status,
      channel: automation.channel || "WhatsApp",
      trigger_type: automation.trigger_config.type || "whatsapp_message",
      action_type: automation.actions_config[0]?.type || "send_whatsapp",
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (automation: Automation) => {
    const newStatus = automation.status === "ACTIVA" ? "PAUSADA" : "ACTIVA";
    try {
      await updateStatus(automation.id, newStatus);
      toast.success(`Automatización ${newStatus === 'ACTIVA' ? 'activada' : 'pausada'}`);
    } catch (error) {
      toast.error("Error al cambiar el estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta automatización?")) {
      try {
        await removeAutomation(id);
        toast.success("Automatización eliminada");
      } catch (error) {
        toast.error("Error al eliminar");
      }
    }
  };

  const handleViewLogs = async (automation: Automation) => {
    setSelectedAutomation(automation);
    setIsLogsOpen(true);
    setIsLoadingLogs(true);
    try {
      const result = await getLogs(automation.id);
      setLogs(result.rows);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Automatizaciones" 
        description="Gestiona tus flujos de comunicación inteligente."
        icon={Zap}
      >
        <Button onClick={() => {
          setSelectedAutomation(null);
          form.reset();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva automatización
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Disparador / Acción</TableHead>
                <TableHead>Última ejecución</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : automations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No tienes automatizaciones creadas.
                  </TableCell>
                </TableRow>
              ) : (
                automations.map((automation) => (
                  <TableRow key={automation.id}>
                    <TableCell className="font-medium">
                      <div>{automation.name}</div>
                      <div className="text-xs text-muted-foreground">{automation.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        automation.status === 'ACTIVA' ? 'success' : 
                        automation.status === 'PAUSADA' ? 'warning' : 'outline'
                      }>
                        {automation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{automation.channel || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-primary font-semibold">{automation.trigger_config.type}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-muted-foreground">{automation.actions_config[0]?.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {automation.last_executed_at 
                        ? format(new Date(automation.last_executed_at), "dd MMM HH:mm", { locale: es })
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewLogs(automation)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(automation)}>
                          {automation.status === 'ACTIVA' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(automation)}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(automation.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAutomation ? "Editar automatización" : "Nueva automatización"}</DialogTitle>
            <DialogDescription>
              Define el flujo de trabajo para tu automatización inteligente.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Bienvenida Clientes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado inicial</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BORRADOR">Borrador</SelectItem>
                          <SelectItem value="ACTIVA">Activa</SelectItem>
                          <SelectItem value="PAUSADA">Pausada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe qué hace este flujo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs defaultValue="trigger" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="trigger">Disparador</TabsTrigger>
                  <TabsTrigger value="conditions">Condiciones</TabsTrigger>
                  <TabsTrigger value="actions">Acciones</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trigger" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="trigger_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>¿Cuándo se ejecuta?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona disparador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="whatsapp_message">Nuevo mensaje WhatsApp</SelectItem>
                            <SelectItem value="new_contact">Nuevo contacto CRM</SelectItem>
                            <SelectItem value="contact_updated">Contacto actualizado</SelectItem>
                            <SelectItem value="conversation_started">Conversación iniciada</SelectItem>
                            <SelectItem value="conversation_closed">Conversación cerrada</SelectItem>
                            <SelectItem value="scheduled">Programado (Recurrente)</SelectItem>
                            <SelectItem value="crm_event">Evento CRM personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          El evento que iniciará este flujo de trabajo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="conditions" className="pt-4">
                  <div className="bg-muted p-4 rounded-lg text-center text-sm text-muted-foreground border border-dashed">
                    <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>Las condiciones básicas (Campo = Valor) están habilitadas en el motor.</p>
                    <p className="mt-1">Configuración manual vía JSON soportada en esta fase.</p>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="action_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>¿Qué acción ejecutar?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona acción" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="send_whatsapp">Enviar WhatsApp</SelectItem>
                            <SelectItem value="send_sms">Enviar SMS</SelectItem>
                            <SelectItem value="assign_agent">Asignar asesor</SelectItem>
                            <SelectItem value="change_status">Cambiar estado conversación</SelectItem>
                            <SelectItem value="add_tag">Agregar etiqueta CRM</SelectItem>
                            <SelectItem value="notify_user">Notificar usuario (Push/Internal)</SelectItem>
                            <SelectItem value="execute_nova">Ejecutar CNM Nova (IA)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          La acción que se realizará cuando se cumplan las condiciones.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar automatización</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de Ejecuciones</DialogTitle>
            <DialogDescription>
              Últimas ejecuciones de: {selectedAutomation?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingLogs ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Cargando...</TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No hay registros aún.</TableCell></TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.executed_at), "dd/MM HH:mm:ss")}
                      </TableCell>
                      <TableCell>{log.trigger_type}</TableCell>
                      <TableCell>
                        <Badge variant={log.result === 'success' ? 'success' : 'destructive'}>
                          {log.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {log.error_message || JSON.stringify(log.execution_data)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
