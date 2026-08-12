import { createFileRoute } from "@tanstack/react-router";
import { ContactCenterHub } from "@/components/crm/contact-center/ContactCenterHub";

export const Route = createFileRoute("/_app/centro-de-contactos")({
  head: () => ({
    meta: [
      { title: "Centro de Contactos · SMS CNM" },
      { name: "description", content: "Gestión centralizada de contactos, listas y segmentación multicanal." },
    ],
  }),
  component: ContactCenterPage,
});

function ContactCenterPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <ContactCenterHub />
    </div>
  );
}
