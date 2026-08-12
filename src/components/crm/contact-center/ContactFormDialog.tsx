import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { upsertContact } from "@/lib/contacts.functions";
import { listContactTags, assignTagToContact, removeTagFromContact, listContactTagsForContact } from "@/lib/tags.functions";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X, Check, Plus } from "lucide-react";

const formSchema = z.object({
  first_name: z.string().min(1, "Nombre es requerido"),
  last_name: z.string().optional(),
  phone: z.string().min(1, "Teléfono es requerido"),
  email: z.string().email().optional().or(z.literal("")),
});

export function ContactFormDialog({ 
  children, 
  defaultValues, 
  open: externalOpen, 
  setOpen: externalSetOpen,
  editingContact = null // Nueva prop para aislamiento
}: { 
  children: React.ReactNode, 
  defaultValues?: any,
  open?: boolean,
  setOpen?: (open: boolean) => void,
  editingContact?: any
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalSetOpen ?? setInternalOpen;

  const queryClient = useQueryClient();
  const upsert = useServerFn(upsertContact);
  const getTagsFn = useServerFn(listContactTags);
  const getContactTagsFn = useServerFn(listContactTagsForContact);
  const assignTagFn = useServerFn(assignTagToContact);
  const removeTagFn = useServerFn(removeTagFromContact);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: allTags } = useQuery({
    queryKey: ["contact-tags"],
    queryFn: () => getTagsFn(),
  });

  const { data: contactTags } = useQuery({
    queryKey: ["contact-tags", defaultValues?.id],
    queryFn: () => {
      if (!defaultValues?.id) return [];
      return getContactTagsFn({ data: { contact_id: defaultValues.id } });
    },
    enabled: Boolean(defaultValues?.id) && open,
  });

  useEffect(() => {
    if (contactTags && Array.isArray(contactTags)) {
      setSelectedTagIds(contactTags.filter((t: any) => t && t.id).map((t: any) => t.id));
    } else {
      setSelectedTagIds([]);
    }
  }, [contactTags]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: defaultValues?.first_name || "",
      last_name: defaultValues?.last_name || "",
      phone: defaultValues?.phone || "",
      email: defaultValues?.email || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        first_name: defaultValues?.first_name || "",
        last_name: defaultValues?.last_name || "",
        phone: defaultValues?.phone || "",
        email: defaultValues?.email || "",
      });
    }
  }, [open, defaultValues, form]);

  const toggleTag = async (tagId: string) => {
    if (!defaultValues?.id) {
      setSelectedTagIds(prev => 
        prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
      );
      return;
    }

    try {
      if (selectedTagIds.includes(tagId)) {
        await removeTagFn({ data: { contact_id: defaultValues.id, tag_id: tagId } });
        setSelectedTagIds(prev => prev.filter(id => id !== tagId));
      } else {
        await assignTagFn({ data: { contact_id: defaultValues.id, tag_id: tagId } });
        setSelectedTagIds(prev => [...prev, tagId]);
      }
      queryClient.invalidateQueries({ queryKey: ["contact-tags", defaultValues.id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error: any) {
      toast.error("Error al actualizar etiqueta");
    }
  };

  const onSubmit = async (values: any) => {
    try {
      const result = await upsert({ data: { ...values, id: defaultValues?.id } });
      
      if (!defaultValues?.id && selectedTagIds.length > 0 && result?.id) {
        for (const tagId of selectedTagIds) {
          await assignTagFn({ data: { contact_id: result.id, tag_id: tagId } });
        }
      }

      toast.success("Contacto guardado correctamente");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (err) {
      toast.error("Error al guardar contacto");
    }
  };

  // PRUEBA DE DIAGNÓSTICO 3: Reintroducir useEffect de sincronización
  useEffect(() => {
    if (open && editingContact) {
      console.log("DIAGNÓSTICO PRUEBA 3: Ejecutando reset de formulario");
      form.reset({
        first_name: defaultValues?.first_name || "",
        last_name: defaultValues?.last_name || "",
        phone: defaultValues?.phone || "",
        email: defaultValues?.email || "",
      });
    }
  }, [open, defaultValues, form, editingContact]);

  if (editingContact !== null) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PRUEBA 3 — EFECTOS DE SINCRONIZACIÓN</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4">
              <FormField control={form.control} name="first_name" render={({ field }) => (
                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="last_name" render={({ field }) => (
                <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="p-2 bg-muted text-xs rounded text-center">
                DIAGNÓSTICO: useEffect de sincronización ACTIVO (Prueba 3)
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues?.id ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="last_name" render={({ field }) => (
              <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <div className="space-y-2">
              <FormLabel>Etiquetas</FormLabel>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
                {allTags?.length === 0 && <span className="text-xs text-muted-foreground">No hay etiquetas creadas.</span>}
                {allTags?.filter((tag: any) => tag && tag.id)?.map((tag: any) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Badge 
                      key={tag.id} 
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105 flex items-center gap-1 py-1"
                      style={{ 
                        backgroundColor: isSelected ? (tag?.color || '#3b82f6') : 'transparent',
                        borderColor: tag?.color || '#3b82f6',
                        color: isSelected ? 'white' : (tag?.color || '#3b82f6')
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full">Guardar</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
