import React, { useState } from "react";
import { Plus, Users, Search, Download, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listContactLists, upsertContactList, deleteContactList, exportListCsv } from "@/lib/platform.functions";
import { useServerFn } from "@tanstack/react-start";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListDetail } from "./ListDetail";


export function ContactListManager() {
  const listFn = useServerFn(listContactLists);
  const upsertFn = useServerFn(upsertContactList);
  const deleteFn = useServerFn(deleteContactList);
  const queryClient = useQueryClient();
  const exportFn = useServerFn(exportListCsv);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<any>(null);
  const [viewingList, setViewingList] = useState<any>(null);
  const [newName, setNewName] = useState("");

  
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => listFn(),
  });

  const lists: any[] = Array.isArray(data) ? (data as any[]) : [];

  const handleSaveList = async () => {
    try {
      await upsertFn({ data: { id: editingList?.id, name: newName } });
      toast.success("Lista guardada");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
    } catch {
      toast.error("Error al guardar lista");
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("¿Eliminar esta lista?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Lista eliminada");
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
    } catch {
      toast.error("Error al eliminar lista");
    }
  };
  const handleExportList = async (list: any) => {
    try {
      const csv = await exportFn({ data: { list_id: list.id } });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${list.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
      a.click();
      toast.success("Exportación iniciada");
    } catch {
      toast.error("Error al exportar lista");
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (viewingList) {
    return <ListDetail list={viewingList} onBack={() => setViewingList(null)} />;
  }

  return (

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar listas..." className="pl-8" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setEditingList(null); setNewName(""); }}>
              <Plus className="h-4 w-4" /> Nueva Lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingList ? "Editar Lista" : "Nueva Lista"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la lista</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Clientes VIP" />
              </div>
              <Button onClick={handleSaveList} className="w-full">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(lists as any[])?.map((list: any) => (
          <Card key={list.id} className="overflow-hidden border-border/50 transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: list.color || '#3b82f6' }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingList(list); setNewName(list.name); setIsDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteList(list.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">{list.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {list.description || "Sin descripción"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">Omnicanal</Badge>
                  <Badge variant="outline" className="text-[10px]">Activa</Badge>
                </div>
                <span className="text-muted-foreground font-medium">{list.contact_count ?? 0} contactos</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleExportList(list)}>
                  <Download className="mr-2 h-3 w-3" /> Exportar
                </Button>
                <Button size="sm" className="w-full text-xs" onClick={() => setViewingList(list)}>Ver lista</Button>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
