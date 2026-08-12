import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTable } from "@/components/crm/contacts-table";
import { Segments } from "@/components/crm/segments";
import { Pipeline } from "@/components/crm/pipeline";
import { UnifiedTimeline } from "@/components/crm/unified-timeline";
import { ConversationCenter } from "@/components/comunicacion/conversation-center";
import { ContactCenterHub } from "@/components/crm/contact-center/ContactCenterHub";


export const Route = createFileRoute("/_app/crm")({
  head: () => ({
    meta: [
      { title: "CRM · SMS CNM" },
      { name: "description", content: "Contactos, segmentos y pipeline de oportunidades." },
    ],
  }),
  component: ContactCenterPage,
});

function ContactCenterPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <ContactCenterHub />
    </div>
  );
}
