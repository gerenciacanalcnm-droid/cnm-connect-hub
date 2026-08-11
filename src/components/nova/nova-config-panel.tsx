import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNovaSettings, useNovaKnowledge } from "@/hooks/use-nova";
import { Loader2, Save, Power, PowerOff, BrainCircuit, MessageSquare, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function NovaConfigPanel() {
  const { data: settings, save: saveSettings, isSaving: isSavingSettings, isLoading: isLoadingSettings } = useNovaSettings();
  const { data: knowledge, save: saveKnowledge, isSaving: isSavingKnowledge, isLoading: isLoadingKnowledge } = useNovaKnowledge();

  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [knowledgeForm, setKnowledgeForm] = useState<any>(null);

  useEffect(() => {
    if (settings) setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (knowledge) setKnowledgeForm(knowledge);
  }, [knowledge]);

  if (isLoadingSettings || isLoadingKnowledge || !settingsForm || !knowledgeForm) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nova" />
      </div>
    );
  }

  const handleToggleStatus = () => {
    const newStatus = settingsForm.status === "ACTIVO" ? "PAUSADO" : "ACTIVO";
    setSettingsForm({ ...settingsForm, status: newStatus });
    saveSettings({ ...settingsForm, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <Card className="border-nova/20 bg-nova/5">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              settingsForm.status === "ACTIVO" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
            )}>
              {settingsForm.status === "ACTIVO" ? <Power className="h-6 w-6" /> : <PowerOff className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Estado de CNM Nova</h3>
              <p className="text-sm text-muted-foreground">
                {settingsForm.status === "ACTIVO" 
                  ? "El asistente está encendido y listo para ser usado en automatizaciones." 
                  : "El asistente está en pausa. No responderá ni procesará tareas."}
              </p>
            </div>
          </div>
          <Button 
            variant={settingsForm.status === "ACTIVO" ? "destructive" : "default"}
            className={cn(settingsForm.status !== "ACTIVO" && "bg-nova hover:bg-nova/90")}
            onClick={handleToggleStatus}
            disabled={isSavingSettings}
          >
            {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {settingsForm.status === "ACTIVO" ? "Pausar Asistente" : "Activar Asistente"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="gap-2"><BrainCircuit className="h-4 w-4" /> Configuración</TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2"><Info className="h-4 w-4" /> Conocimiento</TabsTrigger>
          <TabsTrigger value="personality" className="gap-2"><MessageSquare className="h-4 w-4" /> Personalidad</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><ShieldCheck className="h-4 w-4" /> Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identidad y Motor</CardTitle>
              <CardDescription>Configura los parámetros base del cerebro de Nova.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nova-name">Nombre del Asistente</Label>
                  <Input 
                    id="nova-name" 
                    value={settingsForm.name} 
                    onChange={e => setSettingsForm({...settingsForm, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Idioma Principal</Label>
                  <Select 
                    value={settingsForm.language} 
                    onValueChange={v => setSettingsForm({...settingsForm, language: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                      <SelectItem value="pt">Portugués</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Modelo IA</Label>
                  <Select 
                    value={settingsForm.model_id} 
                    onValueChange={v => setSettingsForm({...settingsForm, model_id: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Veloz)</SelectItem>
                      <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperatura (Creatividad)</Label>
                    <span className="text-xs font-mono">{settingsForm.temperature}</span>
                  </div>
                  <Slider 
                    value={[settingsForm.temperature * 100]} 
                    max={200} 
                    step={1} 
                    onValueChange={v => setSettingsForm({...settingsForm, temperature: v[0] / 100})}
                  />
                  <p className="text-[10px] text-muted-foreground">Valores bajos son deterministas, valores altos más creativos.</p>
                </div>
              </div>
              <Button onClick={() => saveSettings(settingsForm)} disabled={isSavingSettings} className="w-fit">
                {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base de Conocimiento</CardTitle>
              <CardDescription>Información sobre tu empresa que Nova usará para responder.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nombre de la Empresa</Label>
                  <Input 
                    value={knowledgeForm.company_name || ""} 
                    onChange={e => setKnowledgeForm({...knowledgeForm, company_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Teléfono de Atención</Label>
                  <Input 
                    value={knowledgeForm.phone || ""} 
                    onChange={e => setKnowledgeForm({...knowledgeForm, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Descripción del Negocio</Label>
                <Textarea 
                  placeholder="Ej: Somos una agencia de marketing..."
                  value={knowledgeForm.description || ""} 
                  onChange={e => setKnowledgeForm({...knowledgeForm, description: e.target.value})}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Productos</Label>
                  <Textarea 
                    placeholder="Lista tus productos principales..."
                    value={knowledgeForm.products || ""} 
                    onChange={e => setKnowledgeForm({...knowledgeForm, products: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Servicios</Label>
                  <Textarea 
                    placeholder="Lista tus servicios principales..."
                    value={knowledgeForm.services || ""} 
                    onChange={e => setKnowledgeForm({...knowledgeForm, services: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Horarios</Label>
                  <Input 
                    placeholder="Lun-Vie 8am-6pm"
                    value={knowledgeForm.business_hours || ""} 
                    onChange={e => setKnowledgeForm({...knowledgeForm, business_hours: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dirección Física</Label>
                  <Input 
                    value={knowledgeForm.address || ""} 
                    onChange={e => setKnowledgeForm({...knowledgeForm, address: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={() => saveKnowledge(knowledgeForm)} disabled={isSavingKnowledge} className="w-fit">
                {isSavingKnowledge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Conocimiento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalidad e Instrucciones</CardTitle>
              <CardDescription>Define cómo debe sonar y actuar Nova.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label>Personalidad</Label>
                <Textarea 
                  placeholder="Ej: Eres un asistente profesional, amable y conciso..."
                  rows={3}
                  value={settingsForm.personality || ""} 
                  onChange={e => setSettingsForm({...settingsForm, personality: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Instrucciones Maestras (System Prompt)</Label>
                <Textarea 
                  placeholder="Reglas estrictas que debe seguir..."
                  rows={6}
                  value={settingsForm.instructions || ""} 
                  onChange={e => setSettingsForm({...settingsForm, instructions: e.target.value})}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Mensaje Inicial</Label>
                  <Textarea 
                    placeholder="¿Cómo saluda a un cliente nuevo?"
                    value={settingsForm.initial_message || ""} 
                    onChange={e => setSettingsForm({...settingsForm, initial_message: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Mensaje de 'No sé'</Label>
                  <Textarea 
                    placeholder="¿Qué dice si no tiene la respuesta?"
                    value={settingsForm.not_found_message || ""} 
                    onChange={e => setSettingsForm({...settingsForm, not_found_message: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings(settingsForm)} disabled={isSavingSettings} className="w-fit">
                {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Personalidad
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integración con el Ecosistema</CardTitle>
              <CardDescription>Nova utiliza datos del CRM y Automatizaciones para dar contexto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-nova" /> 
                  Contexto CRM (Activo)
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nova tiene acceso a: Nombre, Teléfono, Empresa, Historial de Conversación, Etiquetas y Asesor Asignado.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="flex items-center gap-2 font-medium">
                  <BrainCircuit className="h-4 w-4 text-nova" /> 
                  Preparado para Automatizaciones
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Próximamente podrás seleccionar "Procesar con CNM Nova" como acción en cualquier flujo automatizado.
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-amber-900 dark:text-amber-200">
                <h4 className="flex items-center gap-2 font-medium">
                  <Info className="h-4 w-4" /> 
                  Aviso de Seguridad Multi-Tenant
                </h4>
                <p className="mt-1 text-xs opacity-80">
                  Todas las configuraciones e instrucciones están aisladas por ID de empresa. Nova nunca compartirá datos entre clientes. Las credenciales se procesan exclusivamente en el servidor.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
