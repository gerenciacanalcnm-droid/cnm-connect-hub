import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, MessageCircle, Mail, Inbox, Settings2, Send } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendSms } from "@/components/comunicacion/send-sms";
import { SmsHistory } from "@/components/comunicacion/sms-history";
import { ChannelOverview } from "@/components/comunicacion/channel-overview";
import { WhatsAppAccounts } from "@/components/comunicacion/whatsapp-accounts";
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
        <TabsList className="mb-6 flex overflow-x-auto h-auto w-full gap-1 p-1 bg-muted/50">
          <TabsTrigger value="enviar" className="gap-1.5 flex-1 min-w-[100px]">
            <Send className="h-3.5 w-3.5" /> SMS
          </TabsTrigger>
          <TabsTrigger value="conversaciones" className="gap-1.5 flex-1 min-w-[130px]">
            <Inbox className="h-3.5 w-3.5" /> Conversaciones
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5 flex-1 min-w-[100px]">
            <Inbox className="h-3.5 w-3.5" /> Historial
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5 flex-1 min-w-[110px]">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5 flex-1 min-w-[90px]">
            <Mail className="h-3.5 w-3.5" /> Email
          </TabsTrigger>
          <TabsTrigger value="ajustes" className="gap-1.5 flex-1 min-w-[90px]">
            <Settings2 className="h-3.5 w-3.5" /> Ajustes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="enviar">
          <SendSms />
        </TabsContent>
        <TabsContent value="conversaciones">
          <ConversationCenter />
        </TabsContent>
        <TabsContent value="historial">
          <SmsHistory />
        </TabsContent>
        <TabsContent value="whatsapp">
          <WhatsAppAccounts />
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
