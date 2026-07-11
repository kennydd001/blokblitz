import { describe, expect, it, vi } from "vitest";
import { classifyLetterError, LETTER_MISCONCEPTIONS, LETTERS, letterkompasRound, STARTER_LETTERS } from "../src/education/literacy/letters";

describe("letterkompas rounds", () => {
  it("builds sound-to-letter and letter-to-word rounds with exactly one correct option", () => {
    for (const mode of ["sound-to-letter", "letter-to-word"] as const) {
      const round = letterkompasRound(mode);
      expect(round.mode).toBe(mode);
      expect(round.options).toHaveLength(3);
      expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(round.targetKey.startsWith("letter-")).toBe(true);
      expect(LETTERS).toContain(round.letter);
    }
  });

  it("letter-to-word: the correct picture begins with the shown letter", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = letterkompasRound("letter-to-word");
      const correct = round.options.find((o) => o.isCorrect)!;
      expect(correct.value.startsWith(round.letter)).toBe(true);
    }
  });

  it("flags a reversal only when the child actually picked a mirror letter", () => {
    // Target b, child picked d -> a real b/d reversal confusion.
    expect(classifyLetterError("b", "d")).toBe("letter-reversal-confusion");
    expect(classifyLetterError("p", "q")).toBe("letter-reversal-confusion");
    // Target b but the child picked an unrelated letter (or a word) -> not a reversal.
    expect(classifyLetterError("b", "m")).toBe("letter-sound-weak");
    expect(classifyLetterError("b", "vis")).toBe("letter-sound-weak");
    // Target m -> never a reversal.
    expect(classifyLetterError("m", "n")).toBe("letter-sound-weak");
    expect(LETTER_MISCONCEPTIONS).toContain("letter-reversal-confusion");
  });

  it("stages starter sounds, single letters and two-letter sounds", () => {
    for (let i = 0; i < 40; i += 1) {
      const starter = letterkompasRound(undefined, 1);
      expect(starter.mode).toBe("sound-to-letter");
      expect(STARTER_LETTERS).toContain(starter.letter);
      expect(starter.options).toHaveLength(2);

      const middle = letterkompasRound("sound-to-letter", 2);
      expect(middle.letter).toHaveLength(1);
      expect(middle.options).toHaveLength(3);
    }
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    const advanced = letterkompasRound("sound-to-letter", 3);
    expect(advanced.letter).toBe("ij");
    expect(advanced.options).toHaveLength(4);
    random.mockRestore();
  });
});
