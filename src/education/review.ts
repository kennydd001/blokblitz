// Review is the little memory compass for the game: it tells us which targets
// need another friendly visit before they fade too far. A short correct streak
// earns a stronger Leitner box and a longer half-life, while a wrong answer
// gently brings that target back to the beginning. Everything is calculated
// from the logged attempts and the supplied clock, so the same history always
// produces the same queue.

import type { AttemptLog } from "./types";

export interface ReviewItem {
  domain: string;
  targetKey: string;
  exposures: number;
  lastSeen: number;
  box: number;
  retention: number;
  due: boolean;
  dueScore: number;
}

const HALF_LIFE_DAYS = [0.5, 1, 2, 4, 7, 14];
const DUE_THRESHOLD = 0.6;
const DAY_MS = 86_400_000;

function compareReviewItems(a: ReviewItem, b: ReviewItem): number {
  return (
    b.dueScore - a.dueScore ||
    a.lastSeen - b.lastSeen ||
    a.targetKey.localeCompare(b.targetKey) ||
    a.domain.localeCompare(b.domain)
  );
}

function itemForGroup(domain: string, targetKey: string, attempts: AttemptLog[], now: number): ReviewItem {
  const ordered = attempts
    .map((attempt, index) => ({ attempt, index }))
    .sort((a, b) => a.attempt.timestamp - b.attempt.timestamp || a.index - b.index)
    .map(({ attempt }) => attempt);
  const exposures = ordered.length;
  const lastSeen = Math.max(...ordered.map((attempt) => attempt.timestamp));
  let box = 0;
  for (let index = ordered.length - 1; index >= 0 && ordered[index].wasCorrect; index -= 1) {
    box += 1;
  }
  box = Math.min(box, 5);

  const wrongAttempts = ordered.filter((attempt) => !attempt.wasCorrect).length;
  const lapseRate = wrongAttempts / exposures;
  const elapsedDays = Math.max(0, (now - lastSeen) / DAY_MS);
  const retention = 2 ** (-elapsedDays / HALF_LIFE_DAYS[box]);
  const due = exposures >= 1 && retention < DUE_THRESHOLD;
  const dueScore = (1 - retention) + 0.5 * lapseRate;

  return { domain, targetKey, exposures, lastSeen, box, retention, due, dueScore };
}

/** Every target ever seen, with decayed retention at `now`, most-urgent first. */
export function reviewQueue(attempts: AttemptLog[], now: number): ReviewItem[] {
  const groups = new Map<string, Map<string, AttemptLog[]>>();
  for (const attempt of attempts) {
    const domain = attempt.domain ?? "math-number";
    const targetKey = attempt.targetKey ?? String(attempt.quantity);
    const targets = groups.get(domain) ?? new Map<string, AttemptLog[]>();
    const targetAttempts = targets.get(targetKey) ?? [];
    targetAttempts.push(attempt);
    targets.set(targetKey, targetAttempts);
    groups.set(domain, targets);
  }

  const items: ReviewItem[] = [];
  for (const [domain, targets] of groups) {
    for (const [targetKey, targetAttempts] of targets) {
      items.push(itemForGroup(domain, targetKey, targetAttempts, now));
    }
  }

  return items.sort(compareReviewItems);
}

/** Only the due subset (retention below threshold), most-urgent first, optionally capped. */
export function dueForReview(attempts: AttemptLog[], now: number, limit?: number): ReviewItem[] {
  const due = reviewQueue(attempts, now).filter((item) => item.due);
  if (limit === undefined) return due;
  return due.slice(0, Math.max(0, Math.floor(limit)));
}

/** A short session warm-up that revisits due targets in a domain round-robin. */
export function sessionWarmup(attempts: AttemptLog[], now: number, count = 3): ReviewItem[] {
  const due = dueForReview(attempts, now);
  const cap = Math.max(0, Math.floor(count));
  if (cap === 0 || due.length === 0) return [];

  const byDomain = new Map<string, ReviewItem[]>();
  for (const item of due) {
    const domainItems = byDomain.get(item.domain) ?? [];
    domainItems.push(item);
    byDomain.set(item.domain, domainItems);
  }

  const domains = [...byDomain.keys()];
  const warmup: ReviewItem[] = [];
  while (warmup.length < cap) {
    let addedThisRound = false;
    for (const domain of domains) {
      const domainItems = byDomain.get(domain);
      const item = domainItems?.shift();
      if (item) {
        warmup.push(item);
        addedThisRound = true;
        if (warmup.length === cap) break;
      }
    }
    if (!addedThisRound) break;
  }
  return warmup;
}

/**
 * Pick the strongest candidate that was not the immediately previous target in
 * this domain/session. Returning undefined deliberately lets the scene roll a
 * different discovery target before revisiting the weak one next round.
 */
export function nextInterleavedTarget(
  candidates: Array<string | undefined>,
  attempts: AttemptLog[],
  sessionId: string,
  domain: string
): string | undefined {
  const previous = [...attempts]
    .reverse()
    .find((attempt) => attempt.sessionId === sessionId && attempt.domain === domain && Boolean(attempt.targetKey))?.targetKey;
  const unique = [...new Set(candidates.filter((candidate): candidate is string => Boolean(candidate)))];
  return unique.find((candidate) => candidate !== previous);
}
