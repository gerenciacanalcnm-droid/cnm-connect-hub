import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ChevronRight, Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { processContactImportBatch } from "@/lib/import.functions";
import { listContactLists, upsertContactList } from "@/lib/platform.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function CSVImporter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newList, setNewList] = useState({ name: "", description: "" });
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const processImport = useServerFn(processContactImportBatch);
  const listFn = useServerFn(listContactLists);
  const upsertListFn = useServerFn(upsertContactList);
  const queryClient = useQueryClient();

  const { data: lists, isLoading: isLoadingLists } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => listFn(),
    enabled: open,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim();
          return obj;
        }, {} as any);
      });
      setData(rows.filter(r => r.nombre || r.first_name || r.phone || r.telefono));
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleCreateList = async () => {
    if (!newList.name) {
      toast.error("El nombre de la lista es obligatorio");
      return;
    }

    setIsCreatingList(true);
    try {
      const result = await upsertListFn({ data: { name: newList.name } });
      toast.success("Lista creada correctamente");
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      setSelectedListId(result.id);
      setShowNewListForm(false);
      setNewList({ name: "", description: "" });
    } catch (error) {
      toast.error("Error al crear la lista");
    } finally {
      setIsCreatingList(false);
    }
  };

  const executeImport = async () => {
    if (!selectedListId) {
      toast.error("Selecciona una lista para continuar");
      return;
    }

    setIsImporting(true);
    try {
      const contacts = data.map(r => ({
        first_name: r.nombre || r.first_name || "Sin nombre",
        last_name: r.apellido || r.last_name || "",
        phone: r.telefono || r.phone || "",
        email: r.email || "",
      })).filter(c => c.phone);

      const res = await processImport({ 
        data: { 
          contacts, 
          list_id: selectedListId 
        } 
      });
      toast.success(`Importación completada: ${res.imported} nuevos/actualizados`);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      resetState();
    } catch {
      toast.error("Error en la importación");
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setData([]);
    setSelectedListId("");
    setShowNewListForm(false);
    setNewList({ name: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Segunda Prueba</DialogTitle>
        </DialogHeader>
        
        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm mb-4 font-medium text-slate-900">Selecciona un archivo .csv</p>
            <Input type="file" accept=".csv" onChange={handleFileUpload} className="max-w-xs" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-900 mb-4">
                Se detectaron {data.length} registros. Completa la configuración:
              </p>
              
              <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
                <div className="space-y-2">
                  <Label htmlFor="list-select" className="text-slate-900">Lista de contactos</Label>
                  {!showNewListForm ? (
                    <div className="flex gap-2">
                      <Select value={selectedListId} onValueChange={setSelectedListId}>
                        <SelectTrigger id="list-select" className="bg-white">
                          <SelectValue placeholder="Selecciona una lista existente" />
                        </SelectTrigger>
                        <SelectContent>
                          {lists?.map((list: any) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="create-new" className="text-primary font-medium">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Crear nueva lista
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setShowNewListForm(true)}
                        title="Crear nueva lista"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 border rounded-md bg-white">
                      <div className="space-y-1">
                        <Label htmlFor="new-list-name" className="text-xs">Nombre de la lista</Label>
                        <Input 
                          id="new-list-name"
                          placeholder="Clientes de prueba" 
                          value={newList.name}
                          onChange={e => setNewList(prev => ({ ...prev, name: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-list-desc" className="text-xs">Descripción (opcional)</Label>
                        <Textarea 
                          id="new-list-desc"
                          placeholder="Contactos utilizados para pruebas de CNM Nova" 
                          value={newList.description}
                          onChange={e => setNewList(prev => ({ ...prev, description: e.target.value }))}
                          className="h-16 resize-none"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowNewListForm(false)}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleCreateList} disabled={isCreatingList}>
                          {isCreatingList ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Crear lista y continuar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Previsualización (primeros 5 registros)</Label>
              <div className="max-h-40 overflow-auto border rounded-md bg-white">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-50 border-b">
                    <tr>{Object.keys(data[0] || {}).map(h => <th key={h} className="text-left p-2 font-semibold text-slate-700">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {Object.values(r).map((v: any, j) => <td key={j} className="p-2 text-slate-600">{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button 
              onClick={executeImport} 
              className="w-full" 
              disabled={!selectedListId || isImporting || showNewListForm}
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedListId ? "Iniciar Importación" : "Selecciona una lista para continuar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

