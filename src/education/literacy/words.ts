// Connected blending ("zoemend lezen") for the Zoemroute mode: the child sees a
// word's sound stones in order, hears them stretched together into one word, then
// picks the matching picture. Reuses the phonics word set; prefers short CVC-style
// words first. Pure data + round generation (no DOM).

import type { DifficultyTier } from "../difficulty";
import type { Challenge, ChallengeOption, Representation } from "../types";
import { PHONICS_WORDS, type PhonicsWord } from "./phonics";

// Simple words first: at most three sound units.
const SIMPLE_WORDS = PHONICS_WORDS.filter((w) => w.units.length <= 3);
const VOWEL_UNITS = new Set(["a", "e", "i", "o", "u", "aa", "ee", "oo", "uu", "oe", "eu", "ui", "ie", "ei", "ij", "au", "ou"]);
const STARTER_WORDS = SIMPLE_WORDS.filter((word) => word.units.length === 3 && word.units.every((unit) => unit.length === 1));

export interface ZoemRound {
  word: PhonicsWord;
  units: string[];
  prompt: string;
  options: Array<{ word: PhonicsWord; isCorrect: boolean }>;
  targetKey: string; // word-maan
  skill: "wordRead";
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function wordPoolForTier(tier: DifficultyTier, knownUnits?: readonly string[]): PhonicsWord[] {
  const pool = tier === 1 ? STARTER_WORDS : tier === 2 ? SIMPLE_WORDS : PHONICS_WORDS;
  if (!knownUnits?.length) return pool;
  const known = new Set(knownUnits);
  const decodable = pool.filter((word) => word.units.every((unit) => known.has(unit)));
  return decodable.length > 0 ? decodable : pool;
}

function wordSimilarity(first: PhonicsWord, second: PhonicsWord): number {
  return Number(first.begin === second.begin) * 3
    + Number(first.end === second.end) * 3
    + Number(first.units.length === second.units.length) * 2;
}

export function zoemRound(tier: DifficultyTier = 2, knownUnits?: readonly string[], targetKey?: string): ZoemRound {
  const wordPool = wordPoolForTier(tier, knownUnits);
  const focusedWord = targetKey?.startsWith("word-") ? targetKey.slice("word-".length) : undefined;
  const word = wordPool.find((candidate) => candidate.word === focusedWord) ?? pickOne(wordPool);
  const distractorPool = wordPool.length >= (tier === 1 ? 2 : tier === 2 ? 3 : 4)
    ? wordPool
    : wordPoolForTier(tier);
  const candidates = shuffle(distractorPool.filter((candidate) => candidate.word !== word.word));
  if (tier === 3) candidates.sort((first, second) => wordSimilarity(second, word) - wordSimilarity(first, word));
  const others = candidates.slice(0, tier === 1 ? 1 : tier === 2 ? 2 : 3);
  return {
    word,
    units: word.units,
    prompt: "Zoem de klanken samen. Welk plaatje is het?",
    options: shuffle([{ word, isCorrect: true }, ...others.map((w) => ({ word: w, isCorrect: false }))]),
    targetKey: `word-${word.word}`,
    skill: "wordRead"
  };
}

// ---- Woordbouwplaats: sound segmentation (fill the missing sound box) --------
const ALL_UNITS = [...new Set(PHONICS_WORDS.flatMap((w) => w.units))];

export type BouwMisconception = "first-sound-weak" | "final-sound-weak" | "vowel-length-weak" | "build-weak";

export interface BouwRound {
  word: PhonicsWord;
  units: string[];
  blankIndex: number;
  correct: string;
  prompt: string;
  options: Array<{ label: string; value: string; isCorrect: boolean }>;
  targetKey: string; // build-maan-1
  skill: "wordBuild";
}

export function bouwRound(tier: DifficultyTier = 2, knownUnits?: readonly string[], targetKey?: string): BouwRound {
  const wordPool = wordPoolForTier(tier, knownUnits);
  const focused = targetKey?.match(/^build-(.+)-(\d+)$/);
  const focusedWord = focused?.[1];
  const word = wordPool.find((candidate) => candidate.word === focusedWord) ?? pickOne(wordPool);
  const units = word.units;
  const blankChoices = tier === 1 ? [...new Set([0, units.length - 1])] : units.map((_, index) => index);
  const focusedBlank = Number(focused?.[2]);
  const blankIndex = focusedWord === word.word && Number.isInteger(focusedBlank) && focusedBlank >= 0 && focusedBlank < units.length
    ? focusedBlank
    : pickOne(blankChoices);
  const correct = units[blankIndex];
  const allowedUnits = knownUnits?.length ? ALL_UNITS.filter((unit) => knownUnits.includes(unit)) : ALL_UNITS;
  const sameSoundClass = allowedUnits.filter((unit) => unit !== correct && VOWEL_UNITS.has(unit) === VOWEL_UNITS.has(correct));
  const otherSoundClass = allowedUnits.filter((unit) => unit !== correct && !sameSoundClass.includes(unit));
  const candidates = [...shuffle(sameSoundClass), ...shuffle(otherSoundClass)];
  if (tier === 3) candidates.sort((first, second) => Number(second.length === correct.length) - Number(first.length === correct.length));
  const distractors = candidates.slice(0, tier === 1 ? 1 : tier === 2 ? 2 : 3);
  return {
    word,
    units,
    blankIndex,
    correct,
    prompt: "Welke klank hoort in het lege vakje?",
    options: shuffle([{ label: correct, value: correct, isCorrect: true }, ...distractors.map((u) => ({ label: u, value: u, isCorrect: false }))]),
    targetKey: `build-${word.word}-${blankIndex}`,
    skill: "wordBuild"
  };
}

export function classifyBouwError(blankIndex: number, unitsLength: number, unit?: string): BouwMisconception {
  if (blankIndex === 0) return "first-sound-weak";
  if (blankIndex === unitsLength - 1) return "final-sound-weak";
  if (unit === undefined || VOWEL_UNITS.has(unit)) return "vowel-length-weak";
  return "build-weak";
}

let bouwCounter = 0;

export function bouwChallenge(round: BouwRound): Challenge {
  bouwCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `bouw-${bouwCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `woordbouwplaats-${bouwCounter}`,
    levelId: "woordbouwplaats",
    challengeType: "word-build",
    title: "Woordbouwplaats",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.correct,
    displayTimeMs: 4000,
    options,
    mechanic: `bouw|${round.word.word}|${round.blankIndex}`,
    successEffect: "Woord gemaakt!",
    safeErrorEffect: "Luister nog eens naar het woord.",
    hint: "Zeg het woord traag en luister naar elke klank."
  };
}

let zoemCounter = 0;

export function zoemChallenge(round: ZoemRound): Challenge {
  zoemCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `zoem-${zoemCounter}-${i}`,
    label: opt.word.emoji,
    value: opt.word.word,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `zoemroute-${zoemCounter}`,
    levelId: "zoemroute",
    challengeType: "word-blend",
    title: "Zoemroute",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.word.word,
    displayTimeMs: 4000,
    options,
    mechanic: `zoem|${round.word.word}|${round.units.join("-")}`,
    successEffect: "Knap gezoemd!",
    safeErrorEffect: "Zoem nog eens, rustig.",
    hint: "Rek de klanken aan elkaar tot een woord."
  };
}
