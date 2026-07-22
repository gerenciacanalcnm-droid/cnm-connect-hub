import { isE164 } from "@/utils/phone";
export function isPhone(value: string): boolean {
  return isE164(value);
}
