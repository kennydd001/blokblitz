import { describe, expect, it } from "vitest";
import { LETTERS, STARTER_LETTERS } from "../src/education/literacy/letters";
import {
  WRITABLE_GRAPHEMES,
  evaluateTrace,
  traceGuide,
  traceSettings,
  writingPracticeTarget,
  type TracePoint
} from "../src/education/literacy/tracing";
import type { AttemptLog } from "../src/education/types";

function writingAttempt(grapheme: string, wasCorrect = true, hintUsed = false, timestamp = 1): AttemptLog {
  return {
    timestamp,
    sessionId: "trace-test",
    levelId: "schrijfspoor",
    scene: "minigame",
    challengeType: "letter-trace",
    skill: "letterForm",
    representation: "numeral",
    quantity: 0,
    quantityRange: "1-3",
    promptRepresentation: "numeral",
    answerRepresentation: "numeral",
    correctAnswer: grapheme,
    playerAnswer: grapheme,
    wasCorrect,
    reactionTimeMs: 800,
    hintUsed,
    domain: "literacy-writing",
    targetKey: `write-${grapheme}`,
    rangeKey: "lowercase-letter",
    stimulusKey: grapheme,
    responseKey: grapheme
  };
}

describe("Schrijfspoor tracing", () => {
  it("has bounded, drawable paths for every supported reading grapheme", () => {
    expect(WRITABLE_GRAPHEMES).toEqual(LETTERS);
    for (const grapheme of LETTERS) {
      const guide = traceGuide(grapheme);
      expect(guide.strokes.length).toBeGreaterThan(0);
      for (const stroke of guide.strokes) {
        expect(stroke.length).toBeGreaterThan(0);
        for (const point of stroke) {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(guide.width);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(guide.height);
        }
      }
    }
  });

  it("accepts a complete guide trace as excellent", () => {
    const guide = traceGuide("m");
    const result = evaluateTrace(guide, guide.strokes, traceSettings(2).corridor);
    expect(result.complete).toBe(true);
    expect(result.excellent).toBe(true);
    expect(result.coverage).toBe(1);
    expect(result.precision).toBe(1);
  });

  it("accepts a wobbly little-finger trace inside the wide corridor", () => {
    const guide = traceGuide("s");
    const wobbly = guide.strokes.map((stroke) =>
      stroke.map((point, index): TracePoint => ({ x: point.x + (index % 2 === 0 ? 6 : -6), y: point.y + (index % 3 === 0 ? 5 : -4) }))
    );
    const result = evaluateTrace(guide, wobbly, traceSettings(1).corridor);
    expect(result.complete).toBe(true);
    expect(result.coverage).toBeGreaterThan(0.8);
  });

  it("rejects half a two-letter grapheme and points to the missing side", () => {
    const guide = traceGuide("aa");
    const firstLetterStrokeCount = traceGuide("a").strokes.length;
    const result = evaluateTrace(guide, guide.strokes.slice(0, firstLetterStrokeCount), traceSettings(2).corridor);
    expect(result.complete).toBe(false);
    expect(result.coverage).toBeLessThan(0.64);
    expect(result.missedPoint?.x).toBeGreaterThan(100);
  });

  it("does not reward covering the guide underneath a large unrelated scribble", () => {
    const guide = traceGuide("i");
    const scribbles = Array.from({ length: 24 }, (_, index) => [
      { x: index % 2 === 0 ? 2 : 218, y: 170 },
      { x: index % 2 === 0 ? 218 : 2, y: 170 }
    ]);
    const result = evaluateTrace(guide, [...guide.strokes, ...scribbles], traceSettings(2).corridor);
    expect(result.coverage).toBe(1);
    expect(result.precision).toBeLessThan(0.4);
    expect(result.complete).toBe(false);
  });

  it("rotates through unlocked writing targets and obeys adaptive remediation", () => {
    const attempts = [writingAttempt("i", true, false, 1)];
    expect(writingPracticeTarget(attempts, STARTER_LETTERS)).toBe("k");
    expect(writingPracticeTarget(attempts, STARTER_LETTERS, "write-s")).toBe("s");
    expect(writingPracticeTarget(attempts, STARTER_LETTERS, "write-aa")).toBe("k");
  });

  it("fades the guide gradually while keeping a usable corridor", () => {
    expect(traceSettings(1)).toEqual({ corridor: 21, guideLevel: "full" });
    expect(traceSettings(2)).toEqual({ corridor: 18, guideLevel: "dotted" });
    expect(traceSettings(3)).toEqual({ corridor: 16, guideLevel: "faint" });
  });
});
