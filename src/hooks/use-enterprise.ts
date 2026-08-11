import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService, campaignService } from "@/services/enterprise.service";
import { Contact } from "@/schemas/enterprise";

export const useContacts = () => {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactService.getAll(),
  });

  const createContactMutation = useMutation({
    mutationFn: (data: Contact) => contactService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  return {
    contactsQuery,
    createContactMutation,
  };
};

export const useCampaigns = () => {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignService.getAll(),
  });
};
