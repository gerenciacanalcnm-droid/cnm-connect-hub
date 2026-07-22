import { ROLES, type Role } from "@/constants/roles";
import { PERMISSIONS, type Permission } from "@/constants/permissions";

/**
 * Matriz base Rol → Permisos. Editable desde el Panel del Super Administrador.
 */
export const rolePolicies: Record<Role, Permission[]> = {
  [ROLES.superAdmin]: Object.values(PERMISSIONS),
  [ROLES.admin]: [
    PERMISSIONS.companyRead,
    PERMISSIONS.companyWrite,
    PERMISSIONS.smsSend,
    PERMISSIONS.smsRead,
    PERMISSIONS.campaignCreate,
    PERMISSIONS.campaignRead,
    PERMISSIONS.analyticsRead,
    PERMISSIONS.billingRead,
    PERMISSIONS.billingWrite,
    PERMISSIONS.usersRead,
    PERMISSIONS.usersWrite,
    PERMISSIONS.landingRead,
    PERMISSIONS.landingWrite,
  ],
  [ROLES.manager]: [
    PERMISSIONS.smsSend,
    PERMISSIONS.smsRead,
    PERMISSIONS.campaignCreate,
    PERMISSIONS.campaignRead,
    PERMISSIONS.analyticsRead,
    PERMISSIONS.billingRead,
    PERMISSIONS.usersRead,
  ],
  [ROLES.operator]: [
    PERMISSIONS.smsSend,
    PERMISSIONS.smsRead,
    PERMISSIONS.campaignRead,
  ],
  [ROLES.viewer]: [PERMISSIONS.smsRead, PERMISSIONS.analyticsRead, PERMISSIONS.campaignRead],
  [ROLES.affiliate]: [PERMISSIONS.analyticsRead],
  [ROLES.distributor]: [
    PERMISSIONS.usersRead,
    PERMISSIONS.usersWrite,
    PERMISSIONS.analyticsRead,
    PERMISSIONS.billingRead,
  ],
};
