import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/configuracion/profile-settings";
import { SecuritySettings } from "@/components/configuracion/security-settings";
import { PreferencesSettings } from "@/components/configuracion/preferences-settings";
import { WhatsAppChannelConfig } from "@/components/comunicacion/whatsapp-channel-config";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración · SMS CNM" },
      { name: "description", content: "Perfil, seguridad, sesiones y preferencias de cuenta." },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Configuración"
        description="Gestiona tu perfil, seguridad y preferencias personales."
      />
      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="preferencias">Preferencias</TabsTrigger>
          <TabsTrigger value="canales">Canales</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil"><ProfileSettings /></TabsContent>
        <TabsContent value="seguridad"><SecuritySettings /></TabsContent>
        <TabsContent value="preferencias"><PreferencesSettings /></TabsContent>
        <TabsContent value="canales"><WhatsAppChannelConfig /></TabsContent>
      </Tabs>
    </div>
  );
}
