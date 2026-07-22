const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
