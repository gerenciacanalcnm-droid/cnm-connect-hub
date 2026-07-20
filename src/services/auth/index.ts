/**
 * Servicio de autenticación — SMS CNM
 *
 * Arquitectura preparada para:
 *   - Login con email + contraseña
 *   - Google OAuth 2.0
 *   - JWT (access + refresh)
 *   - Roles / permisos (RBAC)
 *
 * Sin implementación. Solo contratos.
 */

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export interface AuthProvider {
  signInWithPassword(email: string, password: string): Promise<AuthTokens>;
  signInWithGoogle(idToken: string): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  signOut(): Promise<void>;
  me(): Promise<AuthUser>;
}
