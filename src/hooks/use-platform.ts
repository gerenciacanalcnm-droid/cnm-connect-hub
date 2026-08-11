import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queries/keys";
import {
  listFeatureFlags,
  listPermissions,
  listRolePermissions,
  listCompanies,
  getCurrentCompany,
  listContactGroups,
  upsertContactGroup,
  deleteContactGroup,
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

export function useContactGroups() {
  return useQuery({
    queryKey: ["contact-groups"],
    queryFn: () => listContactGroups(),
  });
}

export function useContactGroupMutations() {
  const qc = useQueryClient();
  const upsert = useMutation({
    mutationFn: (input: any) => upsertContactGroup({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-groups"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteContactGroup({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-groups"] }),
  });
  return { upsert, remove };
}
