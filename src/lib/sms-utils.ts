// SMS character-count helper. GSM-7 vs UCS-2 detection.
const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅå_ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = "^{}\\[~]|€";

export type Encoding = "GSM7" | "UCS2";

export function detectEncoding(text: string): Encoding {
  for (const ch of text) {
    if (!GSM7.includes(ch) && !GSM7_EXT.includes(ch)) return "UCS2";
  }
  return "GSM7";
}

export function countUnits(text: string, encoding: Encoding): number {
  if (encoding === "UCS2") return [...text].length;
  let n = 0;
  for (const ch of text) n += GSM7_EXT.includes(ch) ? 2 : 1;
  return n;
}

export function smsStats(text: string) {
  const encoding = detectEncoding(text);
  const units = countUnits(text, encoding);
  const single = encoding === "GSM7" ? 160 : 70;
  const multi = encoding === "GSM7" ? 153 : 67;
  const parts = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
  const cap = parts <= 1 ? single : parts * multi;
  return { encoding, units, parts, cap, remaining: Math.max(0, cap - units) };
}
