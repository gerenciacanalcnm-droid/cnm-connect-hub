export function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "");
}

export function isE164(input: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhone(input));
}

export function formatPhone(input: string): string {
  const p = normalizePhone(input);
  if (!p.startsWith("+")) return p;
  return p.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, "$1 $2 $3 $4");
}
