import { describe, expect, it } from "vitest";
import { TRAFFIC_CARDS, trafficRound } from "../src/education/world/traffic";

describe("verkeerspad cards", () => {
  it("every card has 3 options, exactly one safe answer, and a spoken lesson", () => {
    expect(TRAFFIC_CARDS.length).toBeGreaterThanOrEqual(8);
    for (const card of TRAFFIC_CARDS) {
      expect(card.options).toHaveLength(3);
      expect(card.options.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(card.lesson.length).toBeGreaterThan(10);
      expect(card.options.every((o) => o.emoji && o.label)).toBe(true);
    }
  });

  it("builds a round for a specific card with one correct option", () => {
    const round = trafficRound("licht-rood");
    expect(round.card.id).toBe("licht-rood");
    expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(round.targetKey).toBe("traffic-licht-rood");
    expect(round.skill).toBe("trafficSafety");
  });

  it("card ids are unique", () => {
    const ids = TRAFFIC_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
