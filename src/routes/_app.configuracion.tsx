import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración · SMS CNM" }] }),
  component: () => (
    <ModulePlaceholder
      icon={Settings}
      title="Configuración"
      description="Preferencias de cuenta, equipo, seguridad e integraciones."
      sections={[
        "Perfil y preferencias",
        "Miembros y roles",
        "Seguridad y 2FA",
        "Integraciones",
        "Notificaciones",
        "Idioma y región",
      ]}
    />
  ),
});
