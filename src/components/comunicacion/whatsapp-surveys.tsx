import { useState, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Smartphone, 
  Send, 
  Save, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  BarChart3, 
  ArrowRight,
  UserCheck,
  Percent,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { saveSurvey, getSurveyStats } from "@/lib/whatsapp-surveys.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// --- Types ---
type SurveyType = 'INTERACTIVE_LIST' | 'INTERACTIVE_BUTTONS';
type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

interface SurveyOption {
  label: string;
  option_key: string;
  metadata?: Record<string, any>;
}

// --- Helpers ---
const replaceVariables = (text: string, examples: Record<string, string> = { "1": "Juan", "2": "CNM" }) => {
  if (!text) return text;
  return text.replace(/\{\{(\d+)\}\}/g, (match, number) => examples[number] || match);
};

export function WhatsAppSurveys() {
  // Navigation & State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<SurveyType>('INTERACTIVE_LIST');
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [footer, setFooter] = useState("");
  const [headerType, setHeaderType] = useState<HeaderType>('NONE');
  const [headerText, setHeaderText] = useState("");
  const [headerUrl, setHeaderUrl] = useState("");
  const [listButtonText, setListButtonText] = useState("Ver opciones");
  const [options, setOptions] = useState<SurveyOption[]>([
    { label: "", option_key: "option_1" },
    { label: "", option_key: "option_2" }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);

  // Functions
  const saveSurveyFn = useServerFn(saveSurvey);
  const getStatsFn = useServerFn(getSurveyStats);

  // Stats Query
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['survey-stats', selectedSurveyId],
    queryFn: () => getStatsFn({ data: { surveyId: selectedSurveyId! } }),
    enabled: !!selectedSurveyId && !isEditorOpen,
    refetchInterval: 30000 // Refrescar cada 30s
  });

  const handleSave = async () => {
    if (!title || !question || options.filter(o => o.label).length < 1) {
      toast.error("Por favor completa los campos requeridos y al menos una opción.");
      return;
    }

    if (type === 'INTERACTIVE_BUTTONS' && options.length > 3) {
      toast.error("El tipo 'Botones' soporta máximo 3 opciones.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveSurveyFn({
        data: {
          id: selectedSurveyId || undefined,
          title,
          question,
          type,
          options: options.filter(o => o.label),
          metadata: { 
            footer, 
            header_type: headerType,
            header_text: headerText,
            header_url: headerUrl,
            button_text: listButtonText
          }
        }
      });
      toast.success("Encuesta guardada correctamente.");
      setSelectedSurveyId(result.id);
      setIsEditorOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const addOption = () => {
    const limit = type === 'INTERACTIVE_BUTTONS' ? 3 : 10;
    if (options.length >= limit) {
      toast.warning(`Límite de ${limit} opciones alcanzado para este tipo.`);
      return;
    }
    setOptions([...options, { label: "", option_key: `option_${options.length + 1}` }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  // --- Render Editor ---
  if (isEditorOpen) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
        {/* PANEL IZQUIERDO: Configuración */}
        <div className="w-80 bg-white border-r flex flex-col shadow-sm">
          <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editor v2.0</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <section className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estructura</label>
              <Select value={type} onValueChange={(v: SurveyType) => {
                setType(v);
                if (v === 'INTERACTIVE_BUTTONS' && options.length > 3) {
                  setOptions(options.slice(0, 3));
                }
              }}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Tipo de Encuesta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERACTIVE_LIST">Lista Interactiva (2-10 opciones)</SelectItem>
                  <SelectItem value="INTERACTIVE_BUTTONS">Botones (1-3 opciones)</SelectItem>
                </SelectContent>
              </Select>

              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Nombre interno de la encuesta" 
                className="bg-white"
              />
            </section>

            <section className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contenido (Meta compatible)</label>
              
              <Select value={headerType} onValueChange={(v: HeaderType) => setHeaderType(v)}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Tipo de Cabecera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin cabecera</SelectItem>
                  <SelectItem value="TEXT">Texto</SelectItem>
                  <SelectItem value="IMAGE">Imagen</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="DOCUMENT">Documento</SelectItem>
                </SelectContent>
              </Select>

              {headerType === 'TEXT' && (
                <Input 
                  value={headerText} 
                  onChange={e => setHeaderText(e.target.value)} 
                  placeholder="Texto de la cabecera (60 chars)" 
                  maxLength={60}
                />
              )}

              {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                <Input 
                  value={headerUrl} 
                  onChange={e => setHeaderUrl(e.target.value)} 
                  placeholder="URL del archivo multimedia" 
                />
              )}

              <Textarea 
                value={question} 
                onChange={e => setQuestion(e.target.value)} 
                placeholder="Cuerpo del mensaje (soporta {{1}}, {{2}})" 
                className="min-h-[100px] bg-white resize-none"
                maxLength={1024}
              />

              <Input 
                value={footer} 
                onChange={e => setFooter(e.target.value)} 
                placeholder="Pie de página (opcional, 60 chars)" 
                maxLength={60}
              />

              {type === 'INTERACTIVE_LIST' && (
                <Input 
                  value={listButtonText} 
                  onChange={e => setListButtonText(e.target.value)} 
                  placeholder="Texto del botón de lista (20 chars)" 
                  maxLength={20}
                />
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opciones</label>
                <span className="text-[10px] text-slate-400">{options.length} / {type === 'INTERACTIVE_BUTTONS' ? 3 : 10}</span>
              </div>
              
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2 group">
                    <Input 
                      value={opt.label} 
                      onChange={e => {
                        const ns = [...options];
                        ns[i].label = e.target.value;
                        setOptions(ns);
                      }} 
                      placeholder={`Opción ${i + 1}`}
                      className="flex-1 bg-white h-9 text-sm"
                      maxLength={24}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeOption(i)}
                      className="h-9 w-9 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full h-9 border-dashed text-xs border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600" 
                onClick={addOption}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar Opción
              </Button>
            </section>
          </div>

          <div className="p-4 bg-white border-t">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-semibold" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" /> {isSaving ? "Guardando..." : "Guardar Encuesta"}
            </Button>
          </div>
        </div>

        {/* PANEL CENTRAL: Preview Dinámico */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-[#E5DDD5] relative overflow-y-auto">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Live Preview</span>
            </div>
          </div>

          <div className="w-[320px] bg-white rounded-lg shadow-2xl border border-slate-300 overflow-hidden">
            {/* Header WhatsApp */}
            <div className="bg-[#075E54] p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                <Smartphone className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex-1 leading-tight">
                <div className="text-white text-[13px] font-bold">SMS CNM · Asistente</div>
                <div className="text-white/70 text-[10px]">en línea</div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="p-3 space-y-4 min-h-[450px] relative">
              <div className="bg-white rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] max-w-[90%] overflow-hidden border border-slate-100/50">
                {/* Cabecera Multimedia */}
                {headerType !== 'NONE' && (
                  <div className="w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center min-h-[120px]">
                    {headerType === 'TEXT' ? (
                      <div className="p-3 w-full font-bold text-slate-800 text-xs">
                        {headerText || "TEXTO DE CABECERA"}
                      </div>
                    ) : headerType === 'IMAGE' ? (
                      <div className="flex flex-col items-center text-slate-400">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-[10px] font-medium">[IMAGEN]</span>
                      </div>
                    ) : headerType === 'VIDEO' ? (
                      <div className="flex flex-col items-center text-slate-400">
                        <Video className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-[10px] font-medium">[VIDEO]</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <FileText className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-[10px] font-medium">[DOCUMENTO]</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cuerpo del Mensaje */}
                <div className="p-3">
                  <div className="text-slate-800 text-[13.5px] whitespace-pre-wrap break-words leading-relaxed">
                    {replaceVariables(question) || "¿Cómo calificarías nuestra atención el día de hoy?"}
                  </div>
                  {footer && (
                    <div className="text-slate-400 text-[11px] mt-2 border-t border-slate-50 pt-1">
                      {footer}
                    </div>
                  )}
                </div>

                {/* Acciones del Mensaje */}
                <div className="border-t border-slate-100">
                  {type === 'INTERACTIVE_LIST' ? (
                    <div className="flex items-center justify-center p-2.5 text-blue-500 font-bold text-[13px] hover:bg-slate-50 cursor-pointer gap-2">
                      <Send className="h-3.5 w-3.5" />
                      {listButtonText || "Ver opciones"}
                    </div>
                  ) : (
                    <div className="space-y-px bg-slate-100">
                      {options.filter(o => o.label).map((opt, i) => (
                        <div key={i} className="bg-white p-2.5 text-blue-500 text-[13px] text-center font-semibold hover:bg-slate-50 cursor-pointer">
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Popup de Lista (Solo si es LIST) */}
              {type === 'INTERACTIVE_LIST' && (
                <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 animate-in slide-in-from-bottom-full duration-500 z-20">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-slate-800">Selecciona una opción</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">×</Button>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto">
                    {options.filter(o => o.label).map((opt, i) => (
                      <div key={i} className="px-4 py-3 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50">
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                        <div className="text-slate-700 text-sm">{opt.label}</div>
                      </div>
                    ))}
                    {options.filter(o => o.label).length === 0 && (
                      <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
                        Agrega opciones en el panel izquierdo
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Dashboard ---
  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centro de Encuestas</h1>
          <p className="text-slate-500 text-sm">Gestiona tus consultas interactivas vía WhatsApp Business.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => {
            setIsEditorOpen(true);
            setSelectedSurveyId(null);
            // Reset form
            setTitle(""); setQuestion(""); setFooter(""); setOptions([{ label: "", option_key: "option_1" }, { label: "", option_key: "option_2" }]);
          }} className="bg-blue-600 hover:bg-blue-700 shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Nueva Encuesta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Métricas Globales (Placeholder dinámico) */}
        <Card className="bg-blue-600 border-none shadow-lg shadow-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-white/80 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Tasa de Respuesta</span>
              <Percent className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {(stats?.total ?? 0) > 0 ? `${Math.round(((stats?.stats ?? []).reduce((acc: number, curr: any) => acc + curr.count, 0) / (stats?.total ?? 1)) * 100)}%` : "0%"}
            </div>
            <div className="text-white/60 text-xs">Basado en envíos totales</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-slate-400 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Total Respuestas</span>
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats?.stats.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}
            </div>
            <div className="text-slate-500 text-xs">Votos únicos registrados</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-slate-400 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Total Enviados</span>
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats?.total || 0}
            </div>
            <div className="text-slate-500 text-xs">Encuestas distribuidas</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Encuestas Recientes (Ejemplo dinámico) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" /> Histórico Activo
          </h3>
          <div className="space-y-2">
             <Card 
              className={cn(
                "cursor-pointer transition-all hover:border-blue-300",
                selectedSurveyId === "SURVEY_DEMO" ? "border-blue-500 bg-blue-50/30" : "border-slate-100"
              )}
              onClick={() => setSelectedSurveyId("SURVEY_DEMO")}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">Calificación de Servicio</div>
                  <div className="text-[10px] text-slate-400">Último envío: Hoy, 10:45 AM</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </CardContent>
            </Card>
            {/* Aquí iría el map real de encuestas desde Supabase */}
          </div>
        </div>

        {/* Detalle de Estadísticas */}
        <div className="lg:col-span-2">
          {selectedSurveyId ? (
            <Card className="border-slate-200 bg-white min-h-[400px]">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Análisis de Resultados</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)}>
                    Editar Encuesta
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {isLoadingStats ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mb-4" />
                    Cargando datos reales...
                  </div>
                ) : stats && stats.stats.length > 0 ? (
                  <div className="space-y-6">
                    {stats.stats.map((opt: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end text-sm">
                          <span className="font-semibold text-slate-700">{opt.label}</span>
                          <span className="text-slate-400 font-mono text-xs">{opt.count} votos ({opt.percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${opt.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <BarChart3 className="h-12 w-12 opacity-10 mb-4" />
                    <p className="text-sm">No se han registrado respuestas reales para esta encuesta.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Smartphone className="h-16 w-16 mb-4 opacity-10" />
              <h4 className="font-bold text-slate-900 mb-2">Selecciona una encuesta</h4>
              <p className="text-sm max-w-[280px]">Elige una encuesta del panel izquierdo para ver estadísticas en tiempo real.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
