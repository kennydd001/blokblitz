import type { AttemptLog } from "./types";

// Dynamic difficulty for De Sterrenreis. The tier a child plays at is decided
// by three transparent signals:
//   1. the Sterrenronde (each completed journey raises the base — the path
//      literally continues, one round harder),
//   2. how far along the path they are (the second half of the map plays a
//      notch harder than the first),
//   3. how they are actually doing (recent accuracy: acing bumps the tier up,
//      struggling drops it down — never below 1, so a hard round can never
//      make the game punishing).
// Tiers cap at 3; every consumer treats 2 as "today's normal".
export type DifficultyTier = 1 | 2 | 3;

export interface TierSignals {
  /** Current Sterrenronde (1 = the first journey). */
  round: number;
  /** 0..1 position of the launching node along the journey path. */
  pathProgress: number;
  /** Accuracy over the recent attempt window (0..1). */
  recentAccuracy?: number;
  /** How many attempts that accuracy is based on; below 10 it is ignored. */
  attemptCount?: number;
}

export function journeyTier(signals: TierSignals): DifficultyTier {
  let tier = Math.max(1, Math.round(signals.round));
  if (signals.pathProgress >= 0.5) tier += 1;
  if ((signals.attemptCount ?? 0) >= 10) {
    if ((signals.recentAccuracy ?? 0) >= 0.9) tier += 1;
    else if ((signals.recentAccuracy ?? 1) < 0.6) tier -= 1;
  }
  return Math.max(1, Math.min(3, tier)) as DifficultyTier;
}

/** Accuracy over the last `window` attempts, across ALL domains. */
export function recentAccuracy(attempts: AttemptLog[], window = 20): { accuracy: number; count: number } {
  const recent = attempts.slice(-window);
  if (recent.length === 0) return { accuracy: 0, count: 0 };
  const correct = recent.filter((attempt) => attempt.wasCorrect).length;
  return { accuracy: correct / recent.length, count: recent.length };
}
