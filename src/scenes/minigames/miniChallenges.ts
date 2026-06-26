// Small Challenge builders for the calm tap-based game modes. They produce real
// Challenge objects so every answer is logged through the same MasteryTracker and
// shows up in the parent dashboard, while each mode renders its own clear UI.

import { clampQuantity } from "../../education/quantityLayouts";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, ChallengeOption, Representation, Skill } from "../../education/types";

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function nearbyDistractors(target: number, count: number, max = 10): number[] {
  const out: number[] = [];
  const candidates = [target + 1, target - 1, target + 2, target - 2, target + 3];
  for (const value of candidates) {
    const v = Math.round(value);
    if (v >= 1 && v <= max && v !== target && !out.includes(v)) out.push(v);
    if (out.length >= count) break;
  }
  return out;
}

export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function option(quantity: number, representation: Representation, isCorrect: boolean): ChallengeOption {
  return {
    id: uid("opt"),
    label: String(quantity),
    value: quantity,
    quantity,
    representation,
    svg: RepresentationFactory.renderSvg(representation, quantity, { label: String(quantity) }),
    isCorrect
  };
}

function baseChallenge(fields: Partial<Challenge> & { skill: Skill; quantity: number; options: ChallengeOption[] }): Challenge {
  return {
    id: uid("mini"),
    levelId: fields.challengeType ?? "mini",
    challengeType: fields.challengeType ?? "mini",
    title: fields.title ?? "",
    prompt: fields.prompt ?? "",
    scene: "minigame",
    skill: fields.skill,
    representation: fields.representation ?? "numeral",
    promptRepresentation: fields.promptRepresentation ?? "dots",
    answerRepresentation: fields.answerRepresentation ?? "numeral",
    quantity: fields.quantity,
    correctAnswer: fields.correctAnswer ?? fields.quantity,
    displayTimeMs: 4000,
    options: fields.options,
    mechanic: "",
    successEffect: "Goed zo!",
    safeErrorEffect: "Probeer nog eens.",
    hint: fields.hint ?? "Tel rustig: eerst vijf, dan de rest."
  };
}

/** Count a group, then pick the matching numeral. */
export function countChallenge(quantity: number): Challenge {
  const target = clampQuantity(quantity);
  const options = shuffle([
    option(target, "numeral", true),
    ...nearbyDistractors(target, 2).map((q) => option(q, "numeral", false))
  ]);
  return baseChallenge({
    challengeType: "count-tap",
    skill: "quantityToNumeral",
    quantity: target,
    representation: "numeral",
    promptRepresentation: "dots",
    options,
    hint: "Tik elk dier aan en tel mee."
  });
}

/** See a getalbeeld, then tap its number — used by the boss fights, with the
 * representation varied each round so the child reads every number image. */
export function subitizeChallenge(quantity: number, representation: Representation): Challenge {
  const target = clampQuantity(quantity);
  const options = shuffle([
    option(target, "numeral", true),
    ...nearbyDistractors(target, 2).map((q) => option(q, "numeral", false))
  ]);
  return baseChallenge({
    challengeType: "subitize-flash",
    skill: "subitize",
    quantity: target,
    representation: "numeral",
    promptRepresentation: representation,
    answerRepresentation: "numeral",
    options,
    hint: "Tel rustig: eerst vijf, dan de rest."
  });
}

/** Find the card with the same amount as the target, across different representations. */
export function matchChallenge(quantity: number): Challenge {
  const target = clampQuantity(quantity);
  const options = shuffle([
    option(target, "dots", true),
    ...nearbyDistractors(target, 2).map((q) => option(q, "dots", false))
  ]);
  return baseChallenge({
    challengeType: "match-same",
    skill: "subitize",
    quantity: target,
    representation: "mixed",
    promptRepresentation: "dots",
    options,
    hint: "Tel allebei de groepjes en kijk welke even veel heeft."
  });
}

/** Pick the bigger of two groups. */
export function compareChallenge(quantity: number): Challenge {
  const a = Math.max(2, clampQuantity(quantity));
  let b = a + (Math.random() < 0.5 ? 2 : 3);
  if (b > 10) b = a - (Math.random() < 0.5 ? 2 : 3);
  b = clampQuantity(b);
  const larger = Math.max(a, b);
  const options = shuffle([
    option(a, "dots", a === larger),
    option(b, "dots", b === larger)
  ]);
  return baseChallenge({
    challengeType: "compare-more",
    skill: "compare",
    quantity: larger,
    correctAnswer: larger,
    representation: "dots",
    promptRepresentation: "dots",
    options,
    hint: "De grootste groep heeft meer stippen."
  });
}

/** Fill a ten-frame to exactly the target. */
export function fillChallenge(target: number): Challenge {
  const goal = clampQuantity(target);
  return baseChallenge({
    challengeType: "fill-ten",
    skill: goal >= 6 ? "make10" : "buildQuantity",
    quantity: goal,
    representation: "tenframe",
    promptRepresentation: "tenframe",
    answerRepresentation: "tenframe",
    options: [option(goal, "tenframe", true)],
    hint: "Vul net zoveel vakjes als het getal. Eerst de bovenste rij van vijf."
  });
}

/** One more / one less: pick the numeral that is one above or below the base. */
export function oneMoreLessChallenge(base: number, more: boolean): Challenge {
  const b = Math.max(2, Math.min(9, clampQuantity(base)));
  const target = clampQuantity(b + (more ? 1 : -1));
  const raw = more ? [b, clampQuantity(b - 1)] : [b, clampQuantity(b + 1)];
  const distractors = [...new Set(raw)].filter((d) => d !== target).slice(0, 2);
  const options = shuffle([option(target, "numeral", true), ...distractors.map((d) => option(d, "numeral", false))]);
  return baseChallenge({
    challengeType: "one-more-less",
    skill: "oneMoreLess",
    quantity: target,
    correctAnswer: target,
    representation: "numeral",
    promptRepresentation: "dots",
    options,
    hint: more ? `Eentje meer dan ${b} is ${target}.` : `Eentje minder dan ${b} is ${target}.`
  });
}

/** Order: a set of quantities to tap from small to big. options carry the scrambled set. */
export function orderChallenge(count: number): Challenge {
  const n = Math.max(3, Math.min(4, count));
  const picked = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, n);
  const options = shuffle(picked).map((q) => option(q, "dots", false));
  return baseChallenge({
    challengeType: "order-up",
    skill: "compare",
    quantity: Math.max(...picked),
    correctAnswer: [...picked].sort((a, b) => a - b),
    representation: "dots",
    promptRepresentation: "dots",
    options,
    hint: "Begin bij het kleinste getal."
  });
}

/** A synthetic option used when a mode constructs the answer itself (order, fill). */
export function resultOption(isCorrect: boolean): ChallengeOption {
  return { id: uid("result"), label: "ok", value: "ok", representation: "numeral", svg: "", isCorrect };
}

/** Build the option object for a chosen quantity (used by Fill where the child constructs the answer). */
export function pickedOption(quantity: number, target: number, representation: Representation = "tenframe"): ChallengeOption {
  return option(quantity, representation, quantity === target);
}

/** Cross-representation match challenge for the Memory mode (match by amount). */
export function memoryMatchChallenge(quantity: number, matched: boolean): { challenge: Challenge; option: ChallengeOption } {
  const challenge = matchChallenge(quantity);
  return { challenge, option: option(quantity, "mixed", matched) };
}
