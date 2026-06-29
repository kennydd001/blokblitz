import { getQuantityRange } from "./quantityLayouts";
import { classifyError } from "./misconceptions";
import type { AttemptLog, Challenge, ChallengeOption, CurriculumSkill, LearningDomain } from "./types";

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

// Build an AttemptLog for a NON-number domain (reading, measurement...). The real
// signal lives in domain/targetKey/rangeKey/stimulusKey/responseKey; the numeric
// fields are neutral placeholders and number views filter them out by `domain`.
export function buildCurriculumAttempt(params: {
  sessionId: string;
  domain: LearningDomain;
  skill: CurriculumSkill;
  targetKey: string;
  rangeKey: string;
  stimulusKey: string;
  responseKey: string;
  wasCorrect: boolean;
  reactionTimeMs: number;
  hintUsed: boolean;
  errorType?: string;
}): AttemptLog {
  return {
    timestamp: Date.now(),
    sessionId: params.sessionId,
    levelId: params.domain,
    scene: "minigame",
    challengeType: `${params.domain}:${params.skill}`,
    skill: params.skill,
    representation: "numeral",
    quantity: 0,
    quantityRange: "1-3",
    promptRepresentation: "numeral",
    answerRepresentation: "numeral",
    correctAnswer: params.targetKey,
    playerAnswer: params.responseKey,
    wasCorrect: params.wasCorrect,
    reactionTimeMs: Math.round(params.reactionTimeMs),
    hintUsed: params.hintUsed,
    errorType: params.wasCorrect ? undefined : params.errorType,
    domain: params.domain,
    targetKey: params.targetKey,
    rangeKey: params.rangeKey,
    stimulusKey: params.stimulusKey,
    responseKey: params.responseKey
  };
}

