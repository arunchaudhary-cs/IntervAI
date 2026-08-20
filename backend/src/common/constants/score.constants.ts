export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) {
    return SCORE_MIN;
  }

  return Math.min(
    SCORE_MAX,
    Math.max(SCORE_MIN, Math.round(score)),
  );
}