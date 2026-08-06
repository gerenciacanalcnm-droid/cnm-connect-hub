import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, MessageCircle, Mail, Inbox, Settings2 } from "lucide-react";
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
import { ChannelOverview } from "@/components/comunicacion/channel-overview";
import { WhatsAppAccounts } from "@/components/comunicacion/whatsapp-accounts";
import { UnifiedTemplates } from "@/components/comunicacion/unified-templates";
import { ConversationCenter } from "@/components/comunicacion/conversation-center";
import { EmailMarketing } from "@/components/comunicacion/email-marketing";
import { CommunicationSettings } from "@/components/comunicacion/communication-settings";

export const Route = createFileRoute("/_app/comunicacion")({
  head: () => ({
    meta: [
      { title: "Communication Hub · SMS CNM" },
      {
        name: "description",
        content:
          "Centro omnicanal: SMS, WhatsApp Business y Email con plantillas unificadas, campañas e historial.",
      },
    ],
  }),
  component: ComunicacionPage,
});

function ComunicacionPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Communication Hub"
        description="Gestiona SMS, WhatsApp Business y Email desde un único centro omnicanal."
      />

      <div className="mb-6">
        <ChannelOverview />
      </div>

      <Tabs defaultValue="enviar" className="w-full">
        <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-13">
          <TabsTrigger value="enviar">Enviar</TabsTrigger>
          <TabsTrigger value="masivo">Masivo</TabsTrigger>
          <TabsTrigger value="programar">Programar</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="unificadas">Unificadas</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="importar">Importar</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="campanas" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Campañas
          </TabsTrigger>
          <TabsTrigger value="conversaciones" className="gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> Conversaciones
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email
          </TabsTrigger>
          <TabsTrigger value="ajustes" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> Ajustes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="enviar">
          <SendSms />
        </TabsContent>
        <TabsContent value="masivo">
          <BulkSend />
        </TabsContent>
        <TabsContent value="programar">
          <ScheduleSms />
        </TabsContent>
        <TabsContent value="historial">
          <SmsHistory />
        </TabsContent>
        <TabsContent value="plantillas">
          <Templates />
        </TabsContent>
        <TabsContent value="unificadas">
          <UnifiedTemplates />
        </TabsContent>
        <TabsContent value="grupos">
          <Groups />
        </TabsContent>
        <TabsContent value="importar">
          <Importer />
        </TabsContent>
        <TabsContent value="whatsapp">
          <WhatsAppAccounts />
        </TabsContent>
        <TabsContent value="campanas">
          <CampaignsList />
        </TabsContent>
        <TabsContent value="conversaciones">
          <ConversationCenter />
        </TabsContent>
        <TabsContent value="email">
          <EmailMarketing />
        </TabsContent>
        <TabsContent value="ajustes">
          <CommunicationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
