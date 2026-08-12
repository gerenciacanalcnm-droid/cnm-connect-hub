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
  component: CrmPage,
});

function CrmPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="CRM Comercial"
        description="Gestión de pipeline, oportunidades y seguimiento de tratos."
      />
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
          <TabsTrigger value="actividades">Actividades</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Resumen Comercial</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Vista consolidada del rendimiento de ventas.</p>
          </div>
        </TabsContent>
        <TabsContent value="pipeline">
          <Pipeline />
        </TabsContent>
        <TabsContent value="oportunidades">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Gestión de Oportunidades</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Listado detallado de todas las negociaciones activas.</p>
          </div>
        </TabsContent>
        <TabsContent value="actividades">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Actividades y Tareas</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Llamadas, reuniones y seguimientos pendientes.</p>
          </div>
        </TabsContent>
        <TabsContent value="seguimiento">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Seguimiento Comercial</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Análisis de contactos y próximas acciones.</p>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <UnifiedTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
}
