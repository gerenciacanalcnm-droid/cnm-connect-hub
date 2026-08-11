import { Contact, Campaign } from "@/schemas/enterprise";

export const mockContacts: Contact[] = [
  {
    id: "c1",
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan.perez@example.com",
    phone: "+573001234567",
    company: "Empresa A",
    tags: ["Cliente VIP", "Bogotá"],
    status: "active"
  },
  {
    id: "c2",
    firstName: "María",
    lastName: "García",
    email: "maria.garcia@example.com",
    phone: "+573109876543",
    company: "Independiente",
    tags: ["Interesado"],
    status: "active"
  },
  {
    id: "c3",
    firstName: "Carlos",
    lastName: "Rodríguez",
    phone: "+525512345678",
    tags: ["México", "Blacklist"],
    status: "blocked"
  }
];

export const mockCampaigns: Campaign[] = [
  {
    id: "cmp1",
    name: "Promoción Verano 2026",
    type: "sms",
    content: "¡Hola! Aprovecha 20% de descuento en toda la tienda este fin de semana.",
    status: "sent",
    scheduledAt: new Date("2026-07-15T10:00:00Z")
  },
  {
    id: "cmp2",
    name: "Lanzamiento Producto X",
    type: "whatsapp",
    content: "Estamos felices de presentarte el nuevo Producto X. Mira los detalles aquí...",
    status: "scheduled",
    scheduledAt: new Date("2026-08-20T14:30:00Z")
  }
];

export const mockSmsHistory = [
  { id: "sms1", to: "+573001234567", content: "Tu código de verificación es 1234", status: "delivered", sentAt: "2026-08-10T15:20:00Z" },
  { id: "sms2", to: "+573109876543", content: "Recordatorio de cita: Mañana 10:00 AM", status: "sent", sentAt: "2026-08-11T09:00:00Z" }
];
