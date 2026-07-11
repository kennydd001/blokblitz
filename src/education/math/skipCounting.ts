import type { Challenge, ChallengeOption, Representation } from "../types";

export type SkipStep = 2 | 5 | 10;
export type SkipCountMode = "next" | "missing";

export interface SkipCountRound {
  mode: SkipCountMode;
  step: SkipStep;
  sequence: number[];
  missingIndex: number;
  answer: number;
  prompt: string;
  hintText: string;
  options: Array<{ label: string; value: number; isCorrect: boolean }>;
  targetKey: string;
  skill: "skipCount";
}

export const SKIP_COUNT_MISCONCEPTIONS = ["counted-by-one", "wrong-jump", "skip-count-weak"] as const;
export type SkipCountMisconception = (typeof SKIP_COUNT_MISCONCEPTIONS)[number];

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function skipCountLimit(step: SkipStep): number {
  if (step === 2) return 20;
  if (step === 5) return 50;
  return 100;
}

function stepsForTier(tier: 1 | 2 | 3): SkipStep[] {
  if (tier === 1) return [2];
  if (tier === 2) return [2, 2, 5];
  return [2, 5, 10];
}

function numberOptions(answer: number, step: SkipStep): Array<{ label: string; value: number; isCorrect: boolean }> {
  const pool = [answer - step, answer + step, answer - 1, answer + 1, answer + step * 2].filter((value) => value >= 0 && value <= skipCountLimit(step) && value !== answer);
  const distractors = shuffle([...new Set(pool)]).slice(0, 2);
  return shuffle([
    { label: String(answer), value: answer, isCorrect: true },
    ...distractors.map((value) => ({ label: String(value), value, isCorrect: false }))
  ]);
}

export function skipCountRound(mode?: SkipCountMode, tier: 1 | 2 | 3 = 2, forcedStep?: SkipStep): SkipCountRound {
  const step = forcedStep ?? pickOne(stepsForTier(tier));
  const pickedMode = mode ?? pickOne(tier === 1 ? (["next", "next", "missing"] as SkipCountMode[]) : (["next", "missing"] as SkipCountMode[]));
  const length = pickedMode === "next" ? 4 : 5;
  const maxStartMultiple = Math.floor((skipCountLimit(step) - step * (length - 1)) / step);
  const start = pickInt(0, Math.max(0, maxStartMultiple)) * step;
  const sequence = Array.from({ length }, (_, index) => start + index * step);
  const missingIndex = pickedMode === "next" ? length - 1 : pickInt(1, length - 2);
  const answer = sequence[missingIndex];
  return {
    mode: pickedMode,
    step,
    sequence,
    missingIndex,
    answer,
    prompt: pickedMode === "next" ? `Tel verder per ${step}. Welk getal komt daarna?` : `We tellen per ${step}. Welk getal is weg?`,
    hintText: `Spring telkens ${step} verder.`,
    options: numberOptions(answer, step),
    targetKey: `skip-${step}`,
    skill: "skipCount"
  };
}

export function classifySkipCountError(round: SkipCountRound, playerAnswer: number | string): SkipCountMisconception {
  const player = typeof playerAnswer === "number" ? playerAnswer : Number(playerAnswer);
  if (!Number.isFinite(player)) return "skip-count-weak";
  const before = round.sequence[Math.max(0, round.missingIndex - 1)];
  if (player === before + 1) return "counted-by-one";
  if (player === round.answer - round.step || player === round.answer + round.step) return "wrong-jump";
  return "skip-count-weak";
}

let skipCountCounter = 0;

export function skipCountChallenge(round: SkipCountRound): Challenge {
  skipCountCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((option, index) => ({
    id: `skip-${skipCountCounter}-${index}`,
    label: option.label,
    value: option.value,
    representation: rep,
    svg: "",
    isCorrect: option.isCorrect
  }));
  return {
    id: `sprongpad-${skipCountCounter}`,
    levelId: "sprongpad",
    challengeType: `skip-count-${round.mode}`,
    title: "Sprongpad",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.answer,
    displayTimeMs: 4000,
    options,
    mechanic: `skip-count|${round.step}|${round.sequence.join("-")}|${round.missingIndex}`,
    successEffect: "Mooie sprong!",
    safeErrorEffect: round.hintText,
    hint: round.hintText
  };
}
