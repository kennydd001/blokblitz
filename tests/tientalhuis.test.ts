import { describe, expect, it } from "vitest";
import { classifyTeenError, TEEN_MISCONCEPTIONS, teenRound, type TeenRound } from "../src/education/math/teens";

describe("teen-number rounds", () => {
  it("builds read/build rounds with one correct option for totals 11..19", () => {
    for (const mode of ["read-teen", "build-teen"] as const) {
      for (let i = 0; i < 20; i += 1) {
        const round = teenRound(mode);
        expect(round.mode).toBe(mode);
        expect(round.total).toBeGreaterThanOrEqual(11);
        expect(round.total).toBeLessThanOrEqual(19);
        expect(round.ones).toBe(round.total - 10);
        expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
        const correct = round.options.find((o) => o.isCorrect)!.value;
        expect(correct).toBe(mode === "read-teen" ? round.total : round.ones);
      }
    }
  });

  it("classifies tens-confusion and off-by-one", () => {
    const round: TeenRound = { mode: "read-teen", total: 13, tens: 10, ones: 3, prompt: "", options: [], targetKey: "teen-13", skill: "teenNumber" };
    expect(classifyTeenError(round, 3)).toBe("teen-tens-confusion");
    expect(classifyTeenError(round, 12)).toBe("teen-off-by-one");
    expect(TEEN_MISCONCEPTIONS).toContain("teen-weak");
  });
});
