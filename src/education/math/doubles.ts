// Doubles en even/oneven — pure content voor de brug naar optellen.
// Dubbele sommen geven kinderen snelle ankers: 3 + 3 is twee keer evenveel.
// Even en oneven verbinden tellen per twee met het zien van getalstructuren.
// Zo oefenen kinderen eerst met patronen die later helpen bij optellen tot 20.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type DoublesMode = "double" | "near-double" | "even-odd";

export interface DoublesRound {
  mode: DoublesMode;
  /** the base addend; unused for even-odd rounds */
  a: number;
  /** the sum for doubles, or the number to classify for even-odd */
  n: number;
  op: "+" | "?";
  answer: number | "even" | "oneven";
  prompt: string;
  hintText: string;
  options: Array<{ label: string; value: number | string; isCorrect: boolean }>;
  targetKey: string;
  skill: "addSub20";
}

export const DOUBLES_MISCONCEPTIONS = [
  "double-off-by-one",
  "near-double-not-plus-one",
  "even-odd-confusion",
  "double-weak"
] as const;
export type DoublesMisconception = (typeof DOUBLES_MISCONCEPTIONS)[number];

const MODES: DoublesMode[] = ["double", "near-double", "even-odd"];

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function numberOptions(correct: number): Array<{ label: string; value: number; isCorrect: boolean }> {
  const pool = [correct - 1, correct + 1, correct - 2, correct + 2].filter((n) => n >= 0 && n <= 20 && n !== correct);
  const distractors = shuffle(pool).slice(0, 2);
  return shuffle([
    { label: String(correct), value: correct, isCorrect: true },
    ...distractors.map((n) => ({ label: String(n), value: n, isCorrect: false }))
  ]);
}

/** The even numbers are exactly the numbers with no remainder after pairing. */
export function isEven(n: number): boolean {
  return n % 2 === 0;
}

/** The quick double fact used by both the round generator and the classifier. */
export function doubleOf(a: number): number {
  return a + a;
}

function doubleRange(tier: 1 | 2 | 3): [number, number] {
  if (tier === 1) return [1, 5];
  if (tier === 3) return [6, 10];
  return [1, 10];
}

function nearDoubleRange(tier: 1 | 2 | 3): [number, number] {
  if (tier === 1) return [1, 4];
  if (tier === 3) return [5, 9];
  return [1, 9];
}

function evenOddRange(tier: 1 | 2 | 3): [number, number] {
  if (tier === 1) return [1, 10];
  if (tier === 3) return [11, 20];
  return [1, 20];
}

/**
 * One doubles/even-odd round. Tier 1 keeps the numbers gentle, tier 2 mixes
 * the three ideas, and tier 3 moves to larger doubles and numbers up to 20.
 */
export function doublesRound(mode?: DoublesMode, tier: 1 | 2 | 3 = 2): DoublesRound {
  const pickedMode =
    mode ??
    pickOne(
      tier === 1
        ? (["double", "double", "even-odd"] as DoublesMode[])
        : tier === 3
          ? (["double", "near-double", "near-double", "even-odd"] as DoublesMode[])
          : MODES
    );

  if (pickedMode === "double") {
    const [min, max] = doubleRange(tier);
    const a = pickInt(min, max);
    const answer = doubleOf(a);
    return {
      mode: pickedMode,
      a,
      n: answer,
      op: "+",
      answer,
      prompt: `Dubbel ${a}?`,
      hintText: `Dubbel is twee keer evenveel: ${a} en nog ${a}.`,
      options: numberOptions(answer),
      targetKey: `double-${a}`,
      skill: "addSub20"
    };
  }

  if (pickedMode === "near-double") {
    const [min, max] = nearDoubleRange(tier);
    const a = pickInt(min, max);
    const answer = a + (a + 1);
    return {
      mode: pickedMode,
      a,
      n: answer,
      op: "+",
      answer,
      prompt: `${a} + ${a + 1} = ?`,
      hintText: `${a} en nog ${a} is ${doubleOf(a)}, plus 1 is ${answer}.`,
      options: numberOptions(answer),
      targetKey: `near-${a}`,
      skill: "addSub20"
    };
  }

  const [min, max] = evenOddRange(tier);
  const n = pickInt(min, max);
  const answer = isEven(n) ? "even" : "oneven";
  return {
    mode: pickedMode,
    a: 0,
    n,
    op: "?",
    answer,
    prompt: `Is ${n} even of oneven?`,
    hintText: "Leg de getallen in tweetallen. Bij even blijft er niets over; bij oneven blijft er eentje over.",
    options: shuffle([
      { label: "even", value: "even", isCorrect: answer === "even" },
      { label: "oneven", value: "oneven", isCorrect: answer === "oneven" }
    ]),
    targetKey: `evenodd-${n}`,
    skill: "addSub20"
  };
}

/** Classify a wrong answer into a teaching-relevant misconception. */
export function classifyDoublesError(round: DoublesRound, playerAnswer: number | string): DoublesMisconception {
  if (round.mode === "even-odd") return "even-odd-confusion";

  if (typeof playerAnswer === "string" && (playerAnswer === "even" || playerAnswer === "oneven")) {
    return "even-odd-confusion";
  }

  const player = typeof playerAnswer === "number" ? playerAnswer : Number(playerAnswer);
  if (!Number.isFinite(player)) return "double-weak";

  if (round.mode === "near-double" && player === doubleOf(round.a)) {
    return "near-double-not-plus-one";
  }
  if (Math.abs(player - Number(round.answer)) === 1) {
    return round.mode === "near-double" ? "near-double-not-plus-one" : "double-off-by-one";
  }
  return "double-weak";
}

let doublesCounter = 0;

// Wrap a round as a shared Challenge so the Dubbelspel scene rides the same
// MiniGameScene shell as every other mode (co-located with the generator, just
// like bridgeChallenge lives beside bridgeRound). The real skill/domain is
// logged by the scene via buildCurriculumAttempt; Challenge.skill is a
// placeholder like the other curriculum modes.
export function doublesChallenge(round: DoublesRound): Challenge {
  doublesCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `doubles-${doublesCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `dubbelspel-${doublesCounter}`,
    levelId: "dubbelspel",
    challengeType: `doubles-${round.mode}`,
    title: "Dubbelspel",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: "numeral",
    quantity: 0,
    correctAnswer: round.answer,
    displayTimeMs: 4000,
    options,
    mechanic: `doubles|${round.mode}|${round.a}|${round.n}`,
    successEffect: "Dubbel goed!",
    safeErrorEffect: "Tel de twee groepjes samen.",
    hint: round.hintText
  };
}
