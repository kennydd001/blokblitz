// Phonemic-awareness content for the Klankgrot mode — the first literacy domain.
// Pure data + pure round generation (no DOM). Words use a local emoji as their
// "picture" so a pre-reader never has to read a label; the spoken voice carries
// the sound. Digraphs / long vowels (aa, oo, ui, ...) are kept as ONE sound unit.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type PhonicsMode = "begin" | "end" | "blend";

export interface PhonicsWord {
  word: string;
  emoji: string;
  begin: string;
  end: string;
  units: string[];
}

export const PHONICS_WORDS: PhonicsWord[] = [
  { word: "maan", emoji: "🌙", begin: "m", end: "n", units: ["m", "aa", "n"] },
  { word: "vis", emoji: "🐟", begin: "v", end: "s", units: ["v", "i", "s"] },
  { word: "zon", emoji: "☀️", begin: "z", end: "n", units: ["z", "o", "n"] },
  { word: "boom", emoji: "🌳", begin: "b", end: "m", units: ["b", "oo", "m"] },
  { word: "kat", emoji: "🐱", begin: "k", end: "t", units: ["k", "a", "t"] },
  { word: "hond", emoji: "🐶", begin: "h", end: "d", units: ["h", "o", "n", "d"] },
  { word: "muis", emoji: "🐭", begin: "m", end: "s", units: ["m", "ui", "s"] },
  { word: "neus", emoji: "👃", begin: "n", end: "s", units: ["n", "eu", "s"] },
  { word: "roos", emoji: "🌹", begin: "r", end: "s", units: ["r", "oo", "s"] },
  { word: "bal", emoji: "⚽", begin: "b", end: "l", units: ["b", "a", "l"] },
  { word: "sok", emoji: "🧦", begin: "s", end: "k", units: ["s", "o", "k"] },
  { word: "ster", emoji: "⭐", begin: "s", end: "r", units: ["s", "t", "e", "r"] },
  { word: "huis", emoji: "🏠", begin: "h", end: "s", units: ["h", "ui", "s"] },
  { word: "boot", emoji: "⛵", begin: "b", end: "t", units: ["b", "oo", "t"] }
];

export const PHONICS_MISCONCEPTIONS = ["first-sound-weak", "final-sound-weak", "blend-weak"] as const;
export type PhonicsMisconception = (typeof PHONICS_MISCONCEPTIONS)[number];

export interface PhonicsRound {
  mode: PhonicsMode;
  /** the begin/end sound being tested (empty for blend). */
  targetSound: string;
  /** the word to find (blend mode). */
  targetWord?: PhonicsWord;
  /** spoken instruction. */
  prompt: string;
  /** sound units to speak aloud (one item for begin/end; the word's units for blend). */
  sayUnits: string[];
  options: Array<{ word: PhonicsWord; isCorrect: boolean }>;
  /** logging key, e.g. begin-m / end-s / blend-maan. */
  targetKey: string;
  /** curriculum skill: sound discrimination vs. blending. */
  skill: "soundDiscriminate" | "soundBlend";
}

const MODES: PhonicsMode[] = ["begin", "end", "blend"];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function phonicsRound(mode: PhonicsMode = pickOne(MODES)): PhonicsRound {
  if (mode === "begin") {
    const target = pickOne(PHONICS_WORDS);
    const sound = target.begin;
    const others = shuffle(PHONICS_WORDS.filter((w) => w.begin !== sound)).slice(0, 2);
    return {
      mode,
      targetSound: sound,
      prompt: `Welk woord begint met de ${sound}-klank?`,
      sayUnits: [sound],
      options: shuffle([{ word: target, isCorrect: true }, ...others.map((w) => ({ word: w, isCorrect: false }))]),
      targetKey: `begin-${sound}`,
      skill: "soundDiscriminate"
    };
  }
  if (mode === "end") {
    const target = pickOne(PHONICS_WORDS);
    const sound = target.end;
    const others = shuffle(PHONICS_WORDS.filter((w) => w.end !== sound)).slice(0, 2);
    return {
      mode,
      targetSound: sound,
      prompt: `Welk woord eindigt met de ${sound}-klank?`,
      sayUnits: [sound],
      options: shuffle([{ word: target, isCorrect: true }, ...others.map((w) => ({ word: w, isCorrect: false }))]),
      targetKey: `end-${sound}`,
      skill: "soundDiscriminate"
    };
  }
  const target = pickOne(PHONICS_WORDS);
  const others = shuffle(PHONICS_WORDS.filter((w) => w.word !== target.word)).slice(0, 2);
  return {
    mode,
    targetSound: "",
    targetWord: target,
    prompt: `Welk plaatje is ${target.units.join("-")}?`,
    sayUnits: target.units,
    options: shuffle([{ word: target, isCorrect: true }, ...others.map((w) => ({ word: w, isCorrect: false }))]),
    targetKey: `blend-${target.word}`,
    skill: "soundBlend"
  };
}

export function classifyPhonicsError(mode: PhonicsMode): PhonicsMisconception {
  if (mode === "begin") return "first-sound-weak";
  if (mode === "end") return "final-sound-weak";
  return "blend-weak";
}

let phonicsCounter = 0;

// A minimal Challenge so the round can ride the shared MiniGameScene flow. The
// numeric fields are placeholders (skill "subitize", quantity 0); KlankgrotScene
// overrides logAttempt() so this placeholder skill is NEVER logged — the real
// signal is logged as a curriculum attempt (domain literacy-phonemic).
export function phonicsChallenge(round: PhonicsRound): Challenge {
  phonicsCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `phon-${phonicsCounter}-${i}`,
    label: opt.word.emoji,
    value: opt.word.word,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `phonics-${phonicsCounter}`,
    levelId: "klankgrot",
    challengeType: `phonics-${round.mode}`,
    title: "Klankgrot",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.targetWord?.word ?? round.targetSound,
    displayTimeMs: 4000,
    options,
    mechanic: `phonics|${round.mode}`,
    successEffect: "Goed geluisterd!",
    safeErrorEffect: "Luister nog eens.",
    hint: round.mode === "blend" ? "Luister: ik rek de klanken." : `Luister naar de ${round.targetSound}-klank.`
  };
}
