import { describe, expect, it } from "vitest";
import { barHtml, blocksHtml, measureRound } from "../src/education/measurement/measure";

describe("meetwerf rounds", () => {
  it("compare-length: exactly one beam is the longest or the shortest", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = measureRound("compare-length");
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      const lengths = round.options.map((o) => Number(o.value));
      const correct = Number(round.options.find((o) => o.isCorrect)!.value);
      expect([Math.max(...lengths), Math.min(...lengths)]).toContain(correct);
    }
  });

  it("measure-units: the correct option is the block count, and blocks render", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = measureRound("measure-units");
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      const n = Number(round.targetKey.split("-")[1]);
      expect(round.options.find((o) => o.isCorrect)!.value).toBe(String(n));
      expect(round.promptHtml).toContain("meet-block");
    }
  });

  it("renders local bars and block rows", () => {
    expect(barHtml(3)).toContain("--len:3");
    expect(blocksHtml(4).match(/meet-block"/g)?.length).toBe(4);
  });

  it("moves from two obvious beams to close comparisons and unit counting", () => {
    for (let i = 0; i < 80; i += 1) {
      const starter = measureRound(undefined, 1);
      const starterLengths = starter.options.map((option) => Number(option.value)).sort((a, b) => a - b);
      expect(starter.mode).toBe("compare-length");
      expect(starter.prompt).toContain("langst");
      expect(starter.options).toHaveLength(2);
      expect(starterLengths[1] - starterLengths[0]).toBeGreaterThanOrEqual(2);

      const advanced = measureRound("compare-length", 3);
      const advancedLengths = advanced.options.map((option) => Number(option.value)).sort((a, b) => a - b);
      expect(advanced.options).toHaveLength(3);
      expect(advancedLengths[1] - advancedLengths[0]).toBe(1);
      expect(advancedLengths[2] - advancedLengths[1]).toBe(1);

      const units = measureRound("measure-units", 3);
      expect(Number(units.targetKey.split("-")[1])).toBeLessThanOrEqual(9);
    }
  });
});
