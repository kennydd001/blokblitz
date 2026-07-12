import type { AttemptLog } from "./types";

export type SupportLevel = "nudge" | "guided" | "model";

export interface RemediationCopy {
  nudge: string;
  guided: string;
  model: string;
}

export interface RemediationPlan {
  level: SupportLevel;
  text: string;
  revealAnswer: boolean;
}

export interface RemediationSignals {
  attempts: AttemptLog[];
  domain?: string;
  targetKey?: string;
  wrongAttempts: number;
  copy: RemediationCopy;
}

/**
 * Fade help as a target becomes secure, but escalate again when a child keeps
 * missing the same round. New or shaky targets get a full worked model;
 * established targets first get room to recover from a small mistake.
 */
export function supportLevelForTarget(
  attempts: AttemptLog[],
  domain: string | undefined,
  targetKey: string | undefined,
  wrongAttempts = 1
): SupportLevel {
  if (!domain || !targetKey) return "model";

  const history = attempts.filter((attempt) => attempt.domain === domain && attempt.targetKey === targetKey);
  const accuracy = history.length === 0 ? 0 : history.filter((attempt) => attempt.wasCorrect).length / history.length;
  const hintRate = history.length === 0 ? 0 : history.filter((attempt) => attempt.hintUsed).length / history.length;

  let index = 2;
  if (history.length >= 6 && accuracy >= 0.8 && hintRate <= 0.25) index = 0;
  else if (history.length >= 3 && accuracy >= 0.65 && hintRate <= 0.5) index = 1;

  index = Math.min(2, index + Math.max(0, Math.floor(wrongAttempts) - 1));
  return (["nudge", "guided", "model"] as const)[index];
}

export function buildRemediationPlan(signals: RemediationSignals): RemediationPlan {
  const level = supportLevelForTarget(
    signals.attempts,
    signals.domain,
    signals.targetKey,
    signals.wrongAttempts
  );
  return {
    level,
    text: signals.copy[level],
    revealAnswer: level === "model"
  };
}
