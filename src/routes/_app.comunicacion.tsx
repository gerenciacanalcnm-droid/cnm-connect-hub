import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, MessageCircle, Mail, Inbox, Settings2, Send, FileText, Calendar, Smartphone, LayoutTemplate, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendSms } from "@/components/comunicacion/send-sms";
import { SmsHistory } from "@/components/comunicacion/sms-history";
import { SendWhatsAppIndividual } from "@/components/comunicacion/send-whatsapp-individual";
import { WhatsAppTemplates } from "@/components/comunicacion/whatsapp-templates";
import { WhatsAppCampaigns } from "@/components/comunicacion/whatsapp-campaigns";
import { WhatsAppSurveys } from "@/components/comunicacion/whatsapp-surveys";
import { WhatsAppSchedules } from "@/components/comunicacion/whatsapp-schedules";
import { EmailMarketing } from "@/components/comunicacion/email-marketing";
import { CommunicationSettings } from "@/components/comunicacion/communication-settings";
import { ConversationCenter } from "@/components/comunicacion/conversation-center";
import { ContactsTable } from "@/components/crm/contacts-table";

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
        title="Comunicación"
        description="Gestiona SMS, WhatsApp Business y Email desde un único centro omnicanal."
      />

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="mb-6 flex overflow-x-auto h-auto w-full gap-1 p-1 bg-muted/50">
          <TabsTrigger value="inbox" className="gap-1.5 flex-1 min-w-[100px]">
            <Inbox className="h-3.5 w-3.5" /> Bandeja
          </TabsTrigger>
          <TabsTrigger value="enviar" className="gap-1.5 flex-1 min-w-[100px]">
            <Send className="h-3.5 w-3.5" /> Enviar SMS
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5 flex-1 min-w-[100px]">
            <Inbox className="h-3.5 w-3.5" /> Historial SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5 flex-1 min-w-[110px]">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="campanas" className="gap-1.5 flex-1 min-w-[110px]">
            <LayoutTemplate className="h-3.5 w-3.5" /> Campañas WA
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="gap-1.5 flex-1 min-w-[110px]">
            <FileText className="h-3.5 w-3.5" /> Plantillas WA
          </TabsTrigger>
          <TabsTrigger value="contactos" className="gap-1.5 flex-1 min-w-[110px]">
            <Users className="h-3.5 w-3.5" /> Contactos WA
          </TabsTrigger>
          <TabsTrigger value="encuestas" className="gap-1.5 flex-1 min-w-[110px]">
            <Smartphone className="h-3.5 w-3.5" /> Encuestas
          </TabsTrigger>
          <TabsTrigger value="programacion-wa" className="gap-1.5 flex-1 min-w-[110px]">
            <Calendar className="h-3.5 w-3.5" /> Programar WA
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5 flex-1 min-w-[90px]">
            <Mail className="h-3.5 w-3.5" /> Email
          </TabsTrigger>
          <TabsTrigger value="ajustes" className="gap-1.5 flex-1 min-w-[90px]">
            <Settings2 className="h-3.5 w-3.5" /> Ajustes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox">
          <ConversationCenter />
        </TabsContent>
        <TabsContent value="enviar">
          <SendSms />
        </TabsContent>
        <TabsContent value="historial">
          <SmsHistory />
        </TabsContent>
        <TabsContent value="whatsapp">
          <SendWhatsAppIndividual />
        </TabsContent>
        <TabsContent value="campanas">
          <WhatsAppCampaigns />
        </TabsContent>
        <TabsContent value="programacion-wa">
          <WhatsAppSchedules />
        </TabsContent>
        <TabsContent value="plantillas">
          <WhatsAppTemplates />
        </TabsContent>
        <TabsContent value="contactos">
          <ContactsTable />
        </TabsContent>
        <TabsContent value="encuestas">
          <WhatsAppSurveys />
        </TabsContent>
        <TabsContent value="email">
          <EmailMarketing />
        </TabsContent>
        <TabsContent value="ajustes">
          <CommunicationSettings />
        </TabsContent>
      </Tabs>
      <div className="mt-8 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Sprint completado
          </div>
        </div>
      </div>
    </div>
  );
}
