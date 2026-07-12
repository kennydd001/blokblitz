import { describe, expect, it } from "vitest";
import { buildRemediationPlan, supportLevelForTarget } from "../src/education/remediation";
import type { AttemptLog } from "../src/education/types";

function attempt(wasCorrect: boolean, hintUsed = false): AttemptLog {
  return {
    timestamp: Date.now(),
    sessionId: "old",
    levelId: "math-number",
    scene: "minigame",
    challengeType: "math-number:partwhole",
    skill: "partwhole",
    representation: "numeral",
    quantity: 0,
    quantityRange: "1-3",
    promptRepresentation: "numeral",
    correctAnswer: "split-5-2-3",
    playerAnswer: wasCorrect ? "3" : "2",
    wasCorrect,
    reactionTimeMs: 600,
    hintUsed,
    domain: "math-number",
    targetKey: "split-5-2-3"
  };
}

describe("fading remediation", () => {
  it("moves from a full model to guided help and then a small nudge as mastery grows", () => {
    expect(supportLevelForTarget([], "math-number", "split-5-2-3")).toBe("model");
    expect(supportLevelForTarget([attempt(true), attempt(true), attempt(false)], "math-number", "split-5-2-3")).toBe("guided");
    expect(
      supportLevelForTarget(Array.from({ length: 8 }, () => attempt(true)), "math-number", "split-5-2-3")
    ).toBe("nudge");
  });

  it("escalates within a round when the first light cue was not enough", () => {
    const fluent = Array.from({ length: 8 }, () => attempt(true));
    expect(supportLevelForTarget(fluent, "math-number", "split-5-2-3", 1)).toBe("nudge");
    expect(supportLevelForTarget(fluent, "math-number", "split-5-2-3", 2)).toBe("guided");
    expect(supportLevelForTarget(fluent, "math-number", "split-5-2-3", 3)).toBe("model");
  });

  it("only reveals the answer for the full worked model", () => {
    const plan = buildRemediationPlan({
      attempts: [],
      domain: "math-number",
      targetKey: "split-5-2-3",
      wrongAttempts: 1,
      copy: { nudge: "duwtje", guided: "stap", model: "model" }
    });
    expect(plan).toEqual({ level: "model", text: "model", revealAnswer: true });
  });
});
