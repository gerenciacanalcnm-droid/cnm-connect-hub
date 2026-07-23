import { useQuery } from "@tanstack/react-query";
import { userRepository } from "@/repositories/user.repository";
import { queryKeys } from "./queries/keys";

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: () => userRepository.list() });
}
export function useCurrentUser() {
  return useQuery({ queryKey: queryKeys.currentUser, queryFn: () => userRepository.current() });
}
