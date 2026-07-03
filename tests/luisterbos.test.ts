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
});
