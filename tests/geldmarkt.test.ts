import { describe, expect, it } from "vitest";
import { classifyMoneyError, coinSvg, greedyCoins, moneyRound } from "../src/education/measurement/money";

describe("geldmarkt rounds", () => {
  it("greedy coins make the amount from {5,2,1}", () => {
    for (let n = 1; n <= 10; n += 1) {
      const coins = greedyCoins(n);
      expect(coins.reduce((a, b) => a + b, 0)).toBe(n);
      expect(coins.every((c) => [5, 2, 1].includes(c))).toBe(true);
    }
  });

  it("count-money: shown coins sum to the total, one correct option, total <= 10", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = moneyRound("count-money");
      expect(round.coins.reduce((a, b) => a + b, 0)).toBe(round.total);
      expect(round.total).toBeLessThanOrEqual(10);
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(round.options.find((o) => o.isCorrect)!.value).toBe(String(round.total));
    }
  });

  it("make-amount: exactly one purse sums to the target", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = moneyRound("make-amount");
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      const correct = round.options.find((o) => o.isCorrect)!;
      const sum = correct.value.split("-").reduce((a, b) => a + Number(b), 0);
      expect(sum).toBe(round.total);
    }
  });

  it("renders a local coin SVG and classifies off-by-one", () => {
    expect(coinSvg(2)).toContain("<svg");
    const round = moneyRound("count-money");
    expect(classifyMoneyError(round, String(round.total + 1))).toBe("off-by-one");
  });
});
