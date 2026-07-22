import type { Role } from "@/constants/roles";
import type { Permission } from "@/constants/permissions";
import { rolePolicies } from "./policies";

export function permissionsForRoles(roles: Role[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of roles) for (const p of rolePolicies[r] ?? []) set.add(p);
  return set;
}

export function hasPermission(roles: Role[], permission: Permission): boolean {
  return permissionsForRoles(roles).has(permission);
}

export function hasAnyPermission(roles: Role[], permissions: Permission[]): boolean {
  const set = permissionsForRoles(roles);
  return permissions.some((p) => set.has(p));
}

export function hasAllPermissions(roles: Role[], permissions: Permission[]): boolean {
  const set = permissionsForRoles(roles);
  return permissions.every((p) => set.has(p));
}
