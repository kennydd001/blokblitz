import { describe, expect, it } from "vitest";
import { LISTEN_STORIES, storySession } from "../src/education/literacy/stories";

describe("luisterbos stories", () => {
  it("every story has a text and two picture questions with one correct answer", () => {
    expect(LISTEN_STORIES.length).toBeGreaterThanOrEqual(5);
    for (const story of LISTEN_STORIES) {
      expect(story.text.length).toBeGreaterThan(40);
      expect(story.questions).toHaveLength(2);
      for (const question of story.questions) {
        expect(question.options).toHaveLength(3);
        expect(question.options.filter((o) => o.isCorrect)).toHaveLength(1);
        expect(question.options.every((o) => o.emoji && o.label)).toBe(true);
      }
    }
  });

  it("a session plan interleaves 3 stories x 2 questions, story text first", () => {
    const rounds = storySession(3);
    expect(rounds).toHaveLength(6);
    // Each story opens with storyStart on its first question only.
    const starts = rounds.filter((r) => r.storyStart);
    expect(starts).toHaveLength(3);
    expect(rounds[0].storyStart).toBe(true);
    expect(rounds[1].storyStart).toBe(false);
    expect(rounds[0].story.id).toBe(rounds[1].story.id);
    // Ids are unique per (story, question).
    expect(new Set(rounds.map((r) => r.targetKey)).size).toBe(6);
  });

  it("stages one recall question per story before longer listening sets", () => {
    const starter = storySession(3, 1);
    expect(starter).toHaveLength(3);
    expect(starter.every((round) => round.storyStart)).toBe(true);
    expect(starter.every((round) => round.question.difficulty !== "reasoning")).toBe(true);

    const advanced = storySession(4, 3);
    expect(advanced).toHaveLength(8);
    expect(advanced.filter((round) => round.storyStart)).toHaveLength(4);
  });

  it("asks two distinct questions about how and where Pim slides", () => {
    const pim = LISTEN_STORIES.find((story) => story.id === "pinguin-ijs")!;
    expect(new Set(pim.questions.map((question) => question.prompt)).size).toBe(2);
    expect(pim.questions[0].options.find((option) => option.isCorrect)?.label).toBe("op het ijs");
    expect(pim.questions[1].options.find((option) => option.isCorrect)?.label).toBe("op zijn buik");
  });
});
