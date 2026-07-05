import { describe, expect, it } from "vitest";
import { journeyTier, recentAccuracy } from "../src/education/difficulty";
import { lineRound } from "../src/education/math/numberline";
import { bridgeRound } from "../src/education/math/addsub20";
import { clockRound } from "../src/education/measurement/time";
import { phonicsRound } from "../src/education/literacy/phonics";
import type { AttemptLog } from "../src/education/types";

const attempt = (wasCorrect: boolean): AttemptLog =>
  ({
    id: "a",
    sessionId: "s",
    skill: "subitize",
    representation: "dots",
    quantity: 3,
    quantityRange: "1-5",
    challengeType: "tap-count",
    wasCorrect,
    reactionTimeMs: 900,
    hintUsed: false,
    timestamp: 1
  }) as unknown as AttemptLog;

describe("dynamic difficulty (tier = ronde + pad + kunnen)", () => {
  it("starts a fresh child on tier 1 and never drops below it", () => {
    expect(journeyTier({ round: 1, pathProgress: 0 })).toBe(1);
    // Struggling can never push the game below tier 1.
    expect(journeyTier({ round: 1, pathProgress: 0, recentAccuracy: 0.2, attemptCount: 20 })).toBe(1);
  });

  it("raises the tier deeper into the path and per Sterrenronde, capped at 3", () => {
    expect(journeyTier({ round: 1, pathProgress: 0.7 })).toBe(2);
    expect(journeyTier({ round: 2, pathProgress: 0 })).toBe(2);
    expect(journeyTier({ round: 2, pathProgress: 0.8 })).toBe(3);
    expect(journeyTier({ round: 5, pathProgress: 1, recentAccuracy: 1, attemptCount: 50 })).toBe(3);
  });

  it("listens to how the child is actually doing", () => {
    // Acing the last stretch bumps the tier up...
    expect(journeyTier({ round: 1, pathProgress: 0, recentAccuracy: 0.95, attemptCount: 20 })).toBe(2);
    // ...struggling drops it back down.
    expect(journeyTier({ round: 2, pathProgress: 0.6, recentAccuracy: 0.4, attemptCount: 20 })).toBe(2);
    // Fewer than 10 attempts: the accuracy signal is ignored.
    expect(journeyTier({ round: 1, pathProgress: 0, recentAccuracy: 1, attemptCount: 4 })).toBe(1);
  });

  it("measures recent accuracy over the last window only", () => {
    const attempts = [...Array.from({ length: 20 }, () => attempt(false)), ...Array.from({ length: 20 }, () => attempt(true))];
    const { accuracy, count } = recentAccuracy(attempts, 20);
    expect(count).toBe(20);
    expect(accuracy).toBe(1);
    expect(recentAccuracy([], 20)).toEqual({ accuracy: 0, count: 0 });
  });
});

describe("tier-shaped generators", () => {
  it("keeps tier-1 number lines on the friendly stretch and tier-3 on the hard one", () => {
    for (let i = 0; i < 60; i += 1) {
      const easy = lineRound(undefined, 1);
      expect(easy.target).toBeLessThanOrEqual(9);
      expect(easy.mode).not.toBe("before");
      const hard = lineRound(undefined, 3);
      expect(hard.target).toBeGreaterThanOrEqual(9);
    }
  });

  it("gives tier-1 bridges mostly to-ten rounds and tier-3 no to-ten at all", () => {
    const easyModes = new Set<string>();
    for (let i = 0; i < 60; i += 1) {
      easyModes.add(bridgeRound(undefined, 1).mode);
      expect(bridgeRound(undefined, 3).mode).not.toBe("to-ten");
    }
    expect(easyModes.has("to-ten")).toBe(true);
    expect(easyModes.has("sub")).toBe(false);
  });

  it("reads only whole hours at clock tier 1", () => {
    for (let i = 0; i < 40; i += 1) {
      expect(clockRound(undefined, 1).minute).toBe(0);
    }
  });

  it("keeps phonics tier 1 on begin/end sounds and leans on blends at tier 3", () => {
    let blends = 0;
    for (let i = 0; i < 60; i += 1) {
      expect(phonicsRound(undefined, 1).mode).not.toBe("blend");
      if (phonicsRound(undefined, 3).mode === "blend") blends += 1;
    }
    expect(blends).toBeGreaterThan(10);
  });
});
