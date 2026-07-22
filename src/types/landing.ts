export type { LandingContent } from "@/config/landing-content";

export interface Faq {
  question: string;
  answer: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone?: string;
}
