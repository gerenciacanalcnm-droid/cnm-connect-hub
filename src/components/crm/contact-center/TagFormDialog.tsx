import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { createContactTag, updateContactTag } from "@/lib/tags.functions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  color: z.string().optional().default("#3b82f6"),
});

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: any; // If provided, we are editing
}

export function TagFormDialog({ open, onOpenChange, tag }: TagFormDialogProps) {
  const queryClient = useQueryClient();
  const createTagFn = useServerFn(createContactTag);
  const updateTagFn = useServerFn(updateContactTag);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tag?.name || "",
      description: tag?.description || "",
      color: tag?.color || "#3b82f6",
    },
  });

  // Update form when tag changes (for editing)
  React.useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name,
        description: tag.description || "",
        color: tag.color || "#3b82f6",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        color: "#3b82f6",
      });
    }
  }, [tag, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (tag) {
        await updateTagFn({ data: { ...values, id: tag.id } });
        toast.success("Etiqueta actualizada exitosamente");
      } else {
        await createTagFn({ data: values });
        toast.success("Etiqueta creada exitosamente");
      }
      queryClient.invalidateQueries({ queryKey: ["contact-tags"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la etiqueta");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tag ? "Editar etiqueta" : "Nueva etiqueta"}</DialogTitle>
          <DialogDescription>
            {tag 
              ? "Modifica los detalles de la etiqueta existente." 
              : "Crea una nueva etiqueta para organizar tus contactos."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. VIP, Cliente Frecuente..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Para qué sirve esta etiqueta..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="p-1 h-10 w-20" {...field} />
                      <Input {...field} placeholder="#000000" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit">
                {tag ? "Guardar cambios" : "Crear etiqueta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
