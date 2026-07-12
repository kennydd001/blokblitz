import { describe, expect, it } from "vitest";
import {
  classifySkipCountError,
  SKIP_COUNT_MISCONCEPTIONS,
  skipCountChallenge,
  skipCountLimit,
  skipCountRound,
  type SkipStep
} from "../src/education/math/skipCounting";

describe("skip-counting content", () => {
  it("uses curriculum-sized limits for jumps of 2, 5 and 10", () => {
    expect(skipCountLimit(2)).toBe(20);
    expect(skipCountLimit(5)).toBe(50);
    expect(skipCountLimit(10)).toBe(100);
  });

  it("keeps the early tiers inside the eerste-leerjaar number world", () => {
    // Tier 1: only the first friendly hops of two.
    expect(skipCountLimit(2, 1)).toBe(10);
    // Tier 2 (today's normal): EVERY step stays within 0-20 — numbers like
    // 30 and 40 must never appear before the far end of the journey.
    expect(skipCountLimit(2, 2)).toBe(20);
    expect(skipCountLimit(5, 2)).toBe(20);
    for (let index = 0; index < 120; index += 1) {
      const tier1 = skipCountRound(undefined, 1);
      expect(tier1.sequence.at(-1)).toBeLessThanOrEqual(10);
      expect(tier1.options.every((option) => option.value <= 10)).toBe(true);
      const tier2 = skipCountRound(undefined, 2);
      expect(tier2.sequence.at(-1)).toBeLessThanOrEqual(20);
      expect(tier2.options.every((option) => option.value <= 20)).toBe(true);
    }
  });

  it("builds valid next and missing rounds for every step", () => {
    for (const step of [2, 5, 10] as SkipStep[]) {
      for (const mode of ["next", "missing"] as const) {
        for (let index = 0; index < 80; index += 1) {
          const round = skipCountRound(mode, 3, step);
          expect(round.step).toBe(step);
          expect(round.answer).toBe(round.sequence[round.missingIndex]);
          expect(round.sequence.every((value, i) => i === 0 || value - round.sequence[i - 1] === step)).toBe(true);
          expect(round.sequence.at(-1)).toBeLessThanOrEqual(skipCountLimit(step));
          expect(round.options).toHaveLength(3);
          expect(new Set(round.options.map((option) => option.value)).size).toBe(3);
          expect(round.options.filter((option) => option.isCorrect)).toHaveLength(1);
          expect(round.targetKey).toBe(`skip-${step}`);
        }
      }
    }
  });

  it("keeps tier one on jumps of two", () => {
    for (let index = 0; index < 100; index += 1) expect(skipCountRound(undefined, 1).step).toBe(2);
  });

  it("classifies counting by one, a whole jump away and weak answers", () => {
    const round = { ...skipCountRound("next", 2, 5), sequence: [5, 10, 15, 20], missingIndex: 3, answer: 20 };
    expect(classifySkipCountError(round, 16)).toBe("counted-by-one");
    expect(classifySkipCountError(round, 15)).toBe("wrong-jump");
    expect(classifySkipCountError(round, 3)).toBe("skip-count-weak");
    expect(SKIP_COUNT_MISCONCEPTIONS).toEqual(["counted-by-one", "wrong-jump", "skip-count-weak"]);
  });

  it("wraps each sequence into the shared challenge contract", () => {
    const round = skipCountRound("missing", 3, 10);
    const challenge = skipCountChallenge(round);
    expect(challenge.prompt).toBe(round.prompt);
    expect(challenge.correctAnswer).toBe(round.answer);
    expect(challenge.options.map((option) => option.value)).toEqual(round.options.map((option) => option.value));
    expect(challenge.mechanic).toContain(`skip-count|10|${round.sequence.join("-")}`);
  });
});
