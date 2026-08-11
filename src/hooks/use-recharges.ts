import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commercialWriteRepository as w } from "@/repositories/commercial.repository";
import { commercialKeys as key } from "./use-commercial";

export function useRechargeMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: key("recharges") });
    void qc.invalidateQueries({ queryKey: key("wallets") });
    void qc.invalidateQueries({ queryKey: key("wallet-transactions") });
  };

  const review = useMutation({
    mutationFn: (v: { id: string; status: string; note: string }) =>
      w.reviewRecharge(v.id, v.status, v.note),
    onSuccess: invalidate,
  });
  return { review };
}

export function useCreateRecharge() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: key("recharges") });
    void qc.invalidateQueries({ queryKey: key("wallets") });
  };

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => w.createRecharge(input),
    onSuccess: invalidate,
  });
}

// Estos hooks son legacy y se mantienen vacíos para evitar errores de importación
// hasta que se limpien los componentes que los usan.
export function useRechargePackages() {
  return { data: [], isLoading: false };
}
export function useBalance() {
  return { data: { amount: 0, currency: "COP", smsCredits: 0 }, isLoading: false };
}
export function useRecharges() {
  return { data: [], isLoading: false };
}
