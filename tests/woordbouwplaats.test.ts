import { describe, expect, it } from "vitest";
import { bouwRound, classifyBouwError } from "../src/education/literacy/words";

describe("woordbouwplaats rounds", () => {
  it("blanks exactly one sound box with one correct tile", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = bouwRound();
      expect(round.options).toHaveLength(3);
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(round.blankIndex).toBeGreaterThanOrEqual(0);
      expect(round.blankIndex).toBeLessThan(round.units.length);
      expect(round.correct).toBe(round.units[round.blankIndex]);
      expect(round.options.find((o) => o.isCorrect)!.value).toBe(round.correct);
      expect(round.targetKey.startsWith("build-")).toBe(true);
    }
  });

  it("classifies the weak sound by box position", () => {
    expect(classifyBouwError(0, 3)).toBe("first-sound-weak");
    expect(classifyBouwError(2, 3)).toBe("final-sound-weak");
    expect(classifyBouwError(1, 3)).toBe("vowel-length-weak");
  });
});
