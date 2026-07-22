/**
 * CompanyContext — soporte multitenant.
 * Guarda la empresa activa y expone un switcher.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Company } from "@/types/company";
import { companyConfig } from "@/config/company.config";

type CompanyContextValue = {
  current: Company;
  available: Company[];
  switchTo: (id: string) => void;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({
  children,
  initial,
  available,
}: {
  children: ReactNode;
  initial?: Company;
  available?: Company[];
}) {
  const seed = (initial ?? (companyConfig as unknown as Company)) satisfies Company;
  const list = available ?? [seed];
  const [current, setCurrent] = useState<Company>(seed);

  const value = useMemo<CompanyContextValue>(
    () => ({
      current,
      available: list,
      switchTo: (id) => {
        const next = list.find((c) => c.id === id);
        if (next) setCurrent(next);
      },
    }),
    [current, list],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCurrentCompany(): Company {
  const ctx = useContext(CompanyContext);
  return ctx?.current ?? (companyConfig as unknown as Company);
}

export function useCompanyContext(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("CompanyProvider missing in tree");
  return ctx;
}
