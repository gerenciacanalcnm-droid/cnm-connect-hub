import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Segments } from "@/components/crm/segments";
import { Pipeline } from "@/components/crm/pipeline";
import { UnifiedTimeline } from "@/components/crm/unified-timeline";

export const Route = createFileRoute("/_app/crm")({
  head: () => ({
    meta: [
      { title: "CRM Comercial · SMS CNM" },
      { name: "description", content: "Pipeline, oportunidades y seguimiento comercial." },
    ],
  }),
  component: CrmLegacyPage,
});

function CrmLegacyPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="CRM Comercial"
        description="Gestión de pipeline, oportunidades y seguimiento de tratos."
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
