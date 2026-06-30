import { describe, expect, it } from "vitest";
import { BRIDGE_MISCONCEPTIONS, bridgeRound, classifyBridgeError } from "../src/education/math/addsub20";

describe("ten-bridge rounds", () => {
  it("every add/sub round actually crosses 10 and stays in 0..20", () => {
    for (const mode of ["add", "sub"] as const) {
      for (let i = 0; i < 40; i += 1) {
        const round = bridgeRound(mode);
        expect(round.answer).toBeGreaterThanOrEqual(0);
        expect(round.answer).toBeLessThanOrEqual(20);
        expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
        expect(round.options.find((o) => o.isCorrect)!.value).toBe(round.answer);
        if (mode === "add") {
          expect(round.a + round.b).toBe(round.answer);
          expect(round.a).toBeLessThan(10);
          expect(round.b).toBeLessThan(10);
          expect(round.a + round.b).toBeGreaterThan(10);
          expect(round.bridge.start + round.bridge.toTen).toBe(10);
          expect(round.bridge.rest).toBeGreaterThanOrEqual(1);
        } else {
          expect(round.a - round.b).toBe(round.answer);
          expect(round.a).toBeGreaterThan(10);
          expect(round.answer).toBeLessThan(10);
        }
      }
    }
  });

  it("to-ten asks the make-ten part", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = bridgeRound("to-ten");
      expect(round.a + round.answer).toBe(10);
      expect(round.options.find((o) => o.isCorrect)!.value).toBe(round.answer);
    }
  });

  it("classifies off-by-one and exposes misconceptions", () => {
    const round = bridgeRound("add");
    expect(classifyBridgeError(round, round.answer + 1)).toBe("off-by-one");
    expect(BRIDGE_MISCONCEPTIONS).toContain("bridge-weak");
  });
});
