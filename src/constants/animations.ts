export const ANIMATIONS = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  easeOut: [0.16, 1, 0.3, 1] as const,
  spring: { type: "spring", stiffness: 260, damping: 24 } as const,
} as const;
