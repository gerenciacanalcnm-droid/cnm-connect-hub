import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queries/keys";
import {
  listFeatureFlags,
  listPermissions,
  listRolePermissions,
  listCompanies,
  getCurrentCompany,
  listContactLists,
  upsertContactList,
  deleteContactList,
} from "@/lib/platform.functions";

export function useFeatureFlags() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => listFeatureFlags(),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => listPermissions(),
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.company,
    queryFn: () => listCompanies(),
  });
}

export function useCurrentCompany() {
  return useQuery({
    queryKey: ["current-company"],
    queryFn: () => getCurrentCompany(),
  });
}

export function useContactLists() {
  return useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => listContactLists(),
  });
}

export function useContactListMutations() {
  const qc = useQueryClient();
  const upsert = useMutation({
    mutationFn: (input: any) => upsertContactList({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-lists"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteContactList({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-lists"] }),
  });
  return { upsert, remove };
}
