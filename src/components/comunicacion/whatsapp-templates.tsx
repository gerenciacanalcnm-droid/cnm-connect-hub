import { useState } from "react";
import { 
  FileText, 
  Plus, 
  Type, 
  MousePointer2, 
  Variable,
  Trash2,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export function WhatsAppTemplates() {
  // Estados para FASE 3 (Mínimo)
  const [name, setName] = useState(`template_${Date.now()}`);
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("es");
  const [body, setBody] = useState("");
  
  // Estados para FASE 5 & 6 (Header & Footer)
  const [headerType, setHeaderType] = useState("NONE");
  const [headerText, setHeaderText] = useState("");
  const [footer, setFooter] = useState("");

  // Estados para FASE 7 (Botones)
  const [buttons, setButtons] = useState<any[]>([]);

  const [selectedComponent, setSelectedComponent] = useState<'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Lógica de Previsualización (FASE 3 & 4)
  const renderPreviewBody = () => {
    if (!body) return "Hola mundo";
    // FASE 4: Transformación de variables
    return body.replace(/\{\{(\d+)\}\}/g, (match, number) => {
      const examples: Record<string, string> = {
        "1": "Juan",
        "2": "12345",
        "3": "Bogotá"
      };
      return examples[number] || `[Variable ${number}]`;
    });
  };

  // FASE 7: Agregar botón
  const addButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE') => {
    if (buttons.length >= 10) return;
    setButtons([...buttons, { type, text: "Nuevo botón", url: "", phoneNumber: "" }]);
  };

  if (!isEditorOpen) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Plantillas de WhatsApp</h1>
          <Button onClick={() => setIsEditorOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Crear plantilla
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Presiona el botón para iniciar el editor mínimo seguro.
          </CardContent>
        </Card>
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
          <span className="font-semibold">Nuevo</span>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">General</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="text-sm" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKETING">Marketing</SelectItem>
                <SelectItem value="UTILITY">Utilidad</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Vista previa WhatsApp</span>
          </div>
          
          <div className="bg-[#E7FFDB] rounded-lg shadow-md w-full p-4 relative space-y-3 border border-slate-200">
            {headerType === "TEXT" && headerText && (
              <div className="font-bold text-sm border-b border-slate-900/10 pb-2 mb-2 text-slate-900">
                {headerText}
              </div>
            )}
            
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {renderPreviewBody()}
            </div>
            
            {footer && (
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-900/10">
                {footer}
              </div>
            )}
            
            {buttons.length > 0 && (
              <div className="space-y-1 mt-3">
                {buttons.map((b, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm text-blue-600 text-sm py-2 rounded-lg border border-slate-200 text-center shadow-sm font-medium hover:bg-white transition-colors">
                    {b.text || "Botón"}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DERECHA: Configuración */}
      <div className="w-80 bg-white border-l p-6 overflow-y-auto flex flex-col">
        <h2 className="font-bold mb-6 flex items-center gap-2">
          completado
        </h2>

        {!selectedComponent && (
          <div className="flex-1 flex items-center justify-center text-center text-slate-400">
            <p className="text-sm">Toca un componente de la izquierda para editarlo</p>
          </div>
        )}

        {selectedComponent === 'HEADER' && (
          <div className="space-y-4">
            <Select value={headerType} onValueChange={setHeaderType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin encabezado</SelectItem>
                <SelectItem value="TEXT">Texto</SelectItem>
              </SelectContent>
            </Select>
            {headerType === "TEXT" && (
              <Input 
                value={headerText} 
                onChange={(e) => setHeaderText(e.target.value)} 
                placeholder="Ej: ¡Oferta especial!" 
                maxLength={60}
              />
            )}
          </div>
        )}

        {selectedComponent === 'BODY' && (
          <div className="space-y-4">
            <Textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              className="h-64 text-sm" 
              placeholder="Hola mundo..." 
            />
            <Button 
              variant="outline" 
              className="w-full text-xs" 
              onClick={() => {
                const variables = (body.match(/\{\{\d+\}\}/g) || []);
                const nextIndex = variables.length + 1;
                setBody(body + `{{${nextIndex}}}`);
              }}
            >
              <Variable className="h-3 w-3 mr-2" /> Insertar variable
            </Button>
          </div>
        )}

        {selectedComponent === 'FOOTER' && (
          <div className="space-y-4">
            <Input 
              value={footer} 
              onChange={(e) => setFooter(e.target.value)} 
              placeholder="Ej: CNM Digital Media" 
              maxLength={60}
            />
          </div>
        )}

        {selectedComponent === 'BUTTONS' && (
          <div className="space-y-4">
            <Button onClick={() => addButton('QUICK_REPLY')} variant="outline" className="w-full text-xs">
              + Agregar Respuesta Rápida
            </Button>
            <div className="space-y-3 mt-4">
              {buttons.map((b, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{b.type}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input 
                    value={b.text} 
                    onChange={(e) => {
                      const newButtons = [...buttons];
                      newButtons[i].text = e.target.value;
                      setButtons(newButtons);
                    }} 
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => {
            console.log("Saving...", { name, category, language, headerType, headerText, body, footer, buttons });
            setIsEditorOpen(false);
          }}>
            Guardar Borrador
          </Button>
        </div>
      </div>
    </div>
  );
}
