/**
 * Catálogo de herramientas de CNM Nova.
 *
 * Cada herramienta se ejecuta con el cliente Supabase del usuario firmado,
 * por lo que RLS y multitenencia se aplican automáticamente. Adicionalmente
 * cada herramienta declara el rol mínimo y el permiso lógico requerido, que
 * se validan contra `nova_tools` antes de exponerla al modelo.
 *
 * SERVIDOR ÚNICAMENTE.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { EngineToolDef } from "./nova-engine.server";

type Sb = SupabaseClient<Database>;

export interface ToolContext {
  supabase: Sb;
  companyId: string;
  userId: string;
}

export interface NovaToolImpl {
  code: string;
  parameters: Record<string, unknown>;
  run(ctx: ToolContext, args: Record<string, unknown>): Promise<unknown>;
}

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });

export const NOVA_TOOL_IMPLS: Record<string, NovaToolImpl> = {
  get_sms_balance: {
    code: "get_sms_balance",
    parameters: obj({}),
    async run({ supabase, companyId }) {
      const { data } = await supabase
        .from("companies")
        .select("name, balance, currency, plan_code")
        .eq("id", companyId)
        .maybeSingle();
      return data ?? { balance: 0, currency: "COP" };
    },
  },

  get_campaigns: {
    code: "get_campaigns",
    parameters: obj({
      status: str("Filtrar por estado: draft, scheduled, running, completed, cancelled, failed."),
      limit: num("Número máximo de campañas (1-25)."),
    }),
    async run({ supabase, companyId }, args) {
      let q = supabase
        .from("campaigns")
        .select(
          "name, channel, status, total_recipients, total_sent, total_delivered, total_failed, cost, scheduled_at, created_at",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(args["limit"] ?? 10), 25));
      if (typeof args["status"] === "string") q = q.eq("status", args["status"] as never);
      const { data } = await q;
      return data ?? [];
    },
  },

  get_contacts: {
    code: "get_contacts",
    parameters: obj({
      search: str("Texto a buscar en teléfono, nombre o email."),
      tag: str("Etiqueta exacta del contacto."),
      limit: num("Número máximo de contactos (1-25)."),
    }),
    async run({ supabase, companyId }, args) {
      let q = supabase
        .from("contacts")
        .select("first_name, last_name, phone, email, tags, opt_in, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(args["limit"] ?? 10), 25));
      const search = args["search"];
      if (typeof search === "string" && search.trim()) {
        q = q.or(
          `phone.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }
      if (typeof args["tag"] === "string") q = q.contains("tags", [args["tag"]]);
      const { data, count } = await q;
      return { contacts: data ?? [], count: count ?? data?.length ?? 0 };
    },
  },

  get_crm: {
    code: "get_crm",
    parameters: obj({}),
    async run({ supabase, companyId }) {
      const [groups, contacts] = await Promise.all([
        supabase
          .from("contact_lists")
          .select("name, description")
          .eq("company_id", companyId)
          .limit(20),
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
      ]);
      return { groups: groups.data ?? [], totalContacts: contacts.count ?? 0 };
    },
  },

  get_dashboard: {
    code: "get_dashboard",
    parameters: obj({}),
    async run({ supabase, companyId }) {
      const [company, campaigns, contacts, sms] = await Promise.all([
        supabase.from("companies").select("balance, currency").eq("id", companyId).maybeSingle(),
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabase
          .from("sms_messages")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
      ]);
      return {
        balance: company.data?.balance ?? 0,
        currency: company.data?.currency ?? "COP",
        campaigns: campaigns.count ?? 0,
        contacts: contacts.count ?? 0,
        smsSent: sms.count ?? 0,
      };
    },
  },

  create_contact: {
    code: "create_contact",
    parameters: obj(
      {
        phone: str("Teléfono en formato internacional."),
        first_name: str("Nombre del contacto."),
        last_name: str("Apellido del contacto."),
        email: str("Correo electrónico."),
      },
      ["phone"],
    ),
    async run({ supabase, companyId, userId }, args) {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          company_id: companyId,
          phone: String(args["phone"]),
          first_name: (args["first_name"] as string) ?? null,
          last_name: (args["last_name"] as string) ?? null,
          email: (args["email"] as string) ?? null,
          created_by: userId,
        })
        .select("id, phone, first_name, last_name")
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, contact: data };
    },
  },

  create_campaign: {
    code: "create_campaign",
    parameters: obj(
      {
        name: str("Nombre de la campaña."),
        channel: str("Canal: sms o whatsapp."),
        message_body: str("Cuerpo del mensaje."),
      },
      ["name"],
    ),
    async run({ supabase, companyId, userId }, args) {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          company_id: companyId,
          name: String(args["name"]),
          channel: (args["channel"] === "whatsapp" ? "whatsapp" : "sms") as never,
          message_body: (args["message_body"] as string) ?? null,
          status: "draft" as never,
          created_by: userId,
        })
        .select("id, name, status, channel")
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, campaign: data };
    },
  },

  generate_report: {
    code: "generate_report",
    parameters: obj({ days: num("Número de días hacia atrás (1-90).") }),
    async run({ supabase, companyId }, args) {
      const days = Math.min(Math.max(Number(args["days"] ?? 30), 1), 90);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [campaigns, sms] = await Promise.all([
        supabase
          .from("campaigns")
          .select("status, total_sent, total_delivered, total_failed, cost")
          .eq("company_id", companyId)
          .gte("created_at", since),
        supabase
          .from("sms_messages")
          .select("status, cost, segments")
          .eq("company_id", companyId)
          .gte("created_at", since),
      ]);
      const c = campaigns.data ?? [];
      const s = sms.data ?? [];
      return {
        periodDays: days,
        campaigns: c.length,
        sent: c.reduce((a, r) => a + (r.total_sent ?? 0), 0),
        delivered: c.reduce((a, r) => a + (r.total_delivered ?? 0), 0),
        failed: c.reduce((a, r) => a + (r.total_failed ?? 0), 0),
        campaignCost: c.reduce((a, r) => a + Number(r.cost ?? 0), 0),
        messages: s.length,
        messageCost: s.reduce((a, r) => a + Number(r.cost ?? 0), 0),
      };
    },
  },

  search_conversation: {
    code: "search_conversation",
    parameters: obj({ query: str("Texto a buscar en el historial de conversaciones.") }, ["query"]),
    async run({ supabase, userId }, args) {
      const { data } = await supabase
        .from("nova_conversations")
        .select("id, title, created_at, is_favorite")
        .eq("user_id", userId)
        .ilike("title", `%${String(args["query"])}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  },

  search_invoice: {
    code: "search_invoice",
    parameters: obj({ number: str("Número de factura."), status: str("Estado de la factura.") }),
    async run({ supabase, companyId }, args) {
      let q = supabase
        .from("invoices")
        .select("number, status, total, currency, issued_at, due_at, paid_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (typeof args["number"] === "string") q = q.ilike("number", `%${args["number"]}%`);
      if (typeof args["status"] === "string") q = q.eq("status", args["status"] as never);
      const { data } = await q;
      return data ?? [];
    },
  },

  search_recharge: {
    code: "search_recharge",
    parameters: obj({ status: str("Estado: pending, completed, failed, refunded.") }),
    async run({ supabase, companyId }, args) {
      let q = supabase
        .from("recharges")
        .select(
          "amount, currency, status, payment_method, payment_reference, created_at, completed_at",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (typeof args["status"] === "string") q = q.eq("status", args["status"] as never);
      const { data } = await q;
      return data ?? [];
    },
  },

  get_whatsapp_conversations: {
    code: "get_whatsapp_conversations",
    parameters: obj({
      status: str("Filtrar por estado: open, pending, closed, archived."),
      limit: num("Número máximo de conversaciones (1-25)."),
    }),
    async run({ supabase, companyId }, args) {
      const limit = Math.min(Number(args["limit"] ?? 10) || 10, 25);
      let q = supabase
        .from("whatsapp_conversations")
        .select(
          "id, contact_name, contact_phone, status, unread_count, last_message_at, last_message_preview",
        )
        .eq("company_id", companyId)
        .order("last_message_at", { ascending: false })
        .limit(limit);
      if (typeof args["status"] === "string") q = q.eq("status", args["status"] as never);
      const { data } = await q;
      return data ?? [];
    },
  },

  get_whatsapp_templates: {
    code: "get_whatsapp_templates",
    parameters: obj({ limit: num("Número máximo de plantillas (1-25).") }),
    async run({ supabase, companyId }, args) {
      const limit = Math.min(Number(args["limit"] ?? 10) || 10, 25);
      const { data } = await supabase
        .from("whatsapp_templates")
        .select("id, name, category, language, status, body, variables, version")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
  },

  get_whatsapp_campaigns: {
    code: "get_whatsapp_campaigns",
    parameters: obj({ limit: num("Número máximo de campañas (1-25).") }),
    async run({ supabase, companyId }, args) {
      const limit = Math.min(Number(args["limit"] ?? 10) || 10, 25);
      const { data } = await supabase
        .from("whatsapp_campaigns")
        .select(
          "id, name, status, scheduled_at, total_recipients, total_sent, total_delivered, total_read, total_failed, cost",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
  },

  send_sms: {
    code: "send_sms",
    parameters: obj({ phone: str("Teléfono destino."), body: str("Mensaje a enviar.") }, [
      "phone",
      "body",
    ]),
    async run() {
      return {
        ok: false,
        reason:
          "El envío de SMS estará disponible al conectar el proveedor. Informa esto al usuario.",
      };
    },
  },

  send_whatsapp: {
    code: "send_whatsapp",
    parameters: obj({ phone: str("Teléfono destino."), body: str("Mensaje a enviar.") }, [
      "phone",
      "body",
    ]),
    async run() {
      return {
        ok: false,
        reason:
          "El envío de WhatsApp estará disponible al conectar el proveedor. Informa esto al usuario.",
      };
    },
  },
};

const ROLE_RANK: Record<string, number> = {
  viewer: 1,
  agent: 2,
  manager: 3,
  company_admin: 4,
  super_admin: 5,
};

export interface ToolRow {
  code: string;
  name: string;
  description: string;
  min_role: string;
  is_enabled: boolean;
  is_ready: boolean;
}

/** Filtra el catálogo por RBAC y estado, y lo traduce al formato del motor. */
export function buildToolDefs(rows: ToolRow[], userRole: string): EngineToolDef[] {
  const rank = ROLE_RANK[userRole] ?? 0;
  return rows
    .filter((t) => t.is_enabled && NOVA_TOOL_IMPLS[t.code])
    .filter((t) => rank >= (ROLE_RANK[t.min_role] ?? 5))
    .map((t) => ({
      type: "function" as const,
      function: {
        name: t.code,
        description: t.description || t.name,
        parameters: NOVA_TOOL_IMPLS[t.code]!.parameters,
      },
    }));
}
