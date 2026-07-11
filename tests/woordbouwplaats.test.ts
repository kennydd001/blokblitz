import { describe, expect, it, vi } from "vitest";
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
    expect(classifyBouwError(1, 4, "r")).toBe("build-weak");
  });

  it("moves from end sounds in simple words to every sound in longer words", () => {
    for (let i = 0; i < 40; i += 1) {
      const starter = bouwRound(1);
      expect([0, starter.units.length - 1]).toContain(starter.blankIndex);
      expect(starter.units.every((unit) => unit.length === 1)).toBe(true);
      expect(starter.options).toHaveLength(2);
    }
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    const advanced = bouwRound(3);
    expect(advanced.units.length).toBeGreaterThan(3);
    expect(advanced.options).toHaveLength(4);
    random.mockRestore();
  });
});
