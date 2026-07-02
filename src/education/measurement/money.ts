// Money to 10 euro for the Geldmarkt mode. Count coins, or pick the purse that
// holds the target amount. Coins are drawn as local SVG (generic euro-like).
// Pure data + rendering.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type MoneyMode = "count-money" | "make-amount";

export const COINS = [1, 2, 5];

export interface MoneyRound {
  mode: MoneyMode;
  total: number;
  coins: number[];
  prompt: string;
  promptHtml?: string;
  options: Array<{ label: string; value: string; isCorrect: boolean }>;
  targetKey: string;
  skill: "money10";
}

export const MONEY_MISCONCEPTIONS = ["coin-value-ignored", "off-by-one", "money-weak"] as const;
export type MoneyMisconception = (typeof MONEY_MISCONCEPTIONS)[number];

/** A local euro-like coin. */
export function coinSvg(value: number, size = 46): string {
  return `<svg class="coin-svg" width="${size}" height="${size}" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="23" cy="23" r="20" fill="#f4b942" stroke="#10131c" stroke-width="3"/><circle cx="23" cy="23" r="15" fill="none" stroke="#c79a16" stroke-width="1.5"/><text x="23" y="29" text-anchor="middle" font-size="16" font-weight="900" fill="#5a3b00">${value}€</text></svg>`;
}

export function coinRow(coins: number[]): string {
  return `<span class="coin-row">${coins.map((c) => coinSvg(c)).join("")}</span>`;
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

/** Fewest coins ({5,2,1}) that make `amount`. */
export function greedyCoins(amount: number): number[] {
  const out: number[] = [];
  let left = amount;
  for (const c of [5, 2, 1]) {
    while (left >= c) {
      out.push(c);
      left -= c;
    }
  }
  return out;
}

function randomCoinSet(maxTotal: number): number[] {
  const coins: number[] = [];
  let total = 0;
  const pieces = pickInt(2, 4);
  for (let i = 0; i < pieces; i += 1) {
    const options = COINS.filter((c) => total + c <= maxTotal);
    if (options.length === 0) break;
    const c = pickOne(options);
    coins.push(c);
    total += c;
  }
  return coins.length ? coins : [1];
}

export function moneyRound(mode: MoneyMode = pickOne(["count-money", "make-amount"] as MoneyMode[])): MoneyRound {
  if (mode === "count-money") {
    const coins = randomCoinSet(10);
    const total = coins.reduce((a, b) => a + b, 0);
    const pool = [total - 1, total + 1, total - 2, total + 2].filter((n) => n >= 1 && n <= 12 && n !== total);
    const distractors = shuffle([...new Set(pool)]).slice(0, 2);
    return {
      mode,
      total,
      coins,
      prompt: "Hoeveel euro is dit samen?",
      promptHtml: `<div class="geld-stage">${coinRow(coins)}</div>`,
      options: shuffle([{ label: `${total}€`, value: String(total), isCorrect: true }, ...distractors.map((n) => ({ label: `${n}€`, value: String(n), isCorrect: false }))]),
      targetKey: `money-${total}`,
      skill: "money10"
    };
  }
  // make-amount: pick the purse that holds the target amount.
  const target = pickInt(3, 10);
  const wrongA = target === 10 ? target - 1 : target + 1;
  const wrongB = target <= 3 ? target + 2 : target - 2;
  const sets = shuffle([
    { coins: greedyCoins(target), sum: target, isCorrect: true },
    { coins: greedyCoins(wrongA), sum: wrongA, isCorrect: false },
    { coins: greedyCoins(wrongB), sum: wrongB, isCorrect: false }
  ]);
  return {
    mode,
    total: target,
    coins: greedyCoins(target),
    prompt: `Welke portemonnee is ${target} euro?`,
    options: sets.map((s) => ({ label: `${s.sum}€`, value: s.coins.join("-"), isCorrect: s.isCorrect })),
    targetKey: `money-${target}`,
    skill: "money10"
  };
}

export function classifyMoneyError(round: MoneyRound, playerValue: string): MoneyMisconception {
  const player = round.mode === "count-money" ? Number(playerValue) : playerValue.split("-").reduce((a, b) => a + Number(b), 0);
  if (Math.abs(player - round.total) === 1) return "off-by-one";
  return "money-weak";
}

let moneyCounter = 0;

export function moneyChallenge(round: MoneyRound): Challenge {
  moneyCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `money-${moneyCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `geldmarkt-${moneyCounter}`,
    levelId: "geldmarkt",
    challengeType: `money-${round.mode}`,
    title: "Geldmarkt",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: String(round.total),
    displayTimeMs: 4000,
    options,
    mechanic: `money|${round.mode}|${round.total}`,
    successEffect: "Precies betaald!",
    safeErrorEffect: "Tel de muntjes samen.",
    hint: "Tel de muntjes: 5, dan 2, dan 1."
  };
}
