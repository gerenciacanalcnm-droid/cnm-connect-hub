export const ROLES = {
  superAdmin: "super_admin",
  admin: "admin",
  manager: "manager",
  operator: "operator",
  viewer: "viewer",
  affiliate: "affiliate",
  distributor: "distributor",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
