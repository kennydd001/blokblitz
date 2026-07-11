import { describe, expect, it } from "vitest";
import { PHONICS_WORDS } from "../src/education/literacy/phonics";
import { rhymeGroups, rhymeKey, rhymeRound } from "../src/education/literacy/rhymes";

const word = (value: string) => PHONICS_WORDS.find((item) => item.word === value)!;

describe("rhyme content", () => {
  it("uses the final vowel nucleus and ending as the rhyme key", () => {
    expect(rhymeKey(word("maan"))).toBe("aa-n");
    expect(rhymeKey(word("banaan"))).toBe("aa-n");
    expect(rhymeKey(word("muis"))).toBe("ui-s");
    expect(rhymeKey(word("hand"))).toBe("a-n-d");
  });

  it("derives only real rhyme families with at least two local words", () => {
    const groups = rhymeGroups();
    expect(groups.find((group) => group.key === "aa-n")?.words.map((item) => item.word)).toEqual(["banaan", "maan"]);
    expect(groups.find((group) => group.key === "ui-s")?.words.map((item) => item.word)).toEqual(["huis", "muis"]);
    expect(groups.every((group) => group.words.length >= 2)).toBe(true);
  });

  it("builds three distinct answer pictures with exactly one rhyme", () => {
    for (let index = 0; index < 150; index += 1) {
      const round = rhymeRound();
      expect(round.options).toHaveLength(3);
      expect(new Set(round.options.map((option) => option.word.word)).size).toBe(3);
      expect(round.options.filter((option) => option.isCorrect)).toHaveLength(1);
      expect(rhymeKey(round.rhymeWord)).toBe(rhymeKey(round.targetWord));
      expect(round.rhymeWord.word).not.toBe(round.targetWord.word);
      expect(round.options.filter((option) => !option.isCorrect).every((option) => rhymeKey(option.word) !== rhymeKey(round.targetWord))).toBe(true);
    }
  });

  it("is deterministic when deriving the available families", () => {
    expect(rhymeGroups()).toEqual(rhymeGroups());
  });

  it("grows from one clear distractor to four close choices", () => {
    for (let index = 0; index < 100; index += 1) {
      const starter = rhymeRound(1);
      expect(starter.options).toHaveLength(2);
      expect(starter.targetWord.units.length).toBeLessThanOrEqual(3);
      expect(starter.rhymeWord.units.length).toBeLessThanOrEqual(3);

      const advanced = rhymeRound(3);
      expect(advanced.options).toHaveLength(4);
      expect(advanced.options.filter((option) => option.isCorrect)).toHaveLength(1);
    }
  });
});
