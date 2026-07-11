// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PLAY_MODES } from "../src/data/playModes";
import { buildDailyPlayPlan, localDayKey, recommendationStage } from "../src/education/dailyPlan";
import type { AttemptLog } from "../src/education/types";
import { SaveManager } from "../src/game/SaveManager";

const NOW = new Date(2026, 6, 11, 12, 0, 0).getTime();

function attempt(overrides: Partial<AttemptLog> = {}): AttemptLog {
  return {
    timestamp: NOW - 1000,
    sessionId: "session",
    levelId: "letterkompas",
    scene: "minigame",
    challengeType: "letter-sound",
    skill: "letterSound",
    representation: "mixed",
    quantity: 1,
    quantityRange: "1-3",
    promptRepresentation: "mixed",
    correctAnswer: "s",
    playerAnswer: "m",
    wasCorrect: false,
    reactionTimeMs: 900,
    hintUsed: true,
    domain: "literacy-reading",
    targetKey: "letter-s",
    ...overrides
  };
}

function input(overrides: Partial<Parameters<typeof buildDailyPlayPlan>[0]> = {}) {
  return {
    dayKey: "2026-07-11",
    now: NOW,
    attempts: [],
    activityHistory: [],
    journeyIndex: 0,
    journeyRound: 1,
    ...overrides
  };
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("daily play plan", () => {
  it("balances one math, literacy and discovery mission without advanced starter content", () => {
    const plan = buildDailyPlayPlan(input());
    expect(plan.map((item) => item.track)).toEqual(["math", "literacy", "discovery"]);
    expect(new Set(plan.map((item) => item.scene)).size).toBe(3);
    plan.forEach((item) => expect(PLAY_MODES.find((mode) => mode.scene === item.scene)?.stage).toBe(1));
    expect(plan.map((item) => item.scene)).not.toContain("kloktoren");
    expect(plan.map((item) => item.scene)).not.toContain("geldmarkt");
  });

  it("is stable for the day and moves away from the most recently finished shell", () => {
    const first = buildDailyPlayPlan(input());
    expect(buildDailyPlayPlan(input())).toEqual(first);

    const recentMath = first.find((item) => item.track === "math")!.scene;
    const varied = buildDailyPlayPlan(
      input({ activityHistory: [{ sceneId: recentMath, completedAt: NOW - 1000, inJourney: false }] })
    );
    expect(varied.find((item) => item.track === "math")?.scene).not.toBe(recentMath);
  });

  it("turns repeated reading errors into a visible reading recommendation", () => {
    const attempts = Array.from({ length: 5 }, (_, index) => attempt({ timestamp: NOW - index * 1000 }));
    const plan = buildDailyPlayPlan(input({ attempts }));
    expect(plan.find((item) => item.track === "literacy")?.scene).toBe("letterkompas");
  });

  it("maps a weak target to its exact game instead of every game in that domain", () => {
    const attempts = Array.from({ length: 5 }, (_, index) =>
      attempt({
        timestamp: NOW - index * 1000,
        levelId: "literacy-reading",
        skill: "wordRead",
        targetKey: "word-vis"
      })
    );
    const plan = buildDailyPlayPlan(input({ attempts, journeyIndex: 10 }));
    expect(plan.find((item) => item.track === "literacy")?.scene).toBe("zoemroute");
  });

  it("only unlocks later recommendations after enough trajectory evidence", () => {
    expect(recommendationStage(input())).toBe(1);
    expect(recommendationStage(input({ journeyIndex: 10 }))).toBe(2);
    expect(recommendationStage(input({ journeyIndex: 30 }))).toBe(3);
    expect(recommendationStage(input({ journeyRound: 2 }))).toBe(3);
  });

  it("uses the child's local calendar day instead of UTC midnight", () => {
    expect(localDayKey(new Date(2026, 6, 11, 23, 59))).toBe("2026-07-11");
  });

  it("stores one plan per profile day and never pays its completion twice", () => {
    const save = new SaveManager();
    expect(save.ensureDailyPlan("2026-07-11", ["count", "klankgrot", "vormenburcht"]).modeIds).toEqual([
      "count",
      "klankgrot",
      "vormenburcht"
    ]);
    expect(save.completeDailyMode("count")).toMatchObject({ newlyCompleted: true, completedCount: 1, rewardEarned: false });
    expect(save.completeDailyMode("count")).toMatchObject({ newlyCompleted: false, completedCount: 1, rewardEarned: false });
    save.completeDailyMode("klankgrot");
    expect(save.completeDailyMode("vormenburcht")).toMatchObject({ completedCount: 3, rewardEarned: true });
    expect(save.completeDailyMode("vormenburcht")).toMatchObject({ newlyCompleted: false, rewardEarned: false });

    const next = save.ensureDailyPlan("2026-07-12", ["match", "rijmspel", "verkeerspad"]);
    expect(next.completedModeIds).toEqual([]);
    expect(next.rewardClaimed).toBe(false);
  });

  it("keeps daily missions isolated between sibling profiles", () => {
    const save = new SaveManager();
    const first = save.createProfile("A", "blitz");
    save.ensureDailyPlan("2026-07-11", ["count", "klankgrot", "vormenburcht"]);
    save.completeDailyMode("count");

    const second = save.createProfile("B", "aqua");
    expect(save.getData().progress.dailyPlan.completedModeIds).toEqual([]);
    save.ensureDailyPlan("2026-07-11", ["match", "rijmspel", "verkeerspad"]);
    save.completeDailyMode("match");

    save.switchProfile(first.id);
    expect(save.getData().progress.dailyPlan.completedModeIds).toEqual(["count"]);
    save.switchProfile(second.id);
    expect(save.getData().progress.dailyPlan.completedModeIds).toEqual(["match"]);
  });
});
