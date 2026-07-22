export function formatDate(input: string | Date, locale = "es-CO"): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

export function formatDateTime(input: string | Date, locale = "es-CO"): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function relativeFromNow(input: string | Date, locale = "es-CO"): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds || unit === "second") {
      return rtf.format(Math.round(diff / seconds), unit);
    }
  }
  return "";
}
