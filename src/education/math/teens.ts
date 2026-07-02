// Teen-number structure (10 + n) for the Tientalhuis mode — the first math-to-20
// content. Pure data + round generation. A teen number is one full ten room plus
// loose ones; the child either reads the teen number or finds the loose-ones part.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type TeenMode = "read-teen" | "build-teen";

export interface TeenRound {
  mode: TeenMode;
  total: number; // 11..19
  tens: number; // always 10 here
  ones: number; // total - 10
  prompt: string;
  options: Array<{ label: string; value: number; isCorrect: boolean }>;
  targetKey: string; // teen-13
  skill: "teenNumber";
}

export const TEEN_MISCONCEPTIONS = ["teen-tens-confusion", "teen-off-by-one", "teen-weak"] as const;
export type TeenMisconception = (typeof TEEN_MISCONCEPTIONS)[number];

const MODES: TeenMode[] = ["read-teen", "build-teen"];

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function numberOptions(correct: number, pool: number[]): Array<{ label: string; value: number; isCorrect: boolean }> {
  const fallbackMax = correct <= 9 ? 9 : 20;
  const fallbackMin = correct <= 9 ? 0 : 10;
  const fallback = Array.from({ length: fallbackMax - fallbackMin + 1 }, (_, index) => fallbackMin + index);
  const distractors = shuffle([...new Set([...pool, correct - 1, correct + 1, correct - 2, correct + 2, ...fallback])]
    .filter((n) => n >= fallbackMin && n <= fallbackMax && n !== correct)).slice(0, 2);
  return shuffle([{ label: String(correct), value: correct, isCorrect: true }, ...distractors.map((n) => ({ label: String(n), value: n, isCorrect: false }))]);
}

export function teenRound(mode: TeenMode = pickOne(MODES)): TeenRound {
  const total = pickInt(11, 19);
  const ones = total - 10;
  if (mode === "read-teen") {
    // Distractors: the ones digit alone (tens confusion) + a neighbour.
    const pool = [ones, total + 1, total - 1, 10 + ((ones + 1) % 10)];
    return {
      mode,
      total,
      tens: 10,
      ones,
      prompt: "Welk getal is dit? Tien en nog wat.",
      options: numberOptions(total, pool),
      targetKey: `teen-${total}`,
      skill: "teenNumber"
    };
  }
  // build-teen: 13 is tien en hoeveel?
  const pool = [ones + 1, ones - 1, ones + 2, 10].filter((n) => n >= 0 && n <= 9);
  return {
    mode,
    total,
    tens: 10,
    ones,
    prompt: `${total} is tien en hoeveel?`,
    options: numberOptions(ones, pool),
    targetKey: `teen-${total}`,
    skill: "teenNumber"
  };
}

export function classifyTeenError(round: TeenRound, player: number): TeenMisconception {
  const correct = round.mode === "read-teen" ? round.total : round.ones;
  if (round.mode === "read-teen" && player === round.ones) return "teen-tens-confusion";
  if (Math.abs(player - correct) === 1) return "teen-off-by-one";
  return "teen-weak";
}

let teenCounter = 0;

export function teenChallenge(round: TeenRound): Challenge {
  teenCounter += 1;
  const rep: Representation = "tenframe";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `teen-${teenCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  const correct = round.mode === "read-teen" ? round.total : round.ones;
  return {
    id: `tientalhuis-${teenCounter}`,
    levelId: "tientalhuis",
    challengeType: `teen-${round.mode}`,
    title: "Tientalhuis",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: "numeral",
    quantity: 0,
    correctAnswer: correct,
    displayTimeMs: 4000,
    options,
    mechanic: `teen|${round.mode}|${round.total}|${round.ones}`,
    successEffect: "Knap! Tien en nog wat.",
    safeErrorEffect: "Kijk: eerst de volle tien.",
    hint: "Eerst de volle tien, dan de losse."
  };
}
