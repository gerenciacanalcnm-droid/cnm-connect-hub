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
  component: CrmPage,
});

function CrmPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="CRM"
        description="Gestiona contactos, segmentos inteligentes y tu pipeline comercial."
      />
      <Tabs defaultValue="contactos" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="conversaciones">Conversaciones</TabsTrigger>
          <TabsTrigger value="segmentos">Segmentos</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="contactos">
          <ContactsTable />
        </TabsContent>
        <TabsContent value="conversaciones">
          <ConversationCenter />
        </TabsContent>
        <TabsContent value="segmentos">
          <Segments />
        </TabsContent>
        <TabsContent value="pipeline">
          <Pipeline />
        </TabsContent>
        <TabsContent value="timeline">
          <UnifiedTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
}
