import { describe, expect, it, vi } from "vitest";
import { STARTER_LETTERS } from "../src/education/literacy/letters";
import { zoemRound } from "../src/education/literacy/words";

describe("zoemroute rounds", () => {
  it("builds a blend round with one correct picture and short (<=3 unit) words", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = zoemRound();
      expect(round.options).toHaveLength(3);
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(round.units.length).toBeGreaterThanOrEqual(1);
      expect(round.units.length).toBeLessThanOrEqual(3);
      expect(round.targetKey.startsWith("word-")).toBe(true);
      const correct = round.options.find((o) => o.isCorrect)!.word;
      expect(correct.units).toEqual(round.units);
    }
  });

  it("grows from simple three-sound words to clusters and four pictures", () => {
    for (let i = 0; i < 40; i += 1) {
      const starter = zoemRound(1);
      expect(starter.units).toHaveLength(3);
      expect(starter.units.every((unit) => unit.length === 1)).toBe(true);
      expect(starter.options).toHaveLength(2);
    }
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    const advanced = zoemRound(3);
    expect(advanced.units.length).toBeGreaterThan(3);
    expect(advanced.options).toHaveLength(4);
    random.mockRestore();
  });

  it("only asks a new reader to blend graphemes from the unlocked letter book", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = zoemRound(1, STARTER_LETTERS);
      expect(round.word.word).toBe("mis");
      expect(round.units.every((unit) => STARTER_LETTERS.includes(unit))).toBe(true);
      expect(round.options).toHaveLength(2);
    }
  });

  it("serves an eligible adaptive word directly instead of hoping to reroll it", () => {
    const round = zoemRound(3, undefined, "word-banaan");
    expect(round.word.word).toBe("banaan");
    expect(round.units).toHaveLength(5);
    expect(round.targetKey).toBe("word-banaan");
  });
});
