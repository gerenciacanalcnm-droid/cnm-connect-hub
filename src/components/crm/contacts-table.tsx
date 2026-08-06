import { useMemo, useState } from "react";
import { Plus, Mail, Phone, MessageCircle, MessageSquare } from "lucide-react";
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
import { useContacts } from "@/hooks/use-contacts";
import type { Contact } from "@/types/contact";
import { toast } from "sonner";

function initials(c: Contact) {
  return `${c.firstName[0] ?? ""}${c.lastName?.[0] ?? ""}`.toUpperCase();
}

export function ContactsTable() {
  const { data, isLoading, error, refetch } = useContacts({ pageSize: 200 });
  const [selected, setSelected] = useState<Contact | null>(null);

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
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Alta",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("es-MX"),
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
        onRowClick={setSelected}
        toolbar={
          <Button className="gap-2" onClick={() => toast.info("Crear contacto próximamente")}>
            <Plus className="h-4 w-4" /> Nuevo contacto
          </Button>
        }
      />
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
                  <Button size="sm" className="gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Llamar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Button>
                </div>
                <div className="rounded-lg border border-border p-3 text-sm">
                  <div className="text-xs uppercase text-muted-foreground">Teléfono</div>
                  <div className="mt-1 font-medium">{selected.phone}</div>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase text-muted-foreground">Etiquetas</div>
                  <div className="flex flex-wrap gap-1">
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
