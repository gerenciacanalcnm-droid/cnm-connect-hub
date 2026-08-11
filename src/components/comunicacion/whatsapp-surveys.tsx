import { useState } from "react";
import { Plus, Trash2, ChevronLeft, Smartphone, Send, Save, Variable, Image, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { saveSurvey } from "@/lib/whatsapp-surveys.functions";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";

export function WhatsAppSurveys() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [type, setType] = useState<'INTERACTIVE_LIST' | 'INTERACTIVE_BUTTONS'>('INTERACTIVE_LIST');
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [footer, setFooter] = useState("");
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [options, setOptions] = useState([
    { label: "", option_key: "option_1" },
    { label: "", option_key: "option_2" }
  ]);
  const [selectedComp, setSelectedComp] = useState<'GENERAL' | 'OPTIONS' | 'PREVIEW'>('GENERAL');
  const [isSaving, setIsSaving] = useState(false);

  const saveSurveyFn = useServerFn(saveSurvey);

  const handleSave = async () => {
    if (!title || !question || options.some(o => !o.label)) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }
    setIsSaving(true);
    try {
      await saveSurveyFn({
        data: {
          title,
          question,
          type,
          options,
          metadata: { footer, header_type: headerType }
        }
      });
      toast.success("Encuesta guardada.");
      setIsEditorOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditorOpen) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Encuestas WhatsApp</h1>
          <Button onClick={() => setIsEditorOpen(true)} className="bg-blue-600">
            <Plus className="h-4 w-4 mr-2" /> Crear Encuesta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* IZQ: Configuración */}
      <div className="w-80 bg-white border-r p-6 overflow-y-auto space-y-6">
        <Button variant="ghost" className="mb-4" onClick={() => setIsEditorOpen(false)}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div className="space-y-4">
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="INTERACTIVE_LIST">Lista Interactiva</SelectItem>
              <SelectItem value="INTERACTIVE_BUTTONS">Botones de Respuesta</SelectItem>
            </SelectContent>
          </Select>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (Meta: 60 chars)" maxLength={60} />
          <Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Pregunta/Cuerpo (Meta: 1024 chars)" maxLength={1024} />
          {type === 'INTERACTIVE_BUTTONS' && (
             <Select value={headerType} onValueChange={(v: any) => setHeaderType(v)}>
               <SelectTrigger><SelectValue placeholder="Tipo de Header" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="NONE">Sin header</SelectItem>
                 <SelectItem value="TEXT">Texto</SelectItem>
                 <SelectItem value="IMAGE">Imagen</SelectItem>
               </SelectContent>
             </Select>
          )}
          <Input value={footer} onChange={e => setFooter(e.target.value)} placeholder="Pie de página" />
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Opciones {options.length}/{type === 'INTERACTIVE_BUTTONS' ? 3 : 10}</label>
            {options.map((opt, i) => (
              <Input key={i} value={opt.label} onChange={e => {
                const ns = [...options]; ns[i].label = e.target.value; setOptions(ns);
              }} placeholder={`Opción ${i + 1}`} />
            ))}
            <Button onClick={() => setOptions([...options, { label: "", option_key: `option_${options.length + 1}` }])}>+ Agregar</Button>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={isSaving}>Guardar</Button>
        </div>
      </div>
      {/* CENTRO: Preview */}
      <div className="flex-1 p-12 bg-[#E5DDD5] flex justify-center items-start">
        <div className="w-[300px] bg-white rounded-lg p-4 shadow-xl border">
          <div className="font-bold text-emerald-600 text-sm">{title}</div>
          <div className="text-sm mt-1">{question}</div>
          {footer && <div className="text-xs text-slate-500 mt-2">{footer}</div>}
          <div className="mt-4 space-y-2">
            {options.map((o, i) => (
              <div key={i} className="bg-slate-100 p-2 rounded text-sm">{o.label || `Opción ${i + 1}`}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
