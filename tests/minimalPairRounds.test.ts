import { describe, expect, it, vi } from "vitest";
import type { AttemptLog } from "../src/education/types";
import {
  availableSoundContrasts,
  minimalPairRound,
  recommendedMinimalPairRemediation
} from "../src/education/literacy/minimalPairRounds";

function wrongAttempt(targetKey: string, responseKey: string, timestamp: number): AttemptLog {
  return {
    timestamp,
    sessionId: "s",
    levelId: "literacy-phonemic",
    scene: "minigame",
    challengeType: "literacy-phonemic:soundDiscriminate",
    skill: "soundDiscriminate",
    representation: "numeral",
    quantity: 0,
    quantityRange: "1-3",
    promptRepresentation: "numeral",
    answerRepresentation: "numeral",
    correctAnswer: targetKey,
    playerAnswer: responseKey,
    wasCorrect: false,
    reactionTimeMs: 500,
    hintUsed: false,
    domain: "literacy-phonemic",
    targetKey,
    rangeKey: "phonics",
    stimulusKey: targetKey,
    responseKey
  };
}

function correctPairAttempt(targetKey: string, timestamp: number): AttemptLog {
  return { ...wrongAttempt(targetKey, "goed", timestamp), wasCorrect: true, errorType: undefined };
}

describe("in-game minimal-pair remediation", () => {
  it("only exposes contrasts backed by real picture-word pairs", () => {
    expect(availableSoundContrasts().map((contrast) => contrast.key)).toEqual(["b-p", "a-e", "e-i", "i-o", "m-v"]);
  });

  it("builds a balanced two-picture round for every available contrast", () => {
    for (const contrast of availableSoundContrasts()) {
      for (let index = 0; index < 20; index += 1) {
        const round = minimalPairRound(contrast);
        expect(round.options).toHaveLength(2);
        expect(round.options.filter((option) => option.isCorrect)).toHaveLength(1);
        expect(round.options.find((option) => option.isCorrect)?.word.word).toBe(round.targetWord.word);
        expect(round.targetKey).toBe(`pair-${contrast.key}`);
        expect([round.pair.a.word, round.pair.b.word]).toContain(round.targetWord.word);
      }
    }
  });

  it("starts remediation only after a repeated teachable confusion", () => {
    const attempts = [wrongAttempt("begin-b", "peer", 10)];
    expect(recommendedMinimalPairRemediation(attempts)).toBeUndefined();
    attempts.push(wrongAttempt("begin-b", "pen", 20));
    expect(recommendedMinimalPairRemediation(attempts)).toMatchObject({ contrast: { key: "b-p" }, errors: 2, latestAt: 20 });
  });

  it("chooses the most frequent contrast, then the most recent one", () => {
    const attempts = [
      wrongAttempt("begin-b", "peer", 1),
      wrongAttempt("begin-b", "pen", 2),
      wrongAttempt("begin-v", "muur", 3),
      wrongAttempt("begin-v", "muis", 4)
    ];
    expect(recommendedMinimalPairRemediation(attempts)?.contrast.key).toBe("m-v");
    attempts.push(wrongAttempt("begin-b", "peer", 5));
    expect(recommendedMinimalPairRemediation(attempts)?.contrast.key).toBe("b-p");
  });

  it("recognises errors from an earlier minimal-pair drill itself", () => {
    const attempts = [wrongAttempt("pair-i-o", "vos", 1), wrongAttempt("pair-i-o", "vis", 2)];
    expect(recommendedMinimalPairRemediation(attempts)?.contrast.key).toBe("i-o");
  });

  it("stops auto-serving the drill once successful pair practice resolves it", () => {
    const attempts = [
      wrongAttempt("begin-b", "peer", 1),
      wrongAttempt("begin-b", "pen", 2),
      correctPairAttempt("pair-b-p", 3)
    ];
    expect(recommendedMinimalPairRemediation(attempts)).toBeUndefined();
  });

  it("can select either member as the spoken target", () => {
    const contrast = availableSoundContrasts()[0];
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);
    const first = minimalPairRound(contrast).targetWord.word;
    vi.restoreAllMocks();
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.9);
    const second = minimalPairRound(contrast).targetWord.word;
    vi.restoreAllMocks();
    expect(first).not.toBe(second);
  });
});
