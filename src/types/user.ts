import type { ID } from "./common";
import type { Role } from "@/constants/roles";
import type { Permission } from "@/constants/permissions";
import type { UserStatus } from "@/constants/status";

export interface User {
  id: ID;
  email: string;
  name: string;
  avatarUrl?: string;
  companyId: ID;
  roles: Role[];
  permissions: Permission[];
  status: UserStatus;
  createdAt: string;
}
