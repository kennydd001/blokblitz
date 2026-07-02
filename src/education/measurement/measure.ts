// Length comparison + natural-unit measuring for the Meetwerf mode. Beams are
// local HTML bars. Compare which beam is longest/shortest, or count how many
// unit blocks long a beam is. Pure data + rendering.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type MeasureMode = "compare-length" | "measure-units";

export interface MeasureRound {
  mode: MeasureMode;
  prompt: string;
  promptHtml?: string;
  options: Array<{ label: string; value: string; isCorrect: boolean }>;
  targetKey: string;
  skill: "measureCompare";
}

export const MEASURE_MISCONCEPTIONS = ["length-direction", "off-by-one", "measure-weak"] as const;
export type MeasureMisconception = (typeof MEASURE_MISCONCEPTIONS)[number];

export function barHtml(length: number): string {
  return `<span class="meet-bar" style="--len:${length}" aria-hidden="true"></span>`;
}

export function blocksHtml(n: number): string {
  return `<span class="meet-blocks" aria-hidden="true">${Array.from({ length: n }, () => `<i class="meet-block"></i>`).join("")}</span>`;
}

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function distinctLengths(count: number, min: number, max: number): number[] {
  const pool = shuffle(Array.from({ length: max - min + 1 }, (_, i) => min + i));
  return pool.slice(0, count);
}

export function measureRound(mode: MeasureMode = pickOne(["compare-length", "measure-units"] as MeasureMode[])): MeasureRound {
  if (mode === "measure-units") {
    const n = pickInt(2, 7);
    const pool = [n - 1, n + 1, n - 2, n + 2].filter((x) => x >= 1 && x <= 9 && x !== n);
    const distractors = shuffle([...new Set(pool)]).slice(0, 2);
    return {
      mode,
      prompt: "Hoeveel blokjes lang is de balk?",
      promptHtml: `<div class="meet-stage">${blocksHtml(n)}</div>`,
      options: shuffle([{ label: String(n), value: String(n), isCorrect: true }, ...distractors.map((x) => ({ label: String(x), value: String(x), isCorrect: false }))]),
      targetKey: `measure-${n}`,
      skill: "measureCompare"
    };
  }
  // compare-length: pick the longest or the shortest beam.
  const lengths = distinctLengths(3, 2, 8);
  const wantLongest = Math.random() < 0.5;
  const target = wantLongest ? Math.max(...lengths) : Math.min(...lengths);
  return {
    mode,
    prompt: wantLongest ? "Welke balk is het langst?" : "Welke balk is het kortst?",
    options: shuffle(lengths.map((len) => ({ label: `${len}`, value: String(len), isCorrect: len === target }))),
    targetKey: `length-${wantLongest ? "long" : "short"}-${target}`,
    skill: "measureCompare"
  };
}

export function classifyMeasureError(round: MeasureRound, playerValue: string): MeasureMisconception {
  if (round.mode === "measure-units") {
    const n = Number(round.targetKey.split("-")[1]);
    if (Math.abs(Number(playerValue) - n) === 1) return "off-by-one";
    return "measure-weak";
  }
  return "length-direction";
}

let measureCounter = 0;

export function measureChallenge(round: MeasureRound): Challenge {
  measureCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `measure-${measureCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `meetwerf-${measureCounter}`,
    levelId: "meetwerf",
    challengeType: `measure-${round.mode}`,
    title: "Meetwerf",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: options.find((o) => o.isCorrect)?.value ?? "",
    displayTimeMs: 4000,
    options,
    mechanic: `measure|${round.mode}`,
    successEffect: "Goed gemeten!",
    safeErrorEffect: "Leg ze naast elkaar en vergelijk.",
    hint: "Langer is verder, korter is minder. Tel de blokjes."
  };
}
