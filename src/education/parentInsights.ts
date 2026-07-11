// A warm little weekly window into how a child is growing: this digest turns
// logged attempts into a parent-friendly snapshot. Its minutes estimate counts
// only the gaps between attempts that are at most five minutes apart, treating
// longer gaps as a break between sessions rather than practice time.

import type { AttemptLog } from './types';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const MINUTE = 60_000;
const SESSION_BREAK = 300_000;

const DOMAIN_LABELS: Record<string, string> = {
  'math-number': 'Getallen 1-10',
  'math-operations': 'Rekenen tot 20',
  'math-measurement': 'Meten',
  'math-geometry': 'Vormen',
  'literacy-phonemic': 'Klanken',
  'literacy-reading': 'Lezen',
  'literacy-writing': 'Schrijven',
  'listening-comprehension': 'Luisteren',
  'world-traffic': 'Verkeer'
};

export interface DomainSummary {
  domain: string;
  label: string;
  attempts: number;
  accuracy: number;
  masteredTargets: number;
  strugglingTargets: number;
}

export interface DigestTarget {
  domain: string;
  targetKey: string;
  label: string;
  accuracy: number;
  exposures: number;
}

export interface WeeklyDigest {
  windowStart: number;
  now: number;
  attempts: number;
  activeDays: number;
  accuracy: number;
  hintRate: number;
  minutesPracticed: number;
  domains: DomainSummary[];
  mastered: DigestTarget[];
  needsPractice: DigestTarget[];
  headline: string;
  encouragement: string;
}

interface IndexedAttempt {
  attempt: AttemptLog;
  index: number;
}

function domainOf(attempt: AttemptLog): string {
  return attempt.domain ?? 'math-number';
}

function targetKeyOf(attempt: AttemptLog): string {
  return attempt.targetKey ?? String(attempt.quantity);
}

function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

function accuracyOf(attempts: AttemptLog[]): number {
  if (attempts.length === 0) return 0;
  return attempts.filter((attempt) => attempt.wasCorrect).length / attempts.length;
}

function compareStrongest(a: DigestTarget, b: DigestTarget): number {
  return (
    b.accuracy - a.accuracy ||
    b.exposures - a.exposures ||
    a.domain.localeCompare(b.domain) ||
    a.targetKey.localeCompare(b.targetKey)
  );
}

function compareWeakest(a: DigestTarget, b: DigestTarget): number {
  return (
    a.accuracy - b.accuracy ||
    b.exposures - a.exposures ||
    a.domain.localeCompare(b.domain) ||
    a.targetKey.localeCompare(b.targetKey)
  );
}

function toDigestTarget(domain: string, targetKey: string, attempts: AttemptLog[]): DigestTarget {
  return {
    domain,
    targetKey,
    label: domainLabel(domain) + ': ' + targetKey,
    accuracy: accuracyOf(attempts),
    exposures: attempts.length
  };
}

function estimateMinutes(attempts: AttemptLog[]): number {
  const sorted = attempts
    .map((attempt, index): IndexedAttempt => ({ attempt, index }))
    .sort(
      (a, b) =>
        a.attempt.timestamp - b.attempt.timestamp ||
        targetKeyOf(a.attempt).localeCompare(targetKeyOf(b.attempt)) ||
        a.index - b.index
    )
    .map(({ attempt }) => attempt);

  let practicedMs = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const gap = Math.max(0, sorted[index].timestamp - sorted[index - 1].timestamp);
    if (gap <= SESSION_BREAK) practicedMs += gap;
  }
  return Math.round(practicedMs / MINUTE);
}

export function weeklyDigest(attempts: AttemptLog[], now: number): WeeklyDigest {
  const windowStart = now - WEEK;
  const inWindow = attempts.filter((attempt) => attempt.timestamp >= windowStart && attempt.timestamp <= now);

  const correct = inWindow.filter((attempt) => attempt.wasCorrect).length;
  const hintCount = inWindow.filter((attempt) => attempt.hintUsed).length;
  const accuracy = inWindow.length === 0 ? 0 : correct / inWindow.length;
  const hintRate = inWindow.length === 0 ? 0 : hintCount / inWindow.length;
  const activeDays = new Set(inWindow.map((attempt) => Math.floor(attempt.timestamp / DAY))).size;

  const attemptsByDomain = new Map<string, AttemptLog[]>();
  const targetsByDomain = new Map<string, Map<string, AttemptLog[]>>();
  for (const attempt of inWindow) {
    const domain = domainOf(attempt);
    const domainAttempts = attemptsByDomain.get(domain) ?? [];
    domainAttempts.push(attempt);
    attemptsByDomain.set(domain, domainAttempts);

    const targets = targetsByDomain.get(domain) ?? new Map<string, AttemptLog[]>();
    const targetKey = targetKeyOf(attempt);
    const targetAttempts = targets.get(targetKey) ?? [];
    targetAttempts.push(attempt);
    targets.set(targetKey, targetAttempts);
    targetsByDomain.set(domain, targets);
  }

  const domains = Array.from(attemptsByDomain.entries())
    .map(([domain, domainAttempts]): DomainSummary => {
      const targetGroups = targetsByDomain.get(domain) ?? new Map<string, AttemptLog[]>();
      const targetSummaries = Array.from(targetGroups.values()).map((targetAttempts) => ({
        exposures: targetAttempts.length,
        accuracy: accuracyOf(targetAttempts)
      }));
      return {
        domain,
        label: domainLabel(domain),
        attempts: domainAttempts.length,
        accuracy: accuracyOf(domainAttempts),
        masteredTargets: targetSummaries.filter((target) => target.exposures >= 3 && target.accuracy >= 0.85).length,
        strugglingTargets: targetSummaries.filter((target) => target.exposures >= 3 && target.accuracy < 0.6).length
      };
    })
    .sort((a, b) => b.attempts - a.attempts || a.label.localeCompare(b.label) || a.domain.localeCompare(b.domain));

  const targetSummaries: DigestTarget[] = [];
  for (const [domain, targetGroups] of targetsByDomain) {
    for (const [targetKey, targetAttempts] of targetGroups) {
      targetSummaries.push(toDigestTarget(domain, targetKey, targetAttempts));
    }
  }

  const mastered = targetSummaries
    .filter((target) => target.exposures >= 3 && target.accuracy >= 0.85)
    .sort(compareStrongest)
    .slice(0, 5);
  const needsPractice = targetSummaries
    .filter((target) => target.exposures >= 3 && target.accuracy < 0.6)
    .sort(compareWeakest)
    .slice(0, 5);

  const headline =
    inWindow.length === 0
      ? 'Deze week nog niet gespeeld — nodig je kind uit voor een rondje!'
      : 'Deze week ' +
        inWindow.length +
        (inWindow.length === 1 ? ' opdracht op ' : ' opdrachten op ') +
        activeDays +
        (activeDays === 1 ? ' dag, ' : ' dagen, ') +
        Math.round(accuracy * 100) +
        '% juist.';
  const encouragement =
    inWindow.length < 3 || accuracy < 0.6
      ? 'Elke dag een klein beetje oefenen helpt enorm.'
      : accuracy >= 0.85
        ? 'Sterk bezig — samen blijven oefenen maakt het verschil.'
        : 'Mooie vooruitgang — rustig blijven oefenen helpt om verder te groeien.';

  return {
    windowStart,
    now,
    attempts: inWindow.length,
    activeDays,
    accuracy,
    hintRate,
    minutesPracticed: estimateMinutes(inWindow),
    domains,
    mastered,
    needsPractice,
    headline,
    encouragement
  };
}
