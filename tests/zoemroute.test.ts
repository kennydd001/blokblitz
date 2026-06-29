import { describe, expect, it } from "vitest";
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
});
