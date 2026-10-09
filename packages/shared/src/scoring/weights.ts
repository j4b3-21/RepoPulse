/** Configurable product heuristics — not industry standards. */
export const CATEGORY_WEIGHTS = {
  documentation: 0.25,
  testing: 0.25,
  maintenance: 0.25,
  issues: 0.25,
} as const;

export type CategoryId = keyof typeof CATEGORY_WEIGHTS;
