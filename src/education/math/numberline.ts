// Number line to 20 for the Getallenlijn Glijbaan mode. A 5-number window of the
// line is shown with one spot blank; the child finds the missing number, or the
// one that comes before/after. Pure data + round generation.

import type { Challenge, ChallengeOption, Representation } from "../types";
import type { RemediationCopy } from "../remediation";

export type LineMode = "missing" | "after" | "before";

export interface LineRound {
  mode: LineMode;
  target: number; // 1..19, the blank spot (= the answer)
  window: number[]; // 5 consecutive numbers shown, with `target` blanked
  prompt: string;
  options: Array<{ label: string; value: number; isCorrect: boolean }>;
  targetKey: string; // line-13
  skill: "numberLine20";
}

export const LINE_MISCONCEPTIONS = ["line-off-by-one", "line-direction", "line-weak"] as const;
export type LineMisconception = (typeof LINE_MISCONCEPTIONS)[number];

const MODES: LineMode[] = ["missing", "after", "before"];

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function windowFor(target: number): number[] {
  const start = Math.max(0, Math.min(16, target - 2));
  return [0, 1, 2, 3, 4].map((i) => start + i);
}

function numberOptions(correct: number): Array<{ label: string; value: number; isCorrect: boolean }> {
  const pool = [correct - 1, correct + 1, correct - 2, correct + 2].filter((n) => n >= 0 && n <= 20 && n !== correct);
  const distractors = shuffle(pool).slice(0, 2);
  return shuffle([{ label: String(correct), value: correct, isCorrect: true }, ...distractors.map((n) => ({ label: String(n), value: n, isCorrect: false }))]);
}

/**
 * One number-line round. `tier` shapes the range dynamically: tier 1 stays on
 * the friendly 1..9 stretch (and skips the trickier "before" mode), tier 2 is
 * the full line to 20, tier 3 lives on the harder 9..19 stretch.
 */
export function lineRound(mode?: LineMode, tier: 1 | 2 | 3 = 2): LineRound {
  const pickedMode = mode ?? pickOne(tier === 1 ? (["missing", "after"] as LineMode[]) : MODES);
  const target = tier === 1 ? pickInt(1, 9) : tier === 3 ? pickInt(9, 19) : pickInt(1, 19);
  return lineRoundFor(pickedMode, target);
}

function lineRoundFor(mode: LineMode, target: number): LineRound {
  const window = windowFor(target);
  let prompt = "Welk getal is weg?";
  if (mode === "after") prompt = `Welk getal komt na de ${target - 1}?`;
  if (mode === "before") prompt = `Welk getal komt voor de ${target + 1}?`;
  return {
    mode,
    target,
    window,
    prompt,
    options: numberOptions(target),
    targetKey: `line-${target}`,
    skill: "numberLine20"
  };
}

export function classifyLineError(target: number, player: number, mode: LineMode): LineMisconception {
  if (mode !== "missing" && (player === target - 1 || player === target + 1) && Math.abs(player - target) === 1) {
    // picked the neighbour on the wrong side
    return "line-direction";
  }
  if (Math.abs(player - target) === 1) return "line-off-by-one";
  return "line-weak";
}

export function lineRemediation(round: LineRound, error: LineMisconception, player: number): RemediationCopy {
  if (error === "line-direction") {
    const after = round.mode === "after";
    return {
      nudge: after ? "Kijk één vakje naar rechts." : "Kijk één vakje naar links.",
      guided: after ? "Na is naar rechts." : "Voor is naar links.",
      model: "Tel rustig langs de lijn."
    };
  }
  return {
    nudge: player < round.target ? "Tel één stap verder." : "Tel één stap terug.",
    guided: "Kijk naar de getallen naast het lege vak.",
    model: "Tel rustig langs de lijn."
  };
}

let lineCounter = 0;

export function lineChallenge(round: LineRound): Challenge {
  lineCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `line-${lineCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `getallenlijn-${lineCounter}`,
    levelId: "getallenlijn",
    challengeType: `line-${round.mode}`,
    title: "Getallenlijn",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.target,
    displayTimeMs: 4000,
    options,
    mechanic: `line|${round.mode}|${round.target}|${round.window.join(",")}`,
    successEffect: "Juist op de lijn!",
    safeErrorEffect: "Tel langs de lijn.",
    hint: "Tel rustig langs de getallenlijn."
  };
}
