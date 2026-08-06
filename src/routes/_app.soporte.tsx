import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupportTickets } from "@/components/soporte/support-tickets";
import { HelpCenter } from "@/components/soporte/help-center";
import { ServiceStatus } from "@/components/soporte/service-status";

export const Route = createFileRoute("/_app/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte · SMS CNM" },
      { name: "description", content: "Tickets, centro de ayuda y estado del servicio SMS CNM." },
    ],
  }),
  component: SoportePage,
});

function SoportePage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Soporte"
        description="Tickets, base de conocimiento y estado de la plataforma."
      />
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="ayuda">Centro de ayuda</TabsTrigger>
          <TabsTrigger value="estado">Estado del servicio</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
          <SupportTickets />
        </TabsContent>
        <TabsContent value="ayuda">
          <HelpCenter />
        </TabsContent>
        <TabsContent value="estado">
          <ServiceStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
