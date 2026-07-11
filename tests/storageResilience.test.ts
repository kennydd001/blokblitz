// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AttemptLog, PlaySession } from "../src/education/types";
import {
  MAX_CHILD_PROFILES,
  MAX_STORED_ATTEMPTS,
  MAX_STORED_SESSIONS,
  SaveManager,
  compactAttemptHistory,
  defaultSaveData
} from "../src/game/SaveManager";

function attempt(index: number, targetKey: string): AttemptLog {
  return {
    timestamp: index,
    sessionId: `session-${Math.floor(index / 7)}`,
    levelId: "letterkompas",
    scene: "minigame",
    challengeType: "letter-sound",
    skill: "letterSound",
    representation: "numeral",
    quantity: 0,
    quantityRange: "1-3",
    promptRepresentation: "numeral",
    answerRepresentation: "numeral",
    correctAnswer: targetKey,
    playerAnswer: targetKey,
    wasCorrect: index % 5 !== 0,
    reactionTimeMs: 900 + index,
    hintUsed: index % 7 === 0,
    domain: "literacy-reading",
    targetKey,
    rangeKey: "letters"
  };
}

function session(index: number): PlaySession {
  return {
    id: `session-${index}`,
    startedAt: index * 10_000,
    endedAt: index * 10_000 + 4_000,
    starsEarned: index % 8,
    rescued: index % 3,
    attempts: 7
  };
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("long-term local save resilience", () => {
  it("retains recent evidence per learning target before filling with newest attempts", () => {
    const source = [
      ...Array.from({ length: 20 }, (_, index) => attempt(index, "letter-a")),
      ...Array.from({ length: 20 }, (_, index) => attempt(index + 20, "letter-b")),
      ...Array.from({ length: 20 }, (_, index) => attempt(index + 40, "letter-c"))
    ];

    const compacted = compactAttemptHistory(source, 15);
    expect(compacted).toHaveLength(15);
    expect(compacted.map((item) => item.timestamp)).toEqual([...compacted.map((item) => item.timestamp)].sort((a, b) => a - b));
    expect(compacted.at(-1)?.timestamp).toBe(59);
    expect(compacted.filter((item) => item.targetKey === "letter-a").map((item) => item.timestamp)).toEqual([17, 18, 19]);
    expect(compacted.filter((item) => item.targetKey === "letter-b")).toHaveLength(6);
    expect(compacted.filter((item) => item.targetKey === "letter-c")).toHaveLength(6);
  });

  it("compacts oversized legacy profiles while preserving every represented target", () => {
    const data = defaultSaveData();
    data.progress.attempts = Array.from({ length: 1350 }, (_, index) => attempt(index, `letter-${index % 75}`));
    data.progress.sessions = Array.from({ length: 240 }, (_, index) => session(index));
    data.progress.activityHistory = Array.from({ length: 160 }, (_, index) => ({
      sceneId: `mode-${index % 25}`,
      completedAt: index,
      inJourney: index % 2 === 0
    }));
    localStorage.setItem("blokblitz-save-v1", JSON.stringify(data));

    const save = new SaveManager();
    const progress = save.getData().progress;
    expect(progress.attempts).toHaveLength(MAX_STORED_ATTEMPTS);
    expect(progress.sessions).toHaveLength(MAX_STORED_SESSIONS);
    expect(progress.activityHistory).toHaveLength(120);
    expect(new Set(progress.attempts.map((item) => item.targetKey))).toHaveLength(75);
    expect(progress.attempts.at(-1)?.timestamp).toBe(1349);
    expect(Buffer.byteLength(save.exportJson(), "utf8")).toBeLessThan(1_000_000);
  });

  it("caps new child profiles without changing the existing four", () => {
    const save = new SaveManager();
    for (let index = 1; index <= MAX_CHILD_PROFILES; index += 1) save.createProfile(`Kind ${index}`, "blitz", index);

    expect(save.listProfiles()).toHaveLength(MAX_CHILD_PROFILES);
    expect(() => save.createProfile("Te veel", "aqua", 99)).toThrow(/at most 4 child profiles/);
    expect(save.listProfiles().map((profile) => profile.name)).toEqual(["Kind 1", "Kind 2", "Kind 3", "Kind 4"]);
  });
});
