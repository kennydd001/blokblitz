import { describe, expect, it } from "vitest";
import { dueForReview, reviewQueue, sessionWarmup } from "../src/education/review";
import type { AttemptLog } from "../src/education/types";

const DAY = 86_400_000;

const attempt = (overrides: Partial<AttemptLog> = {}): AttemptLog =>
  ({
    timestamp: 0,
    sessionId: "session",
    levelId: "level",
    scene: "runner",
    challengeType: "review",
    skill: "subitize",
    representation: "dots",
    quantity: 1,
    quantityRange: "1-3",
    promptRepresentation: "dots",
    correctAnswer: 1,
    playerAnswer: 1,
    wasCorrect: true,
    reactionTimeMs: 500,
    hintUsed: false,
    ...overrides
  }) as AttemptLog;

describe("review scheduler", () => {
  it("gives a freshly-seen target full retention and no due flag", () => {
    const [item] = reviewQueue([attempt({ timestamp: DAY, targetKey: "one" })], DAY);

    expect(item.retention).toBeCloseTo(1);
    expect(item.due).toBe(false);
    expect(item.exposures).toBe(1);
    expect(item.lastSeen).toBe(DAY);
  });

  it("decays retention below the threshold as time advances", () => {
    const [item] = reviewQueue([attempt({ timestamp: 0, wasCorrect: true, targetKey: "one" })], DAY);

    expect(item.retention).toBeCloseTo(0.5);
    expect(item.retention).toBeLessThan(0.6);
    expect(item.due).toBe(true);
  });

  it("grows the box with consecutive correct answers and slows decay", () => {
    const items = reviewQueue(
      [
        attempt({ timestamp: 0, targetKey: "one" }),
        attempt({ timestamp: 0, targetKey: "one" }),
        attempt({ timestamp: 0, targetKey: "one" }),
        attempt({ timestamp: 0, targetKey: "two" })
      ],
      DAY
    );
    const strong = items.find((item) => item.targetKey === "one");
    const short = items.find((item) => item.targetKey === "two");

    expect(strong?.box).toBe(3);
    expect(strong?.retention).toBeCloseTo(2 ** -0.25);
    expect(strong?.retention).toBeGreaterThan(short?.retention ?? 0);
  });

  it("resets the box after a wrong answer and decays faster", () => {
    const [item] = reviewQueue(
      [
        attempt({ timestamp: 0, targetKey: "one", wasCorrect: true }),
        attempt({ timestamp: DAY, targetKey: "one", wasCorrect: true }),
        attempt({ timestamp: 2 * DAY, targetKey: "one", wasCorrect: false })
      ],
      3 * DAY
    );

    expect(item.box).toBe(0);
    expect(item.retention).toBeCloseTo(0.25);
    expect(item.due).toBe(true);
  });

  it("caps due items at the requested limit in urgency order", () => {
    const items = dueForReview(
      [
        attempt({ timestamp: 0, targetKey: "z", wasCorrect: false }),
        attempt({ timestamp: DAY, targetKey: "m", wasCorrect: false }),
        attempt({ timestamp: 0, targetKey: "a", wasCorrect: true })
      ],
      2 * DAY,
      2
    );

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.targetKey)).toEqual(["z", "m"]);
    expect(items[0].dueScore).toBeGreaterThan(items[1].dueScore);
  });

  it("round-robins warm-up targets across domains and caps the count", () => {
    const attempts = [
      attempt({ timestamp: 0, wasCorrect: false, domain: "math-number", targetKey: "01" }),
      attempt({ timestamp: 0, wasCorrect: false, domain: "math-number", targetKey: "04" }),
      attempt({ timestamp: 0, wasCorrect: false, domain: "literacy-reading", targetKey: "02" }),
      attempt({ timestamp: 0, wasCorrect: false, domain: "math-geometry", targetKey: "03" })
    ];

    const warmup = sessionWarmup(attempts, DAY, 4);

    expect(warmup).toHaveLength(4);
    expect(warmup.map((item) => item.targetKey)).toEqual(["01", "02", "03", "04"]);
    expect(new Set(warmup.slice(0, 3).map((item) => item.domain)).size).toBe(3);
    expect(sessionWarmup(attempts, DAY, 2)).toHaveLength(2);
  });

  it("uses the same fallback domain and target rules as mastery tracking", () => {
    const items = reviewQueue(
      [
        attempt({ quantity: 7, timestamp: 0 }),
        attempt({ quantity: 7, timestamp: DAY, wasCorrect: false })
      ],
      DAY
    );

    expect(items).toHaveLength(1);
    expect(items[0].domain).toBe("math-number");
    expect(items[0].targetKey).toBe("7");
    expect(items[0].exposures).toBe(2);
  });

  it("returns empty arrays for an empty attempt log", () => {
    expect(reviewQueue([], DAY)).toEqual([]);
    expect(dueForReview([], DAY)).toEqual([]);
    expect(sessionWarmup([], DAY)).toEqual([]);
  });
});
