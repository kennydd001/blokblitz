import { describe, expect, it } from 'vitest';
import type { AttemptLog } from '../src/education/types';
import { weeklyDigest } from '../src/education/parentInsights';

const DAY = 86_400_000;
const MINUTE = 60_000;
const NOW = 10 * DAY + 12 * 60 * MINUTE;

const baseAttempt: AttemptLog = {
  timestamp: NOW,
  sessionId: 'session-1',
  levelId: 'level-1',
  scene: 'runner',
  challengeType: 'count',
  skill: 'subitize',
  representation: 'dots',
  quantity: 3,
  quantityRange: '1-3',
  promptRepresentation: 'dots',
  correctAnswer: 3,
  playerAnswer: 3,
  wasCorrect: true,
  reactionTimeMs: 900,
  hintUsed: false
};

function attempt(overrides: Partial<AttemptLog> = {}): AttemptLog {
  return { ...baseAttempt, ...overrides };
}

describe('weeklyDigest', () => {
  it('filters to the inclusive seven-day window', () => {
    const windowStart = NOW - 7 * DAY;
    const result = weeklyDigest(
      [
        attempt({ timestamp: windowStart - 1 }),
        attempt({ timestamp: windowStart }),
        attempt({ timestamp: NOW }),
        attempt({ timestamp: NOW + 1 })
      ],
      NOW
    );

    expect(result.windowStart).toBe(windowStart);
    expect(result.attempts).toBe(2);
  });

  it('calculates accuracy and hint rate from this week\'s attempts', () => {
    const result = weeklyDigest(
      [
        attempt({ timestamp: NOW - 3 * MINUTE, wasCorrect: true, hintUsed: false }),
        attempt({ timestamp: NOW - 2 * MINUTE, wasCorrect: true, hintUsed: true }),
        attempt({ timestamp: NOW - MINUTE, wasCorrect: false, hintUsed: false })
      ],
      NOW
    );

    expect(result.accuracy).toBe(2 / 3);
    expect(result.hintRate).toBe(1 / 3);
  });

  it('counts distinct UTC calendar days, including a window boundary day', () => {
    const windowStart = NOW - 7 * DAY;
    const result = weeklyDigest(
      [
        attempt({ timestamp: windowStart }),
        attempt({ timestamp: 4 * DAY + 1_000 }),
        attempt({ timestamp: 5 * DAY + 1_000 }),
        attempt({ timestamp: NOW })
      ],
      NOW
    );

    expect(result.activeDays).toBe(4);
  });

  it('estimates practice minutes and ignores gaps longer than five minutes', () => {
    const result = weeklyDigest(
      [
        attempt({ timestamp: NOW - 30 * MINUTE }),
        attempt({ timestamp: NOW - 28 * MINUTE }),
        attempt({ timestamp: NOW - 23 * MINUTE }),
        attempt({ timestamp: NOW - 10 * MINUTE }),
        attempt({ timestamp: NOW - 8 * MINUTE })
      ],
      NOW
    );

    expect(result.minutesPracticed).toBe(9);
  });

  it('applies mastery thresholds, caps each list at five, and orders them', () => {
    const logs: AttemptLog[] = [];
    for (let exposures = 3; exposures <= 8; exposures += 1) {
      for (let index = 0; index < exposures; index += 1) {
        logs.push(
          attempt({
            timestamp: NOW - logs.length * 1_000,
            targetKey: 'strong-' + exposures,
            wasCorrect: true
          })
        );
        logs.push(
          attempt({
            timestamp: NOW - logs.length * 1_000,
            targetKey: 'weak-' + exposures,
            wasCorrect: false
          })
        );
      }
    }
    logs.push(
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'borderline-60', wasCorrect: true }),
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'borderline-60', wasCorrect: true }),
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'borderline-60', wasCorrect: true }),
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'borderline-60', wasCorrect: false }),
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'borderline-60', wasCorrect: false }),
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'not-weak', wasCorrect: true }),
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'not-weak', wasCorrect: true }),
      attempt({ timestamp: NOW - logs.length * 1_000, targetKey: 'not-weak', wasCorrect: false })
    );

    const result = weeklyDigest(logs, NOW);

    expect(result.mastered.map((target) => target.targetKey)).toEqual([
      'strong-8',
      'strong-7',
      'strong-6',
      'strong-5',
      'strong-4'
    ]);
    expect(result.needsPractice.map((target) => target.targetKey)).toEqual([
      'weak-8',
      'weak-7',
      'weak-6',
      'weak-5',
      'weak-4'
    ]);
    expect(result.domains[0].masteredTargets).toBe(6);
    expect(result.domains[0].strugglingTargets).toBe(6);
  });

  it('labels known domains and uses number and raw-key fallbacks', () => {
    const unknownDomain = 'mystery-domain' as unknown as NonNullable<AttemptLog['domain']>;
    const result = weeklyDigest(
      [
        attempt({ timestamp: NOW - MINUTE, quantity: 4 }),
        attempt({ timestamp: NOW - 2 * MINUTE, domain: 'literacy-reading', targetKey: 'vis' }),
        attempt({ timestamp: NOW - 3 * MINUTE, domain: 'literacy-reading', quantity: 7 }),
        attempt({ timestamp: NOW - 4 * MINUTE, domain: unknownDomain, targetKey: 'vraagteken' })
      ],
      NOW
    );

    expect(result.domains.map((domain) => domain.label)).toEqual(['Lezen', 'Getallen 1-10', 'mystery-domain']);
    expect(result.domains.find((domain) => domain.domain === 'math-number')?.attempts).toBe(1);
    expect(result.domains.find((domain) => domain.domain === 'mystery-domain')?.label).toBe('mystery-domain');
  });

  it('returns a complete, friendly empty-week digest', () => {
    const result = weeklyDigest([], NOW);

    expect(result).toMatchObject({
      windowStart: NOW - 7 * DAY,
      now: NOW,
      attempts: 0,
      activeDays: 0,
      accuracy: 0,
      hintRate: 0,
      minutesPracticed: 0,
      domains: [],
      mastered: [],
      needsPractice: [],
      headline: 'Deze week nog niet gespeeld — nodig je kind uit voor een rondje!'
    });
    expect(result.encouragement.length).toBeGreaterThan(0);
  });

  it('does not mutate input and is deterministic', () => {
    const logs = [
      attempt({ timestamp: NOW - 4 * MINUTE, targetKey: 'b' }),
      attempt({ timestamp: NOW - MINUTE, targetKey: 'a', wasCorrect: false })
    ];
    const before = logs.map((entry) => ({ ...entry }));

    const first = weeklyDigest(logs, NOW);
    const second = weeklyDigest(logs, NOW);

    expect(logs).toEqual(before);
    expect(second).toEqual(first);
  });
});
