import { describe, expect, it } from "vitest";
import { classifyLineError, LINE_MISCONCEPTIONS, lineRound } from "../src/education/math/numberline";

describe("number line rounds", () => {
  it("blanks the target inside a consecutive 5-number window (0..20) with one correct option", () => {
    for (const mode of ["missing", "after", "before"] as const) {
      for (let i = 0; i < 20; i += 1) {
        const round = lineRound(mode);
        expect(round.window).toHaveLength(5);
        expect(round.window).toContain(round.target);
        expect(round.window.every((n, idx) => idx === 0 || n === round.window[idx - 1] + 1)).toBe(true);
        expect(round.window.every((n) => n >= 0 && n <= 20)).toBe(true);
        expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
        expect(round.options.find((o) => o.isCorrect)!.value).toBe(round.target);
      }
    }
  });

  it("classifies off-by-one on the line", () => {
    expect(classifyLineError(13, 12, "missing")).toBe("line-off-by-one");
    expect(classifyLineError(13, 10, "missing")).toBe("line-weak");
    expect(LINE_MISCONCEPTIONS).toContain("line-weak");
  });
});
