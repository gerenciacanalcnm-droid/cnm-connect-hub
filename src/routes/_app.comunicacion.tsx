import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendSms } from "@/components/comunicacion/send-sms";
import { BulkSend } from "@/components/comunicacion/bulk-send";
import { ScheduleSms } from "@/components/comunicacion/schedule-sms";
import { SmsHistory } from "@/components/comunicacion/sms-history";
import { Templates } from "@/components/comunicacion/templates";
import { Groups } from "@/components/comunicacion/groups";
import { Importer } from "@/components/comunicacion/importer";
import { CampaignsList } from "@/components/comunicacion/campaigns-list";

export const Route = createFileRoute("/_app/comunicacion")({
  head: () => ({
    meta: [
      { title: "Comunicación · SMS CNM" },
      { name: "description", content: "Centro SMS: envíos individuales, masivos, programados, plantillas, grupos, importador y campañas." },
    ],
  }),
  component: ComunicacionPage,
});

function ComunicacionPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Centro de Comunicación"
        description="Envía, programa y automatiza toda tu mensajería SMS desde un único lugar."
      />
      <Tabs defaultValue="enviar" className="w-full">
        <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="enviar">Enviar</TabsTrigger>
          <TabsTrigger value="masivo">Masivo</TabsTrigger>
          <TabsTrigger value="programar">Programar</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="importar">Importar</TabsTrigger>
          <TabsTrigger value="campanas" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Campañas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="enviar"><SendSms /></TabsContent>
        <TabsContent value="masivo"><BulkSend /></TabsContent>
        <TabsContent value="programar"><ScheduleSms /></TabsContent>
        <TabsContent value="historial"><SmsHistory /></TabsContent>
        <TabsContent value="plantillas"><Templates /></TabsContent>
        <TabsContent value="grupos"><Groups /></TabsContent>
        <TabsContent value="importar"><Importer /></TabsContent>
        <TabsContent value="campanas"><CampaignsList /></TabsContent>
      </Tabs>
    </div>
  );
}
