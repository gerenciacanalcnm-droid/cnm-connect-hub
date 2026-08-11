import { useState } from "react";
import { 
  Plus, 
  Trash2,
  ChevronLeft,
  Smartphone,
  Send,
  Save,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { saveSurvey } from "@/lib/whatsapp-surveys.functions";
import { useServerFn } from "@tanstack/react-start";

export function WhatsAppSurveys() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { label: "", option_key: "option_1" },
    { label: "", option_key: "option_2" }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const saveSurveyFn = useServerFn(saveSurvey);

  const addOption = () => {
    if (options.length >= 10) return;
    const nextIndex = options.length + 1;
    setOptions([...options, { label: "", option_key: `option_${nextIndex}` }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title || !question || options.some(o => !o.label)) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    setIsSaving(true);
    try {
      await saveSurveyFn({
        data: {
          title,
          question,
          options
        }
      });
      toast.success("Encuesta guardada correctamente.");
      setIsEditorOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la encuesta.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditorOpen) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Encuestas WhatsApp</h1>
          <Button onClick={() => setIsEditorOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Crear encuesta
          </Button>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Crea encuestas interactivas para tus clientes en WhatsApp.</p>
            <Button variant="link" onClick={() => setIsEditorOpen(true)} className="mt-2">
              Comenzar ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* IZQUIERDA: Editor */}
      <div className="w-96 bg-white border-r p-6 overflow-y-auto space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditorOpen(false)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-slate-900">Nueva Encuesta</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Información General</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Nombre interno (Ej: Calificación Servicio)" 
              className="text-slate-900"
            />
            <Select defaultValue="SINGLE_CHOICE">
              <SelectTrigger className="text-slate-900">
                <SelectValue placeholder="Tipo de encuesta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE_CHOICE">Selección de una opción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-xs font-bold text-slate-500 uppercase">Contenido</label>
            <Input 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              placeholder="¿Cómo calificarías nuestro servicio?" 
              className="text-slate-900"
            />
          </div>

          <div className="space-y-3 pt-4">
            <label className="text-xs font-bold text-slate-500 uppercase">Opciones</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input 
                  value={opt.label} 
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[i].label = e.target.value;
                    setOptions(newOptions);
                  }} 
                  placeholder={`Opción ${i + 1}`}
                  className="text-slate-900"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full text-xs" 
              onClick={addOption}
              disabled={options.length >= 10}
            >
              <Plus className="h-3 w-3 mr-2" /> Agregar opción
            </Button>
          </div>
        </div>

        <div className="pt-8">
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" /> {isSaving ? "Guardando..." : "Guardar Encuesta"}
          </Button>
        </div>
      </div>

      {/* DERECHA: Preview WhatsApp */}
      <div className="flex-1 p-12 flex items-center justify-center bg-[#E5DDD5]">
        <div className="w-full max-w-[320px] bg-white rounded-lg shadow-xl overflow-hidden border border-slate-300">
          {/* WhatsApp Header */}
          <div className="bg-[#075E54] p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="text-white text-[13px] font-bold">CNM Digital Media</div>
              <div className="text-white/70 text-[10px]">en línea</div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="p-4 space-y-4 min-h-[400px]">
            <div className="bg-white rounded-lg shadow-sm p-3 max-w-[85%] relative border border-slate-100">
              <div className="font-bold text-emerald-600 text-[12px] mb-1">{title || "Encuesta"}</div>
              <div className="text-slate-900 text-sm mb-3">{question || "¿Cómo calificarías nuestro servicio?"}</div>
              
              <Button variant="outline" className="w-full h-9 text-blue-500 text-sm border-t border-slate-100 rounded-none bg-transparent hover:bg-slate-50 flex items-center justify-center gap-2">
                <Send className="h-3 w-3" /> Ver opciones
              </Button>
            </div>

            {/* Simulated List Popup */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 mt-8">
                <div className="p-4 border-b border-slate-100">
                  <div className="text-slate-900 text-[13px] font-bold">Selecciona una opción</div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {options.map((opt, i) => (
                    <div key={i} className="p-3 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50 cursor-pointer">
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                      <div className="text-slate-700 text-sm">{opt.label || `Opción ${i + 1}`}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
