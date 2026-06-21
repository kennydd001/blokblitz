import { getQuantityRange } from "./quantityLayouts";
import { classifyError } from "./misconceptions";
import type { AttemptLog, Challenge, ChallengeOption } from "./types";

export function buildAttemptLog(params: {
  challenge: Challenge;
  option: ChallengeOption;
  sessionId: string;
  reactionTimeMs: number;
  hintUsed: boolean;
}): AttemptLog {
  const base: Omit<AttemptLog, "errorType"> = {
    timestamp: Date.now(),
    sessionId: params.sessionId,
    levelId: params.challenge.levelId,
    scene: params.challenge.scene,
    challengeType: params.challenge.challengeType,
    skill: params.challenge.skill,
    representation: params.challenge.representation,
    quantity: params.challenge.quantity,
    quantityRange: getQuantityRange(params.challenge.quantity),
    promptRepresentation: params.challenge.promptRepresentation,
    answerRepresentation: params.challenge.answerRepresentation,
    correctAnswer: params.challenge.correctAnswer,
    playerAnswer: params.option.value,
    wasCorrect: params.option.isCorrect,
    reactionTimeMs: Math.round(params.reactionTimeMs),
    hintUsed: params.hintUsed
  };
  return {
    ...base,
    errorType: classifyError(base)
  };
}

