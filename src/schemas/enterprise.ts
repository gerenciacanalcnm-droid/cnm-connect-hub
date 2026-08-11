import { z } from "zod";

export const contactSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(8, "Teléfono inválido"),
  company: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "blocked"]).default("active"),
});

export const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "Mínimo 3 caracteres"),
  type: z.enum(["sms", "whatsapp", "email"]),
  content: z.string().min(1, "Contenido es requerido"),
  scheduledAt: z.date().optional(),
  segmentId: z.string().uuid().optional(),
  status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).default("draft"),
});

export const smsSchema = z.object({
  recipients: z.array(z.string()).min(1, "Al menos un destinatario"),
  content: z.string().min(1, "Contenido es requerido").max(160, "Máximo 160 caracteres para SMS estándar"),
  senderId: z.string().optional(),
  scheduledAt: z.date().optional(),
});

export type Contact = z.infer<typeof contactSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type SmsForm = z.infer<typeof smsSchema>;
