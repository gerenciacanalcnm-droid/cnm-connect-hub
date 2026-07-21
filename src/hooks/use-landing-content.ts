import { useQuery } from "@tanstack/react-query";
import { getLandingContent } from "@/services/landing/get-landing-content";
import { fallbackLandingContent, type LandingContent } from "@/config/landing-content";

export function useLandingContent(): LandingContent {
  const { data } = useQuery({
    queryKey: ["landing-content"],
    queryFn: getLandingContent,
    staleTime: 1000 * 60 * 5,
    initialData: fallbackLandingContent,
  });
  return data;
}
