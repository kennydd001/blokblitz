import { describe, expect, it } from "vitest";
import {
  BOND_MISCONCEPTIONS,
  bondChallenge,
  type BondRound,
  bondRound,
  classifyBondError,
  makesTen,
  partnerTo10
} from "../src/education/math/bonds";

const MODES = ["find-partner", "pick-pair", "is-ten"] as const;
const TIERS = [1, 2, 3] as const;

describe("vriendjes van 10 content", () => {
  it("computes every partner and detects exact ten pairs", () => {
    for (let a = 0; a <= 10; a += 1) {
      expect(partnerTo10(a)).toBe(10 - a);
      expect(makesTen(a, partnerTo10(a))).toBe(true);
      for (let b = 0; b <= 10; b += 1) {
        expect(makesTen(a, b)).toBe(a + b === 10);
      }
    }
  });

  it("generates valid rounds for every mode and tier", () => {
    for (const tier of TIERS) {
      for (const mode of MODES) {
        for (let i = 0; i < 40; i += 1) {
          const round = bondRound(mode, tier);
          expect(round.mode).toBe(mode);
          expect(round.a).toBeGreaterThanOrEqual(0);
          expect(round.a).toBeLessThanOrEqual(10);
          expect(round.b).toBeGreaterThanOrEqual(0);
          expect(round.b).toBeLessThanOrEqual(10);
          expect(round.options.filter((option) => option.isCorrect)).toHaveLength(1);

          if (mode === "is-ten") {
            expect(round.answer).toBe(round.makesTen ? "ja" : "nee");
            expect(round.targetKey).toBe(`isten-${round.a}-${round.b}`);
            expect(round.options).toHaveLength(2);
            expect(round.options.map((option) => option.value).sort()).toEqual(["ja", "nee"]);
          } else {
            expect(round.makesTen).toBe(true);
            expect(round.a + round.b).toBe(10);
            expect(round.answer).toBe(round.b);
            expect(round.options).toHaveLength(3);
            expect(round.targetKey).toBe(`bond-${Math.min(round.a, round.b)}`);
            expect(round.options.every((option) => typeof option.value === "number")).toBe(true);
            expect(round.options.every((option) => Number(option.value) >= 0 && Number(option.value) <= 10)).toBe(true);
          }

          const correct = round.options.find((option) => option.isCorrect);
          expect(correct?.value).toBe(round.answer);
        }
      }
    }
  });

  it("keeps numeric distractors distinct and inside the ten-frame range", () => {
    for (const mode of ["find-partner", "pick-pair"] as const) {
      for (let i = 0; i < 200; i += 1) {
        const round = bondRound(mode, 2);
        const values = round.options.map((option) => option.value);
        expect(new Set(values).size).toBe(3);
        expect(round.options.filter((option) => !option.isCorrect)).toHaveLength(2);
        expect(round.options.every((option) => typeof option.value === "number" && option.value >= 0 && option.value <= 10)).toBe(true);
      }
    }
  });

  it("produces both true and false is-ten judgements", () => {
    const answers = new Set<"ja" | "nee">();
    for (let i = 0; i < 200; i += 1) {
      const round = bondRound("is-ten", 2);
      answers.add(round.answer as "ja" | "nee");
      expect(round.answer).toBe(makesTen(round.a, round.b) ? "ja" : "nee");
    }
    expect(answers).toEqual(new Set(["ja", "nee"]));
  });

  it("keeps the target key tied to the smaller partner", () => {
    for (const mode of ["find-partner", "pick-pair"] as const) {
      for (let i = 0; i < 100; i += 1) {
        const round = bondRound(mode, 2);
        expect(round.targetKey).toBe(`bond-${Math.min(round.a, round.b)}`);
        expect(round.a + round.b).toBe(10);
      }
    }
  });

  it("classifies counted-to-a, off-by-one, not-ten and weak bonds", () => {
    const round = { ...bondRound("find-partner", 2), a: 7, b: 3, answer: 3, targetKey: "bond-3" };
    expect(classifyBondError(round, 7)).toBe("counted-to-a-not-ten");
    expect(classifyBondError(round, 4)).toBe("partner-off-by-one");
    expect(classifyBondError(round, "onbekend")).toBe("bond-weak");
    const isTen: BondRound = { ...bondRound("is-ten", 2), a: 6, b: 4, makesTen: true, answer: "ja", targetKey: "isten-6-4" };
    expect(classifyBondError(isTen, "nee")).toBe("not-ten-confusion");
    expect(BOND_MISCONCEPTIONS).toHaveLength(4);
  });

  it("favours friendly tier-one anchors while retaining small given numbers", () => {
    let anchors = 0;
    let small = 0;
    for (let i = 0; i < 200; i += 1) {
      const round = bondRound("find-partner", 1);
      if ([1, 2, 5, 8, 9].includes(round.a)) anchors += 1;
      if (round.a <= 4) small += 1;
    }
    expect(anchors).toBeGreaterThan(100);
    expect(small).toBeGreaterThan(30);
  });

  it("wraps round options one-to-one in a ten-frame Challenge", () => {
    for (const mode of MODES) {
      const round = bondRound(mode, 2);
      const challenge = bondChallenge(round);
      expect(challenge.representation).toBe("tenframe");
      expect(challenge.promptRepresentation).toBe("tenframe");
      expect(challenge.prompt).toBe(round.prompt);
      expect(challenge.hint).toBe(round.hintText);
      expect(challenge.correctAnswer).toBe(round.answer);
      expect(challenge.mechanic).toBe(`bond|${round.mode}|${round.a}|${round.b}`);
      expect(challenge.options).toHaveLength(round.options.length);
      expect(challenge.options.map((option) => ({ label: option.label, value: option.value, isCorrect: option.isCorrect }))).toEqual(round.options);
      expect(challenge.options.filter((option) => option.isCorrect)).toHaveLength(1);
    }
  });
});


