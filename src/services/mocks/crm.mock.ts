import type { Deal, DealStage, CrmActivity } from "@/types/crm";
import { id, pick, int, float, fullName, companyName, tags, daysAgo, hoursAgo, resetSeed } from "./seed";

const STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const TITLES = [
  "Migración plataforma SMS", "Contrato anual VIP", "Piloto CRM",
  "Ampliación API tokens", "Renovación 2027", "Paquete SMS Enterprise",
  "Integración WhatsApp", "Onboarding equipo Marketing",
];

export function buildDealsMock(count = 48): Deal[] {
  resetSeed(0xDEA1);
  return Array.from({ length: count }).map(() => {
    const stage = pick(STAGES);
    const probMap: Record<DealStage, number> = {
      lead: 10, qualified: 25, proposal: 50, negotiation: 75, won: 100, lost: 0,
    };
    return {
      id: id("deal"),
      title: pick(TITLES),
      contactName: fullName(),
      companyName: companyName(),
      amount: float(500, 45_000, 0),
      currency: "MXN",
      stage,
      probability: probMap[stage],
      ownerName: fullName(),
      nextActionAt: stage === "won" || stage === "lost" ? undefined : daysAgo(-int(0, 14)),
      updatedAt: hoursAgo(int(1, 240)),
      createdAt: daysAgo(int(1, 120)),
      tags: tags(int(1, 2)),
    };
  });
}

export function buildCrmActivitiesMock(dealId: string, count = 6): CrmActivity[] {
  resetSeed(dealId.length * 7);
  const types: CrmActivity["type"][] = ["note", "call", "email", "sms", "meeting", "task"];
  return Array.from({ length: count }).map(() => ({
    id: id("act"),
    dealId,
    type: pick(types),
    title: "Contacto con cliente",
    body: "Se envió cotización y agenda de seguimiento.",
    createdAt: hoursAgo(int(1, 300)),
    authorName: fullName(),
    done: Math.random() > 0.4,
  }));
}

export const crmMock = { listDeals: buildDealsMock, listActivities: buildCrmActivitiesMock };
