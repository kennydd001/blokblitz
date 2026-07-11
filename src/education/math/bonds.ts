// Vriendjes van 10 — de tien is het stevige rekenanker onder elke eerste som.
// Wie snel ziet dat 7 en 3 samen 10 zijn, kan later vlot splitsen, optellen en
// over de tienbrug rekenen. Pure content, zodat ook deze make-10-feiten veilig
// en zonder scene-code getest en herhaald kunnen worden.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type BondMode = "find-partner" | "pick-pair" | "is-ten";

export interface BondRound {
  mode: BondMode;
  a: number;
  b: number;
  /** whether the shown pair fills the ten-frame exactly */
  makesTen: boolean;
  answer: number | "ja" | "nee";
  prompt: string;
  hintText: string;
  options: Array<{ label: string; value: number | string; isCorrect: boolean }>;
  targetKey: string;
  skill: "make10";
}

export const BOND_MISCONCEPTIONS = [
  "partner-off-by-one",
  "counted-to-a-not-ten",
  "not-ten-confusion",
  "bond-weak"
] as const;
export type BondMisconception = (typeof BOND_MISCONCEPTIONS)[number];

const MODES: BondMode[] = ["find-partner", "pick-pair", "is-ten"];
const NUMBER_WORDS = ["nul", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien"];

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function numberOptions(correct: number, given: number): Array<{ label: string; value: number; isCorrect: boolean }> {
  const pool = [...new Set([correct - 1, correct + 1, given])].filter(
    (n) => n >= 0 && n <= 10 && n !== correct
  );
  const distractors = shuffle(pool).slice(0, 2);
  return shuffle([
    { label: String(correct), value: correct, isCorrect: true },
    ...distractors.map((n) => ({ label: String(n), value: n, isCorrect: false }))
  ]);
}

/** Partner of `a` to make ten (10 - a). */
export function partnerTo10(a: number): number {
  return 10 - a;
}

/** Whether a + b fills the ten-frame exactly. */
export function makesTen(a: number, b: number): boolean {
  return a + b === 10;
}

function numberForTier(tier: 1 | 2 | 3): number {
  if (tier === 1) {
    // Friendly anchors occur often, with small given numbers mixed in too.
    return pickOne([5, 5, 5, 9, 1, 8, 2, 0, 1, 2, 3, 4]);
  }
  if (tier === 3) {
    // The middle partners 6+4 and 7+3 get extra practice.
    return pickOne([6, 7, 6, 7, 6, 7, 3, 4, 5, 8, 9]);
  }
  return pickInt(0, 10);
}

function isTenSecondNumber(a: number, tier: 1 | 2 | 3): number {
  const partner = partnerTo10(a);
  const trueChance = tier === 1 ? pickInt(0, 3) !== 0 : pickInt(0, 1) === 0;
  if (trueChance) return partner;
  return pickOne(Array.from({ length: 11 }, (_, n) => n).filter((n) => n !== partner));
}

function hintFor(a: number, b: number, pairMakesTen: boolean): string {
  if (pairMakesTen) {
    return `Tienframe: ${NUMBER_WORDS[a]} vol, dan nog ${NUMBER_WORDS[b]} tot tien.`;
  }
  return `Tienframe: ${NUMBER_WORDS[a]} en ${NUMBER_WORDS[b]} maken geen tien vol.`;
}

/** One make-10 round. Tier 1 uses familiar anchors, tier 2 mixes 0..10, and
 * tier 3 leans on the harder 6/7 partners and more is-ten judgements. */
export function bondRound(mode?: BondMode, tier: 1 | 2 | 3 = 2): BondRound {
  const pickedMode =
    mode ??
    pickOne(
      tier === 1
        ? (["find-partner", "find-partner", "pick-pair", "pick-pair", "is-ten"] as BondMode[])
        : tier === 3
          ? (["find-partner", "pick-pair", "is-ten", "is-ten", "is-ten"] as BondMode[])
          : MODES
    );
  const a = numberForTier(tier);

  if (pickedMode === "is-ten") {
    const b = isTenSecondNumber(a, tier);
    const pairMakesTen = makesTen(a, b);
    const answer = pairMakesTen ? "ja" : "nee";
    return {
      mode: pickedMode,
      a,
      b,
      makesTen: pairMakesTen,
      answer,
      prompt: `Maken ${a} en ${b} samen 10?`,
      hintText: hintFor(a, b, pairMakesTen),
      options: shuffle([
        { label: "ja", value: "ja", isCorrect: answer === "ja" },
        { label: "nee", value: "nee", isCorrect: answer === "nee" }
      ]),
      targetKey: `isten-${a}-${b}`,
      skill: "make10"
    };
  }

  const b = partnerTo10(a);
  const answer = b;
  return {
    mode: pickedMode,
    a,
    b,
    makesTen: true,
    answer,
    prompt: pickedMode === "find-partner" ? `${a} en hoeveel maken 10?` : `Welke vriend maakt ${a} tot 10?`,
    hintText: hintFor(a, b, true),
    options: numberOptions(answer, a),
    targetKey: `bond-${Math.min(a, b)}`,
    skill: "make10"
  };
}

/** Classify a wrong answer into a teaching-relevant misconception. */
export function classifyBondError(round: BondRound, playerAnswer: number | string): BondMisconception {
  if (round.mode === "is-ten") return "not-ten-confusion";

  const player = typeof playerAnswer === "number" ? playerAnswer : Number(playerAnswer);
  const answer = Number(round.answer);
  if (!Number.isFinite(player)) return "bond-weak";
  if (player === round.a && round.a !== answer) return "counted-to-a-not-ten";
  if (Math.abs(player - answer) === 1) return "partner-off-by-one";
  return "bond-weak";
}

let bondCounter = 0;

// Wrap a round as a shared Challenge, like bridgeChallenge beside bridgeRound.
// The future scene can log the make-10 domain while the shared shell receives
// the same familiar ten-frame representation as the other number modes.
export function bondChallenge(round: BondRound): Challenge {
  bondCounter += 1;
  const rep: Representation = "tenframe";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `bond-${bondCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `vriendjes10-${bondCounter}`,
    levelId: "vriendjes10",
    challengeType: `bond-${round.mode}`,
    title: "Vriendjes van 10",
    prompt: round.prompt,
    scene: "minigame",
    skill: "make10",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: "numeral",
    quantity: 0,
    correctAnswer: round.answer,
    displayTimeMs: 4000,
    options,
    mechanic: `bond|${round.mode}|${round.a}|${round.b}`,
    successEffect: "De vriendjes zijn samen 10!",
    safeErrorEffect: "Kijk naar het tienframe.",
    hint: round.hintText
  };
}
