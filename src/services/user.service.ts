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

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  user_roles?: { role: string }[] | null;
};

function mapProfile(row: ProfileRow): User {
  const roles = (row.user_roles ?? []).map((r) => r.role as Role);
  return {
    id: row.id,
    email: row.email ?? "",
    name: row.full_name ?? row.email ?? "Usuario",
    avatarUrl: row.avatar_url ?? undefined,
    companyId: "00000000-0000-4000-8000-000000000001",
    roles: roles.length ? roles : (["viewer"] as Role[]),
    permissions: [] as Permission[],
    status: "active" as UserStatus,
    createdAt: row.created_at,
  };
}

export const userService: UserService = {
  async list() {
    try {
      const rows = (await listUsers()) as ProfileRow[];
      if (!rows.length) return usersMock.list();
      return rows.map(mapProfile);
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
