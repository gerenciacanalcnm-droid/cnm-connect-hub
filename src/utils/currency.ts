export function formatCurrency(
  amount: number,
  currency = "COP",
  locale = "es-CO",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrency(text: string): number {
  const digits = text.replace(/[^\d.-]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}
