import type { User } from "@/types/user";
import type { Role } from "@/constants/roles";
import type { Permission } from "@/constants/permissions";
import type { UserStatus } from "@/constants/status";
import { usersMock } from "./mocks/users.mock";
import { listUsers } from "@/lib/platform.functions";

export interface UserService {
  list(): Promise<User[]>;
  current(): Promise<User>;
}

export const userService: UserService = {
  async list() {
    try {
      const { profiles, roles } = (await listUsers()) as {
        profiles: { id: string; email: string | null; full_name: string | null; avatar_url: string | null; created_at: string }[];
        roles: { user_id: string; role: string }[];
      };
      if (!profiles.length) return usersMock.list();
      const rolesByUser = new Map<string, Role[]>();
      for (const r of roles) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as Role);
        rolesByUser.set(r.user_id, arr);
      }
      return profiles.map<User>((p) => ({
        id: p.id,
        email: p.email ?? "",
        name: p.full_name ?? p.email ?? "Usuario",
        avatarUrl: p.avatar_url ?? undefined,
        companyId: "00000000-0000-4000-8000-000000000001",
        roles: rolesByUser.get(p.id) ?? (["viewer"] as Role[]),
        permissions: [] as Permission[],
        status: "active" as UserStatus,
        createdAt: p.created_at,
      }));
    } catch (err) {
      console.error("[userService] fallback a mock:", err);
      return usersMock.list();
    }
  },
  async current() {
    const all = await this.list();
    return all[0]!;
  },
};
