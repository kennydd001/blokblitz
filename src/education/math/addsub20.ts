// Addition / subtraction to 20 over the ten-bridge for the Tienbrug mode. Every
// problem crosses 10: you first fill (or empty) the ten, then move the rest. The
// `bridge` field carries that decomposition for the teaching scaffold. Pure data.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type BridgeMode = "add" | "sub" | "to-ten";

export interface BridgeRound {
  mode: BridgeMode;
  a: number;
  b: number;
  op: "+" | "-";
  answer: number;
  prompt: string;
  /** decomposition over the ten, e.g. 8 + 5 -> {start:8, toTen:2, rest:3}. */
  bridge: { start: number; toTen: number; rest: number };
  bridgeText: string;
  options: Array<{ label: string; value: number; isCorrect: boolean }>;
  targetKey: string;
  skill: "addSub20" | "bridge10";
}

export const BRIDGE_MISCONCEPTIONS = ["no-bridge-counted-on", "off-by-one", "bridge-weak"] as const;
export type BridgeMisconception = (typeof BRIDGE_MISCONCEPTIONS)[number];

const MODES: BridgeMode[] = ["add", "sub", "to-ten"];

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
  return shuffle([{ label: String(correct), value: correct, isCorrect: true }, ...distractors.map((n) => ({ label: String(n), value: n, isCorrect: false }))]);
}

export function bridgeRound(mode: BridgeMode = pickOne(MODES)): BridgeRound {
  if (mode === "to-ten") {
    const a = pickInt(6, 9);
    const answer = 10 - a;
    return {
      mode,
      a,
      b: answer,
      op: "+",
      answer,
      prompt: `${a} + ? = 10`,
      bridge: { start: a, toTen: answer, rest: 0 },
      bridgeText: `${a} en ${answer} is 10.`,
      options: numberOptions(answer),
      targetKey: `toten-${a}`,
      skill: "bridge10"
    };
  }
  if (mode === "add") {
    const a = pickInt(5, 9);
    const toTen = 10 - a;
    const rest = pickInt(1, a - 1); // keeps b <= 9
    const b = toTen + rest;
    const answer = a + b; // 10 + rest
    return {
      mode,
      a,
      b,
      op: "+",
      answer,
      prompt: `${a} + ${b} = ?`,
      bridge: { start: a, toTen, rest },
      bridgeText: `${a} en ${toTen} is 10, en nog ${rest} is ${answer}.`,
      options: numberOptions(answer),
      targetKey: `add-${a}-${b}`,
      skill: "addSub20"
    };
  }
  // sub: minuend in 11..18, cross down through 10.
  const minuend = pickInt(11, 18);
  const ones = minuend - 10;
  const rest = pickInt(1, 9 - ones);
  const b = ones + rest;
  const answer = minuend - b; // 10 - rest
  return {
    mode,
    a: minuend,
    b,
    op: "-",
    answer,
    prompt: `${minuend} - ${b} = ?`,
    bridge: { start: minuend, toTen: ones, rest },
    bridgeText: `${minuend} min ${ones} is 10, en nog ${rest} eraf is ${answer}.`,
    options: numberOptions(answer),
    targetKey: `sub-${minuend}-${b}`,
    skill: "addSub20"
  };
}

export function classifyBridgeError(round: BridgeRound, player: number): BridgeMisconception {
  // Counting on/back without bridging often lands one off, or ignores the ten.
  if (Math.abs(player - round.answer) === 1) return "off-by-one";
  if (round.mode === "add" && player === round.bridge.rest) return "no-bridge-counted-on";
  return "bridge-weak";
}

let bridgeCounter = 0;

export function bridgeChallenge(round: BridgeRound): Challenge {
  bridgeCounter += 1;
  const rep: Representation = "tenframe";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `bridge-${bridgeCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `tienbrug-${bridgeCounter}`,
    levelId: "tienbrug",
    challengeType: `bridge-${round.mode}`,
    title: "Tienbrug",
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
    mechanic: `bridge|${round.mode}|${round.a}|${round.b}|${round.bridge.toTen}|${round.bridge.rest}`,
    successEffect: "Over de tienbrug!",
    safeErrorEffect: "Eerst de tien vol, dan de rest.",
    hint: round.bridgeText
  };
}
