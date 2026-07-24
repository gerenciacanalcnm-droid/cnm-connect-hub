/**
 * CompanyContext — empresa activa, alimentada por AuthContext.
 * Guarda selección en localStorage.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Company } from "@/types/company";
import { companyConfig } from "@/config/company.config";
import { useAuth } from "./auth-context";

type CompanyContextValue = {
  current: Company;
  available: Company[];
  switchTo: (id: string) => void;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);
const STORAGE_KEY = "cnm:active_company_id";
const FALLBACK = companyConfig as unknown as Company;

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { companies } = useAuth();
  const list: Company[] = useMemo(() => {
    const mapped = companies
      .map((m) => m.company)
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({
        ...FALLBACK,
        id: c.id,
        name: c.name,
        slug: c.slug,
        logoUrl: c.logo_url ?? FALLBACK.logoUrl,
      })) as Company[];
    return mapped.length ? mapped : [FALLBACK];
  }, [companies]);

  const [currentId, setCurrentId] = useState<string>(() => {
    if (typeof window === "undefined") return list[0]!.id;
    return localStorage.getItem(STORAGE_KEY) ?? list[0]!.id;
  });

  useEffect(() => {
    if (!list.find((c) => c.id === currentId)) setCurrentId(list[0]!.id);
  }, [list, currentId]);

  const current = list.find((c) => c.id === currentId) ?? list[0]!;

  const value = useMemo<CompanyContextValue>(
    () => ({
      current,
      available: list,
      switchTo: (id) => {
        if (list.find((c) => c.id === id)) {
          setCurrentId(id);
          if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
        }
      },
    }),
    [current, list],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCurrentCompany(): Company {
  return useContext(CompanyContext)?.current ?? FALLBACK;
}

export function useCompanyContext(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("CompanyProvider missing in tree");
  return ctx;
}
