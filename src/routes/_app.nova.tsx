import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Settings, BrainCircuit } from "lucide-react";
import { NovaConfigPanel } from "@/components/nova/nova-config-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NovaChat } from "@/components/nova/nova-chat";

export const Route = createFileRoute("/_app/nova")({
  head: () => ({
    meta: [
      { title: "CNM Nova · SMS CNM" },
      {
        name: "description",
        content: "Configura tu asistente inteligente y base de conocimiento.",
      },
    ],
  }),
  component: NovaPage,
});

function NovaPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="CNM Nova"
        description="Gestiona la inteligencia y el conocimiento de tu asistente copiloto."
        actions={
          <Badge variant="secondary" className="gap-1.5 bg-nova-soft text-nova">
            <Sparkles className="h-3 w-3" /> IA Enterprise
          </Badge>
        }
      />
      
      <Tabs defaultValue="setup" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="setup" className="gap-2">
            <Settings className="h-4 w-4" /> Centro de Control
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <BrainCircuit className="h-4 w-4" /> Playground (Pruebas)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup">
          <NovaConfigPanel />
        </TabsContent>
        
        <TabsContent value="chat">
          <NovaChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}

