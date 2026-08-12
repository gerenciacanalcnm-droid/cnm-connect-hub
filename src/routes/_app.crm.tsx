import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTable } from "@/components/crm/contacts-table";
import { Segments } from "@/components/crm/segments";
import { Pipeline } from "@/components/crm/pipeline";
import { UnifiedTimeline } from "@/components/crm/unified-timeline";
import { ConversationCenter } from "@/components/comunicacion/conversation-center";
import { ContactCenterHub } from "@/components/crm/contact-center/ContactCenterHub";


export const Route = createFileRoute("/_app/centro-de-contactos")({
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
        title="CRM Comercial"
        description="Gestión de pipeline, oportunidades y seguimiento comercial."
      />
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="segmentos">Segmentos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline">
          <Pipeline />
        </TabsContent>
        <TabsContent value="segmentos">
          <Segments />
        </TabsContent>
        <TabsContent value="timeline">
          <UnifiedTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
}
