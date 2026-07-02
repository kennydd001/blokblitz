import { describe, expect, it } from "vitest";
import { classifyClockError, clockRound, clockSvg, dutchTime } from "../src/education/measurement/time";

describe("kloktoren rounds", () => {
  it("builds read/which rounds with one correct option at whole or half hours", () => {
    for (const mode of ["read-clock", "which-clock"] as const) {
      for (let i = 0; i < 20; i += 1) {
        const round = clockRound(mode);
        expect(round.mode).toBe(mode);
        expect([0, 30]).toContain(round.minute);
        expect(round.hour).toBeGreaterThanOrEqual(1);
        expect(round.hour).toBeLessThanOrEqual(12);
        expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
        expect(round.options.find((o) => o.isCorrect)!.value).toBe(`${round.hour}:${round.minute}`);
      }
    }
  });

  it("uses the Flemish half-hour convention", () => {
    expect(dutchTime(3, 0)).toBe("3 uur");
    expect(dutchTime(3, 30)).toBe("half 4");
    expect(dutchTime(12, 30)).toBe("half 1");
  });

  it("renders a local clock SVG with hands", () => {
    const svg = clockSvg(3, 30);
    expect(svg).toContain("<svg");
    expect(svg).toContain("<line");
  });

  it("classifies hour/half confusion", () => {
    const round = clockRound("read-clock");
    const wrongMinute = round.minute === 0 ? 30 : 0;
    expect(classifyClockError(round, `${round.hour}:${wrongMinute}`)).toBe("hour-half-confusion");
  });
});
