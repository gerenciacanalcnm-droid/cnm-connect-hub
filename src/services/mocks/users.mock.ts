import type { User } from "@/types/user";
import { ROLES } from "@/constants/roles";
import { PERMISSIONS } from "@/constants/permissions";
import { id, fullName, email, daysAgo, pick, resetSeed } from "./seed";

export function buildUsersMock(count = 12): User[] {
  resetSeed(0x0537);
  const roles = Object.values(ROLES);
  const perms = Object.values(PERMISSIONS) as unknown as string[];
  return Array.from({ length: count }).map((_, i) => {
    const name = fullName();
    return {
      id: id("usr"),
      email: email(name, i),
      name,
      companyId: "cnm-1",
      roles: [pick(roles)],
      permissions: perms.slice(0, 4) as User["permissions"],
      status: i === 0 ? "active" : pick(["active", "active", "invited", "inactive"] as const),
      createdAt: daysAgo(i * 12 + 5),
    };
  });
}

export const usersMock = { list: buildUsersMock };
