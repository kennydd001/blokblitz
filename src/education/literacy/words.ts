// Connected blending ("zoemend lezen") for the Zoemroute mode: the child sees a
// word's sound stones in order, hears them stretched together into one word, then
// picks the matching picture. Reuses the phonics word set; prefers short CVC-style
// words first. Pure data + round generation (no DOM).

import type { Challenge, ChallengeOption, Representation } from "../types";
import { PHONICS_WORDS, type PhonicsWord } from "./phonics";

// Simple words first: at most three sound units.
const SIMPLE_WORDS = PHONICS_WORDS.filter((w) => w.units.length <= 3);

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

export function zoemRound(): ZoemRound {
  const word = pickOne(SIMPLE_WORDS);
  const others = shuffle(PHONICS_WORDS.filter((w) => w.word !== word.word)).slice(0, 2);
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

export function bouwRound(): BouwRound {
  const word = pickOne(SIMPLE_WORDS);
  const units = word.units;
  const blankIndex = Math.floor(Math.random() * units.length);
  const correct = units[blankIndex];
  const distractors = shuffle(ALL_UNITS.filter((u) => u !== correct)).slice(0, 2);
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

export function classifyBouwError(blankIndex: number, unitsLength: number): BouwMisconception {
  if (blankIndex === 0) return "first-sound-weak";
  if (blankIndex === unitsLength - 1) return "final-sound-weak";
  return "vowel-length-weak"; // the middle box is usually the vowel
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
