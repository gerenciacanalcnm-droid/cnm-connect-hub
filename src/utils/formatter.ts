export function formatNumber(value: number, locale = "es-CO"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, digits = 1, locale = "es-CO"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}

export function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
