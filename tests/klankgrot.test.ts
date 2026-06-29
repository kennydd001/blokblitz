import { describe, expect, it } from "vitest";
import { classifyPhonicsError, PHONICS_MISCONCEPTIONS, PHONICS_WORDS, phonicsRound } from "../src/education/literacy/phonics";
import { buildAttemptLog, buildCurriculumAttempt } from "../src/education/challengeLogger";
import { MasteryTracker } from "../src/education/masteryTracker";
import { countChallenge } from "../src/scenes/minigames/miniChallenges";

describe("phonics data + rounds", () => {
  it("has clear words with emoji, begin/end sound and units", () => {
    expect(PHONICS_WORDS.length).toBeGreaterThanOrEqual(10);
    for (const word of PHONICS_WORDS) {
      expect(word.emoji).toBeTruthy();
      expect(word.begin).toBeTruthy();
      expect(word.end).toBeTruthy();
      expect(word.units.join("")).toBeTruthy();
    }
  });

  it("builds begin/end/blend rounds with exactly one correct option", () => {
    for (const mode of ["begin", "end", "blend"] as const) {
      const round = phonicsRound(mode);
      expect(round.mode).toBe(mode);
      expect(round.options).toHaveLength(3);
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(round.targetKey.startsWith(`${mode}-`)).toBe(true);
    }
  });

  it("begin round: only the correct picture starts with the target sound", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = phonicsRound("begin");
      const matches = round.options.filter((o) => o.word.begin === round.targetSound);
      expect(matches).toHaveLength(1);
      expect(matches[0].isCorrect).toBe(true);
    }
  });

  it("classifies phonics errors by mode", () => {
    expect(classifyPhonicsError("begin")).toBe("first-sound-weak");
    expect(classifyPhonicsError("end")).toBe("final-sound-weak");
    expect(classifyPhonicsError("blend")).toBe("blend-weak");
    expect(PHONICS_MISCONCEPTIONS).toContain("first-sound-weak");
  });
});

describe("literacy logging never pollutes the number stats", () => {
  it("groups a reading attempt by domain, not into number skills/representations", () => {
    const tracker = new MasteryTracker();
    const numberChallenge = countChallenge(4);
    tracker.logAttempt(
      buildAttemptLog({ challenge: numberChallenge, option: numberChallenge.options.find((o) => o.isCorrect)!, sessionId: "s", reactionTimeMs: 500, hintUsed: false })
    );
    tracker.logAttempt(
      buildCurriculumAttempt({
        sessionId: "s",
        domain: "literacy-phonemic",
        skill: "soundBlend",
        targetKey: "blend-maan",
        rangeKey: "phonics",
        stimulusKey: "maan",
        responseKey: "maan",
        wasCorrect: true,
        reactionTimeMs: 500,
        hintUsed: false
      })
    );

    expect(tracker.getAttempts()).toHaveLength(2);
    // Number views count ONLY the number attempt (the literacy placeholder fields are filtered out by domain).
    const numberExposures = tracker.masteryBySkill().reduce((sum, m) => sum + m.exposures, 0);
    expect(numberExposures).toBe(1);
    expect(tracker.masteryByRepresentation().find((m) => m.representation === "numeral")!.exposures).toBe(1);
    // Reading is queryable by domain for the dashboard.
    expect(tracker.getAttempts().filter((a) => a.domain === "literacy-phonemic")).toHaveLength(1);
  });
});
