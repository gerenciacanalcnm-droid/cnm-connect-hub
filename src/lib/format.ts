export function formatCurrency(value: number, currency = "COP", locale = "es-CO") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale = "es-CO") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatRelativeTime(iso: string, locale = "es-CO") {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diff);
  const H = 3_600_000, D = 86_400_000, M = 60_000;
  if (abs < H) return rtf.format(-Math.round(diff / M), "minute");
  if (abs < D) return rtf.format(-Math.round(diff / H), "hour");
  return rtf.format(-Math.round(diff / D), "day");
}

export function formatDateTime(iso: string, locale = "es-CO") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}
