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
});
