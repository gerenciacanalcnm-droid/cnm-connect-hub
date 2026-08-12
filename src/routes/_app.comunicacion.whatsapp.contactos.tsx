import { createFileRoute } from "@tanstack/react-router";
import { ContactsTable } from "@/components/crm/contacts-table";
import { PageHeader } from "@/components/common/page-header";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_app/comunicacion/whatsapp/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos de WhatsApp · SMS CNM" },
      { name: "description", content: "Gestión segmentada de contactos para campañas masivas de WhatsApp Business." },
    ],
  }),
  component: WhatsAppContactsPage,
});

function WhatsAppContactsPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Contactos de WhatsApp"
        description="Gestión segmentada de contactos para tus campañas de WhatsApp Business."
      />
      <div className="mt-6">
        <ContactsTable />
      </div>
    </div>
  );
}
