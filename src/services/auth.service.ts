import type { User } from "@/types/user";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthService {
  signInWithPassword(email: string, password: string): Promise<AuthTokens>;
  signInWithGoogle(idToken: string): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  signOut(): Promise<void>;
  me(): Promise<User>;
}

export const authService: AuthService = {
  async signInWithPassword() {
    throw new Error("authService.signInWithPassword not implemented");
  },
  async signInWithGoogle() {
    throw new Error("authService.signInWithGoogle not implemented");
  },
  async refresh() {
    throw new Error("authService.refresh not implemented");
  },
  async signOut() {
    return;
  },
  async me() {
    throw new Error("authService.me not implemented");
  },
};
