/**
 * AuthContext — sesión Supabase real.
 * Escucha onAuthStateChange, expone user + roles + empresas + isSuperAdmin.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AuthProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type AuthCompanyMembership = {
  company_id: string;
  role: string;
  company: { id: string; name: string; slug: string; logo_url: string | null } | null;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  roles: string[]; // app_role values
  companies: AuthCompanyMembership[];
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [companies, setCompanies] = useState<AuthCompanyMembership[]>([]);
  const [loading, setLoading] = useState(true);

  async function hydrate(current: Session | null) {
    setSession(current);
    setUser(current?.user ?? null);
    if (!current?.user) {
      setProfile(null);
      setRoles([]);
      setCompanies([]);
      setLoading(false);
      return;
    }
    const uid = current.user.id;
    const [pRes, rRes, mRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, avatar_url").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase
        .from("company_members")
        .select("company_id, role, company:companies(id, name, slug, logo_url)")
        .eq("user_id", uid)
        .eq("is_active", true),
    ]);
    setProfile((pRes.data as AuthProfile | null) ?? {
      id: uid,
      email: current.user.email ?? null,
      full_name: (current.user.user_metadata?.full_name as string) ?? null,
      avatar_url: (current.user.user_metadata?.avatar_url as string) ?? null,
    });
    setRoles((rRes.data ?? []).map((r) => r.role as string));
    setCompanies((mRes.data ?? []) as unknown as AuthCompanyMembership[]);
    setLoading(false);
  }

  useEffect(() => {
    // Register listener first, then hydrate initial session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void hydrate(s);
    });
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user,
      profile,
      roles,
      companies,
      isSuperAdmin: roles.includes("super_admin"),
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refresh: async () => {
        const { data } = await supabase.auth.getSession();
        await hydrate(data.session);
      },
    }),
    [loading, session, user, profile, roles, companies],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
