import { useMemo, useState, useEffect } from "react";
import { Plus, Mail, Phone, MessageCircle, MessageSquare, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import type { ColumnDef } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
import { SkeletonTable } from "@/components/common/skeleton-table";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContacts } from "@/hooks/use-contacts";
import type { Contact } from "@/types/contact";
import { toast } from "sonner";
import { ContactFormDialog } from "./contact-center/ContactFormDialog";
import { deleteContact } from "@/lib/contacts.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { listContactTagsForContact } from "@/lib/tags.functions";


function initials(c: Contact) {
  return `${c.firstName[0] ?? ""}${c.lastName?.[0] ?? ""}`.toUpperCase();
}

export function ContactsTable() {
  const { data, isLoading, error, refetch } = useContacts({ pageSize: 200 });
  const [selected, setSelected] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  
  const queryClient = useQueryClient();
  const removeContact = useServerFn(deleteContact);

  const handleDelete = async () => {
    if (!deletingContact) return;
    try {
      await removeContact({ data: { id: deletingContact.id } });
      toast.success("Contacto eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeletingContact(null);
    } catch (err) {
      toast.error("Error al eliminar contacto");
    }
  };

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [

      {
        id: "name",
        header: "Contacto",
        accessorFn: (c) => `${c.firstName} ${c.lastName ?? ""}`,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials(row.original)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium">
                {row.original.firstName} {row.original.lastName}
              </div>
              <div className="truncate text-xs text-muted-foreground">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Teléfono" },
      {
        accessorKey: "preferredChannel",
        header: "Canal preferido",
        cell: ({ row }) => {
          const ch = row.original.preferredChannel;
          const Icon = ch === "whatsapp" ? MessageCircle : ch === "email" ? Mail : MessageSquare;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs capitalize">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {ch}
            </span>
          );
        },
      },
      {
        accessorKey: "whatsappPhone",
        header: "WhatsApp",
        cell: ({ row }) => row.original.whatsappPhone ?? "—",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] capitalize">
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "lastConversationAt",
        header: "Última conversación",
        cell: ({ row }) =>
          row.original.lastConversationAt
            ? new Date(row.original.lastConversationAt).toLocaleDateString("es-CO")
            : "—",
      },
      {
        accessorKey: "tags",
        header: "Etiquetas",
        cell: ({ row }) => {
          const contact = row.original;
          const getContactTagsFn = useServerFn(listContactTagsForContact);
          
          const { data: realTags } = useQuery({
            queryKey: ["contact-tags", contact.id],
            queryFn: () => getContactTagsFn({ data: { contact_id: contact.id } }),
          });

          // Fallback to legacy tags if real tags are not yet loaded or empty
          const displayTags = realTags?.length ? realTags : (contact.tags || []).map(t => ({ name: t, color: '#94a3b8' }));

          return (
            <div className="flex flex-wrap gap-1">
              {displayTags.slice(0, 3).map((t: any) => (
                <Badge 
                  key={typeof t === 'string' ? t : t.id || t.name} 
                  variant="secondary" 
                  className="text-[10px] text-white"
                  style={{ backgroundColor: typeof t === 'string' ? '#94a3b8' : t.color }}
                >
                  {typeof t === 'string' ? t : t.name}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Alta",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("es-MX"),
      },
      {
        id: "actions",
        header: "Ver contacto",
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelected(contact)}>
                  <Eye className="mr-2 h-4 w-4" /> Ver contacto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingContact(contact)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },

    ],
    [],
  );


  if (isLoading) return <SkeletonTable rows={8} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <DataTable
        data={data?.items ?? []}
        columns={columns}
        searchPlaceholder="Buscar por nombre, teléfono o email…"
        exportFilename="contactos"
        enableSelection
        onRowClick={(row) => setSelected(row)}
        toolbar={
          <ContactFormDialog>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo contacto
            </Button>
          </ContactFormDialog>
        }
      />

      {/* Modal de Edición */}
      {editingContact && (
        <ContactFormDialog 
          open={!!editingContact} 
          setOpen={(o) => !o && setEditingContact(null)}
          editingContact={editingContact} // Pasar para aislamiento en Prueba 1
          defaultValues={{
            id: editingContact.id,
            first_name: editingContact.firstName,
            last_name: editingContact.lastName,
            phone: editingContact.phone,
            email: editingContact.email
          }}
        >
          <span className="hidden" />
        </ContactFormDialog>
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={!!deletingContact} onOpenChange={(o) => !o && setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el contacto de tus listas y dejará de estar disponible para futuras campañas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar contacto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{initials(selected)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>
                      {selected.firstName} {selected.lastName}
                    </SheetTitle>
                    <SheetDescription>{selected.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="gap-1.5" 
                    onClick={() => {
                      setSelected(null);
                      setEditingContact(selected);
                    }}
                  >
                    Editar contacto
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.location.href = `/crm?contactId=${selected.id}`}>
                    Ver en CRM
                  </Button>
                </div>
                <div className="rounded-lg border border-border p-3 text-sm">
                  <div className="text-xs uppercase text-muted-foreground">Teléfono</div>
                  <div className="mt-1 font-medium">{selected.phone}</div>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase text-muted-foreground">Etiquetas</div>
                  <div className="flex flex-wrap gap-1">
                    {/* Using a separate query component here would be cleaner, but for now we follow the pattern */}
                    {selected.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

