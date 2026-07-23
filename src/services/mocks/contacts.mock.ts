import type { Contact } from "@/types/contact";
import { id, fullName, phone, email, tags, daysAgo, int, resetSeed } from "./seed";

export function buildContactsMock(count = 200): Contact[] {
  resetSeed(0xC047AC);
  const items: Contact[] = [];
  for (let i = 0; i < count; i++) {
    const name = fullName();
    const [first, ...rest] = name.split(" ");
    items.push({
      id: id("ct"),
      companyId: "cnm-1",
      firstName: first!,
      lastName: rest.join(" "),
      phone: phone(),
      email: email(name, i),
      tags: tags(int(1, 3)),
      createdAt: daysAgo(int(0, 365)),
    });
  }
  return items;
}

export const contactsMock = { list: buildContactsMock };
