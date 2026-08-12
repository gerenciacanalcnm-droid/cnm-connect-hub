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
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  setOpen: externalSetOpen 
}: { 
  children: React.ReactNode, 
  defaultValues?: any,
  open?: boolean,
  setOpen?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalSetOpen ?? setInternalOpen;

  const upsert = useServerFn(upsertContact);
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || { first_name: "", last_name: "", phone: "", email: "" },
  });

  const onSubmit = async (values: any) => {
    try {
      await upsert({ data: { ...values, id: defaultValues?.id } });
      toast.success("Contacto guardado correctamente");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (err) {
      toast.error("Error al guardar contacto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
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
            <Button type="submit" className="w-full">Guardar</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
