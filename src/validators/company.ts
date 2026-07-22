export function isCompanyName(value: string): boolean {
  const v = value.trim();
  return v.length >= 2 && v.length <= 120;
}
