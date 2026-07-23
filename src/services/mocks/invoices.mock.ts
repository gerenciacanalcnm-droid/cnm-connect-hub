import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { id, pick, daysAgo, int, resetSeed } from "./seed";

const STATUS: InvoiceStatus[] = ["paid", "paid", "paid", "pending", "overdue", "draft"];
const CONCEPTS = [
  "Recarga de créditos SMS", "Plan Business mensual", "Servicios API premium",
  "Consumo adicional", "Servicios profesionales",
];

export function buildInvoicesMock(count = 36): Invoice[] {
  resetSeed(0xFAC7);
  const items: Invoice[] = [];
  for (let i = 0; i < count; i++) {
    const status = pick(STATUS);
    const issued = daysAgo(i * 10 + int(0, 3));
    items.push({
      id: id("inv"),
      number: `F-2026-${String(1000 + i).padStart(5, "0")}`,
      amount: pick([500, 1200, 2800, 6500, 12_000]),
      currency: "MXN",
      status,
      issuedAt: issued,
      dueAt: new Date(new Date(issued).getTime() + 15 * 86_400_000).toISOString(),
      paidAt: status === "paid" ? issued : undefined,
      concept: pick(CONCEPTS),
    });
  }
  return items;
}

export const invoicesMock = { list: buildInvoicesMock };
