import { describe, expect, it } from "vitest";
import { classifyLetterError, LETTER_MISCONCEPTIONS, LETTERS, letterkompasRound } from "../src/education/literacy/letters";

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

  it("flags reversal-prone letters", () => {
    expect(classifyLetterError("b")).toBe("letter-reversal-confusion");
    expect(classifyLetterError("m")).toBe("letter-sound-weak");
    expect(LETTER_MISCONCEPTIONS).toContain("letter-reversal-confusion");
  });
});
