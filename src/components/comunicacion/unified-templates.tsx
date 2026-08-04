import { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useWhatsAppTemplates,
  useSaveWhatsAppTemplate,
  useDeleteWhatsAppTemplate,
} from "@/hooks/use-whatsapp";
import { toast } from "sonner";

const CATEGORIES = ["marketing", "utility", "authentication"];

export function UnifiedTemplates() {
  const { data: templates, isLoading } = useWhatsAppTemplates();
  const save = useSaveWhatsAppTemplate();
  const remove = useDeleteWhatsAppTemplate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("marketing");
  const [language, setLanguage] = useState("es");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");

  const variables = Array.from(body.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1] as string);

  const submit = async () => {
    if (!name.trim() || !body.trim()) return toast.error("Nombre y cuerpo son obligatorios");
    try {
      await save.mutateAsync({ name, category, language, header, body, footer, variables });
      toast.success("Plantilla guardada");
      setOpen(false);
      setName("");
      setBody("");
      setHeader("");
      setFooter("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Plantillas unificadas</h3>
          <p className="text-xs text-muted-foreground">
            Reutilizables en SMS, WhatsApp y Email. Usa {"{{"}variable{"}}"} para personalizar.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Nueva plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva plantilla</DialogTitle>
              <DialogDescription>
                Quedará en estado borrador hasta la aprobación del canal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Idioma</Label>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Encabezado (opcional)</Label>
                <Input value={header} onChange={(e) => setHeader(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Cuerpo</Label>
                <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
                {variables.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Variables detectadas: {variables.join(", ")}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label>Pie (opcional)</Label>
                <Input value={footer} onChange={(e) => setFooter(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={save.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : !templates?.length ? (
        <EmptyState
          icon={FileText}
          title="Sin plantillas"
          description="Crea plantillas reutilizables para todos tus canales."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="border-border/70">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {t.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {t.language}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => remove.mutate(t.id)}
                    aria-label="Eliminar plantilla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-3 line-clamp-3 rounded-md bg-muted/60 p-2.5 text-xs leading-relaxed text-muted-foreground">
                  {t.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
