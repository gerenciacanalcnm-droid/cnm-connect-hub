import { useQuery } from "@tanstack/react-query";
import { landingRepository } from "@/repositories/landing.repository";
import { fallbackLandingContent, type LandingContent } from "@/config/landing-content";
import { queryKeys } from "./queries/keys";

export function useLanding(): { data: LandingContent; isLoading: boolean } {
  const q = useQuery({
    queryKey: queryKeys.landing,
    queryFn: () => landingRepository.getContent(),
    staleTime: 1000 * 60 * 5,
    initialData: fallbackLandingContent,
  });
  return { data: q.data, isLoading: q.isLoading };
}
