import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Plus, 
  Type, 
  MousePointer2, 
  Variable,
  Trash2,
  ChevronLeft,
  RefreshCw,
  Save,
  Send,
  Globe,
  Upload,
  Loader2,
  ImageIcon,
  Video,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { saveWhatsAppTemplateDraft, getWhatsAppTemplates } from "@/lib/whatsapp-templates.functions";
import { submitWhatsAppTemplateToMeta } from "@/lib/whatsapp-meta.functions";
import { syncWhatsAppTemplates } from "@/lib/whatsapp.functions";
import { uploadWhatsAppMedia } from "@/lib/whatsapp-assets.functions";

export function WhatsAppTemplates() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  // Estados del editor
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("es");
  const [body, setBody] = useState("");
  const [headerType, setHeaderType] = useState("NONE");
  const [headerText, setHeaderText] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<any[]>([]);

  const [selectedComponent, setSelectedComponent] = useState<'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar plantillas
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['whatsapp_templates'],
    queryFn: () => getWhatsAppTemplates()
  });

  // Buscar cuenta conectada
  const { data: account } = useQuery({
    queryKey: ['whatsapp_account_connected'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('status', 'connected')
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching account:", error);
        return null;
      }
      return data;
    }
  });

  // Mutaciones
  const saveMutation = useMutation({
    mutationFn: saveWhatsAppTemplateDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success("Borrador guardado localmente");
    },
    onError: (err: any) => toast.error(String(err.message))
  });

  const sendToMetaMutation = useMutation({
    mutationFn: submitWhatsAppTemplateToMeta,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast.success("Plantilla enviada a Meta correctamente");
      setIsEditorOpen(false);
    },
    onError: (err: any) => {
      // Garantizar que no enviamos JSX a toast para evitar errores de transformación de Vite
      const errorMessage = String(err.message || "Error desconocido al enviar a Meta");
      
      toast.error(errorMessage, { 
        duration: 10000,
        description: "Error detallado de Meta Cloud API" 
      });
    }
  });

  const syncMutation = useMutation({
    mutationFn: syncWhatsAppTemplates,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      
      const hasErrors = res.errors > 0;
      const details = res.details || [];
      
      toast(String(String(`Sincronización completada: ${res.updated} actualizadas, ${res.errors} errores`)), {
        duration: hasErrors ? 10000 : 4000,
        description: hasErrors ? "Revisa el detalle en los logs de la cuenta" : undefined
      });
    },
    onError: (err: any) => toast.error(String(err.message))
  });

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setCategory(editingTemplate.category);
      setLanguage(editingTemplate.language);
      setBody(editingTemplate.body);
      setHeaderText(editingTemplate.header || "");
      setFooter(editingTemplate.footer || "");
      setButtons(editingTemplate.buttons || []);
      
      const meta = editingTemplate.metadata || {};
      if (meta.header_type) {
        setHeaderType(meta.header_type);
      } else if (editingTemplate.header) {
        setHeaderType("TEXT");
      } else {
        setHeaderType("NONE");
      }
    } else {
      setName(`template_${Date.now()}`);
      setCategory("MARKETING");
      setLanguage("es");
      setBody("");
      setHeaderType("NONE");
      setHeaderText("");
      setLocalPreviewUrl(null);
      setFooter("");
      setButtons([]);
    }
  }, [editingTemplate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !account) return;

    setIsUploading(true);
    try {
      // 1. Crear preview local inmediata
      const objectUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(objectUrl);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await uploadWhatsAppMedia({
          data: {
            fileBase64: base64,
            fileName: file.name,
            fileType: file.type,
            companyId: account.company_id
          }
        });
        
        setHeaderType(res.type as any);
        setHeaderText(res.url); // En un flujo real esto sería el handle/ID
        toast.success("Archivo procesado correctamente");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error al cargar el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const renderPreviewBody = () => {
    if (!body) return "Hola mundo";
    return body.replace(/\{\{(\d+)\}\}/g, (match, number) => {
      const examples: Record<string, string> = {
        "1": "Juan",
        "2": "12345",
        "3": "Bogotá"
      };
      return examples[number] || `[Variable ${number}]`;
    });
  };

  const addButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE') => {
    if (buttons.length >= 10) return;
    setButtons([...buttons, { type, text: "", url: "", phoneNumber: "" }]);
  };

  if (!isEditorOpen) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Plantillas de WhatsApp</h1>
            <p className="text-sm text-slate-500">Gestiona y sincroniza tus plantillas oficiales con Meta Cloud API</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => account && syncMutation.mutate({ data: { accountId: account.id } })}
              disabled={syncMutation.isPending || !account}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sincronizar con Meta
            </Button>
            <Button onClick={() => { setEditingTemplate(null); setIsEditorOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Crear plantilla
            </Button>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Plus className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Sin plantillas configuradas</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                {account ? "Aún no has creado plantillas. Crea una nueva o sincroniza con Meta." : "Conecta una cuenta de WhatsApp Business para sincronizar y enviar plantillas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl: any) => (
              <Card key={tpl.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditingTemplate(tpl); setIsEditorOpen(true); }}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <Badge variant={tpl.status === 'APPROVED' ? 'default' : tpl.status === 'REJECTED' ? 'destructive' : tpl.status === 'PENDING' ? 'outline' : 'secondary'}>
                        {tpl.status}
                      </Badge>
                      {tpl.external_id && (
                        <Badge variant="outline" className="text-[9px] bg-blue-50/50 border-blue-100 text-blue-600">Meta</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{tpl.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 truncate mb-2">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{tpl.body}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {tpl.language.toUpperCase()}
                    </span>
                    <span>{new Date(tpl.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* IZQUIERDA: Componentes */}
      <div className="w-64 bg-white border-r p-6 space-y-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditorOpen(false)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-slate-900">{editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</span>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">General</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="text-sm text-slate-900 bg-white border-slate-200" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="text-sm text-slate-900 bg-white border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKETING">Marketing</SelectItem>
                <SelectItem value="UTILITY">Utility</SelectItem>
                <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="text-sm text-slate-900 bg-white border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">Inglés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-xs font-bold text-slate-500 uppercase">Editor</label>
            <Button variant={selectedComponent === 'HEADER' ? 'secondary' : 'outline'} className="w-full justify-start text-sm" onClick={() => setSelectedComponent('HEADER')}>
              <Type className="h-4 w-4 mr-2" /> Encabezado
            </Button>
            <Button variant={selectedComponent === 'BODY' ? 'secondary' : 'outline'} className="w-full justify-start text-sm" onClick={() => setSelectedComponent('BODY')}>
              <FileText className="h-4 w-4 mr-2" /> Cuerpo
            </Button>
            <Button variant={selectedComponent === 'FOOTER' ? 'secondary' : 'outline'} className="w-full justify-start text-sm" onClick={() => setSelectedComponent('FOOTER')}>
              <Type className="h-4 w-4 mr-2" /> Pie de página
            </Button>
            <Button variant={selectedComponent === 'BUTTONS' ? 'secondary' : 'outline'} className="w-full justify-start text-sm" onClick={() => setSelectedComponent('BUTTONS')}>
              <MousePointer2 className="h-4 w-4 mr-2" /> Botones
            </Button>
          </div>
        </div>
      </div>

      {/* CENTRO: Preview */}
      <div className="flex-1 p-12 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="bg-white/50 p-4 rounded-xl mb-4 text-center border border-dashed border-slate-300">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Vista Previa</span>
          </div>
          
          <div className="bg-[#E7FFDB] rounded-lg shadow-md w-full p-4 relative space-y-3 border border-slate-200">
            {headerType === "TEXT" && headerText && (
              <div className="font-bold text-sm border-b border-slate-900/10 pb-2 mb-2 text-slate-900">
                {headerText}
              </div>
            )}

            {headerType === "IMAGE" && (
              <div className="w-full aspect-video bg-slate-200 rounded-md flex items-center justify-center overflow-hidden border border-slate-300">
                {(localPreviewUrl || headerText) ? (
                  <img src={localPreviewUrl || headerText} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Vista previa de imagen</span>
                )}
              </div>
            )}

            {headerType === "VIDEO" && (
              <div className="w-full aspect-video bg-slate-800 rounded-md flex items-center justify-center overflow-hidden border border-slate-900">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                </div>
              </div>
            )}

            {headerType === "DOCUMENT" && (
              <div className="w-full p-3 bg-white rounded-md border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-10 bg-blue-100 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="h-2 w-2/3 bg-slate-200 rounded" />
                  <div className="h-2 w-1/3 bg-slate-100 rounded" />
                </div>
              </div>
            )}
            
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {renderPreviewBody()}
            </div>
            
            {footer && (
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-900/10 font-medium">
                {footer}
              </div>
            )}
            
            {buttons.length > 0 && (
              <div className="space-y-1 mt-3">
                {buttons.map((b, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm text-blue-600 text-sm py-2 rounded-lg border border-slate-200 text-center shadow-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2">
                    {b.type === 'URL' && <MousePointer2 className="h-3 w-3" />}
                    {b.type === 'PHONE' && <Type className="h-3 w-3" />}
                    {b.text || (b.type === 'URL' ? "Visitar sitio" : b.type === 'PHONE' ? "Llamar" : "Botón")}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DERECHA: Configuración */}
      <div className="w-80 bg-white border-l p-6 overflow-y-auto flex flex-col">
        <h2 className="font-bold mb-6 flex items-center gap-2 text-slate-900">
          Configuración
        </h2>

        {!selectedComponent && (
          <div className="flex-1 flex items-center justify-center text-center text-slate-400">
            <p className="text-sm">Toca un componente de la izquierda para editarlo</p>
          </div>
        )}

        {selectedComponent === 'HEADER' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipo de encabezado</label>
              <Select value={headerType} onValueChange={setHeaderType}>
                <SelectTrigger className="text-slate-900"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin encabezado</SelectItem>
                  <SelectItem value="TEXT">Texto</SelectItem>
                  <SelectItem value="IMAGE">Imagen</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="DOCUMENT">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {headerType === "TEXT" && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-slate-500">Texto del encabezado</label>
                  <span className="text-[10px] text-slate-400">{headerText.length} / 60</span>
                </div>
                <Input 
                  value={headerText} 
                  onChange={(e) => setHeaderText(e.target.value)} 
                  placeholder="Ej: ¡Oferta especial!" 
                  maxLength={60}
                  className="text-slate-900"
                />
              </div>
            )}

            {headerType === "IMAGE" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload} 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploading ? "Cargando..." : "Cargar imagen"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">O ingresa URL</label>
                  <Input 
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    placeholder="https://..." 
                    className="text-slate-900" 
                  />
                </div>
              </div>
            )}

            {(headerType === "VIDEO" || headerType === "DOCUMENT") && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept={headerType === "VIDEO" ? "video/*" : ".pdf,.doc,.docx"}
                    onChange={handleFileUpload} 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploading ? "Cargando..." : `Cargar ${headerType.toLowerCase()}`}
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">O ingresa URL</label>
                  <Input 
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    placeholder="https://..." 
                    className="text-slate-900" 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedComponent === 'BODY' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuerpo del mensaje</label>
                <Badge variant="secondary" className="text-[10px]">Recomendado</Badge>
              </div>
              <Textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                className="h-64 text-sm text-slate-900 bg-white border-slate-200 focus:ring-emerald-500" 
                placeholder="Hola {{1}}, tu pedido {{2}} está listo." 
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full text-xs hover:bg-slate-50 border-slate-200 text-slate-600" 
              onClick={() => {
                const variables = (body.match(/\{\{\d+\}\}/g) || []);
                const nextIndex = variables.length + 1;
                setBody(body + `{{${nextIndex}}}`);
              }}
            >
              <Variable className="h-3 w-3 mr-2" /> Insertar variable
            </Button>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
                Las variables <code className="bg-blue-100 px-1 rounded">{"{{n}}"}</code> serán reemplazadas por datos reales.
              </p>
            </div>
          </div>
        )}

        {selectedComponent === 'FOOTER' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pie de página</label>
              <Input 
                value={footer} 
                onChange={(e) => setFooter(e.target.value)} 
                placeholder="Ej: CNM Digital Media" 
                maxLength={60}
                className="text-slate-900 bg-white"
              />
            </div>
          </div>
        )}

        {selectedComponent === 'BUTTONS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Botones</label>
              <Badge variant="outline" className="text-[10px]">{buttons.length} / 10</Badge>
            </div>
            
            <Button onClick={() => addButton('QUICK_REPLY')} variant="outline" className="w-full text-xs" disabled={buttons.length >= 10}>
              <Plus className="h-3 w-3 mr-2" /> Agregar botón
            </Button>
            
            <div className="space-y-3 mt-4 overflow-y-auto max-h-[400px] pr-2">
              {buttons.map((b, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <Select value={b.type} onValueChange={(val: any) => {
                      const newButtons = [...buttons];
                      newButtons[i].type = val;
                      setButtons(newButtons);
                    }}>
                      <SelectTrigger className="h-7 text-[10px] font-bold w-36 uppercase tracking-tighter bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUICK_REPLY">Respuesta rápida</SelectItem>
                        <SelectItem value="URL">Visitar sitio web</SelectItem>
                        <SelectItem value="PHONE">Llamar por teléfono</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase">Texto del botón</label>
                      <Input 
                        value={b.text} 
                        onChange={(e) => {
                          const newButtons = [...buttons];
                          newButtons[i].text = e.target.value;
                          setButtons(newButtons);
                        }} 
                        className="h-9 text-sm text-slate-900 bg-white"
                        placeholder="Escribe el texto..."
                        maxLength={25}
                      />
                    </div>

                    {b.type === 'URL' && (
                      <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">URL del sitio web</label>
                        <Input 
                          value={b.url} 
                          onChange={(e) => {
                            const newButtons = [...buttons];
                            newButtons[i].url = e.target.value;
                            setButtons(newButtons);
                          }} 
                          className="h-9 text-sm text-slate-900 bg-white"
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    {b.type === 'PHONE' && (
                      <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Número de teléfono</label>
                        <Input 
                          value={b.phoneNumber} 
                          onChange={(e) => {
                            const newButtons = [...buttons];
                            newButtons[i].phoneNumber = e.target.value;
                            setButtons(newButtons);
                          }} 
                          className="h-9 text-sm text-slate-900 bg-white"
                          placeholder="+573000000000"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t space-y-3">
          <Button 
            variant="outline"
            className="w-full text-slate-600"
            disabled={saveMutation.isPending}
            onClick={() => {
              saveMutation.mutate({ 
                data: { 
                  id: editingTemplate?.id,
                  accountId: account?.id || "",
                  name, category, language, body, footer, buttons,
                  header: headerType === 'TEXT' ? headerText : headerType,
                  metadata: { header_type: headerType, header_text: headerText, status: 'DRAFT', header_handle: headerText }
                } 
              });
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Borrador
          </Button>
          
          <Button 
            variant="outline"
            className="w-full text-slate-600 border-emerald-100 hover:bg-emerald-50"
            disabled={isUploading || !account}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Cargar imagen
          </Button>
          
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm" 
            disabled={!name || !body || (headerType === 'TEXT' && !headerText) || buttons.some(b => !b.text) || sendToMetaMutation.isPending || (headerType !== 'NONE' && headerType !== 'TEXT' && !headerText)}
            onClick={async () => {
              const saved: any = await saveMutation.mutateAsync({ 
                data: { 
                  id: editingTemplate?.id,
                  accountId: account?.id || "",
                  name, category, language, body, footer, buttons,
                  header: headerType === 'TEXT' ? headerText : headerType,
                  metadata: { header_type: headerType, header_text: headerText, header_handle: headerText }
                } 
              });
              
              if (saved && saved.id) {
                sendToMetaMutation.mutate({ data: { id: saved.id } });
              }
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar a Meta para aprobación
          </Button>
          
          <Button variant="ghost" className="w-full text-xs text-slate-400" onClick={() => setIsEditorOpen(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
