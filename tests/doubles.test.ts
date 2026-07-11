import { describe, expect, it } from "vitest";
import {
  DOUBLES_MISCONCEPTIONS,
  doubleOf,
  doublesRound,
  isEven,
  classifyDoublesError,
  type DoublesMode
} from "../src/education/math/doubles";

const MODES: DoublesMode[] = ["double", "near-double", "even-odd"];

describe("doubles and even-odd rounds", () => {
  it("builds a valid round for every mode and tier", () => {
    for (const tier of [1, 2, 3] as const) {
      for (const mode of MODES) {
        for (let i = 0; i < 30; i += 1) {
          const round = doublesRound(mode, tier);
          expect(round.mode).toBe(mode);
          expect(round.options.filter((option) => option.isCorrect)).toHaveLength(1);
          expect(round.options.find((option) => option.isCorrect)!.value).toBe(round.answer);
          expect(round.skill).toBe("addSub20");
          expect(round.targetKey).toMatch(mode === "double" ? /^double-\d+$/ : mode === "near-double" ? /^near-\d+$/ : /^evenodd-\d+$/);

          if (mode === "double") {
            expect(round.a).toBeGreaterThanOrEqual(1);
            expect(round.a).toBeLessThanOrEqual(10);
            expect(round.n).toBe(doubleOf(round.a));
            expect(round.answer).toBe(round.a + round.a);
            expect(round.op).toBe("+");
          } else if (mode === "near-double") {
            expect(round.a).toBeGreaterThanOrEqual(1);
            expect(round.a).toBeLessThanOrEqual(9);
            expect(round.n).toBe(round.a + (round.a + 1));
            expect(round.answer).toBe(round.a + (round.a + 1));
            expect(round.op).toBe("+");
          } else {
            expect(round.a).toBe(0);
            expect(round.n).toBeGreaterThanOrEqual(1);
            expect(round.n).toBeLessThanOrEqual(20);
            expect(round.answer).toBe(isEven(round.n) ? "even" : "oneven");
            expect(round.op).toBe("?");
          }
        }
      }
    }
  });

  it("keeps numeric answers within 0..20 and has three options", () => {
    for (const mode of ["double", "near-double"] as const) {
      for (let i = 0; i < 80; i += 1) {
        const round = doublesRound(mode);
        expect(round.answer).toBeGreaterThanOrEqual(0);
        expect(round.answer).toBeLessThanOrEqual(20);
        expect(round.options).toHaveLength(3);
        expect(new Set(round.options.map((option) => option.value)).size).toBe(3);
        expect(round.options.filter((option) => option.isCorrect)).toHaveLength(1);
      }
    }
  });

  it("uses the two even-odd labels exactly once", () => {
    for (let i = 0; i < 60; i += 1) {
      const round = doublesRound("even-odd", 3);
      expect(round.options).toHaveLength(2);
      expect(round.options.map((option) => option.value).sort()).toEqual(["even", "oneven"]);
      expect(round.options.filter((option) => option.isCorrect)).toHaveLength(1);
    }
  });

  it("calculates evenness and doubles deterministically", () => {
    expect(doubleOf(3)).toBe(6);
    expect(doubleOf(10)).toBe(20);
    expect(isEven(2)).toBe(true);
    expect(isEven(7)).toBe(false);
    expect(isEven(20)).toBe(true);
  });

  it("answers even-odd prompts correctly for several numbers", () => {
    for (const n of [1, 2, 7, 8, 13, 14, 19, 20]) {
      const round = doublesRound("even-odd", 2);
      const fixedRound = { ...round, n, answer: isEven(n) ? "even" : "oneven" };
      expect(fixedRound.answer).toBe(n % 2 === 0 ? "even" : "oneven");
    }
  });

  it("classifies representative wrong answers", () => {
    const doubleRound = { ...doublesRound("double"), a: 4, n: 8, answer: 8 };
    const nearRound = { ...doublesRound("near-double"), a: 4, n: 9, answer: 9 };
    const evenOddRound = { ...doublesRound("even-odd"), n: 7, answer: "oneven" as const };
    expect(classifyDoublesError(doubleRound, 9)).toBe("double-off-by-one");
    expect(classifyDoublesError(nearRound, 8)).toBe("near-double-not-plus-one");
    expect(classifyDoublesError(evenOddRound, "even")).toBe("even-odd-confusion");
    expect(classifyDoublesError(doubleRound, 3)).toBe("double-weak");
  });

  it("keeps tier 1 in the small range", () => {
    for (const mode of MODES) {
      for (let i = 0; i < 80; i += 1) {
        const round = doublesRound(mode, 1);
        if (mode === "even-odd") {
          expect(round.n).toBeLessThanOrEqual(10);
        } else {
          expect(round.a).toBeLessThanOrEqual(5);
          expect(round.n).toBeLessThanOrEqual(11);
        }
      }
    }
  });

  it("exposes the four teaching misconceptions", () => {
    expect(DOUBLES_MISCONCEPTIONS).toEqual([
      "double-off-by-one",
      "near-double-not-plus-one",
      "even-odd-confusion",
      "double-weak"
    ]);
  });
});

