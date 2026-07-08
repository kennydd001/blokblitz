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
  { word: "boot", emoji: "⛵", begin: "b", end: "t", units: ["b", "oo", "t"] },
  // Expanded decodable pool — every unit is in the reading phoneme inventory so
  // readingInventoryIssues() stays empty. Keeps all four reading modes fresh.
  { word: "pen", emoji: "🖊️", begin: "p", end: "n", units: ["p", "e", "n"] },
  { word: "bel", emoji: "🔔", begin: "b", end: "l", units: ["b", "e", "l"] },
  { word: "mes", emoji: "🔪", begin: "m", end: "s", units: ["m", "e", "s"] },
  { word: "kip", emoji: "🐔", begin: "k", end: "p", units: ["k", "i", "p"] },
  { word: "vos", emoji: "🦊", begin: "v", end: "s", units: ["v", "o", "s"] },
  { word: "doos", emoji: "📦", begin: "d", end: "s", units: ["d", "oo", "s"] },
  { word: "poes", emoji: "🐈", begin: "p", end: "s", units: ["p", "oe", "s"] },
  { word: "koe", emoji: "🐄", begin: "k", end: "oe", units: ["k", "oe"] },
  { word: "beer", emoji: "🐻", begin: "b", end: "r", units: ["b", "ee", "r"] },
  { word: "peer", emoji: "🍐", begin: "p", end: "r", units: ["p", "ee", "r"] },
  { word: "raam", emoji: "🪟", begin: "r", end: "m", units: ["r", "aa", "m"] },
  { word: "kaas", emoji: "🧀", begin: "k", end: "s", units: ["k", "aa", "s"] },
  { word: "zeep", emoji: "🧼", begin: "z", end: "p", units: ["z", "ee", "p"] },
  { word: "duim", emoji: "👍", begin: "d", end: "m", units: ["d", "ui", "m"] },
  { word: "hand", emoji: "✋", begin: "h", end: "d", units: ["h", "a", "n", "d"] },
  { word: "tand", emoji: "🦷", begin: "t", end: "d", units: ["t", "a", "n", "d"] },
  { word: "deur", emoji: "🚪", begin: "d", end: "r", units: ["d", "eu", "r"] },
  { word: "vuur", emoji: "🔥", begin: "v", end: "r", units: ["v", "uu", "r"] },
  { word: "muur", emoji: "🧱", begin: "m", end: "r", units: ["m", "uu", "r"] },
  { word: "boek", emoji: "📖", begin: "b", end: "k", units: ["b", "oe", "k"] },
  { word: "hoed", emoji: "🎩", begin: "h", end: "d", units: ["h", "oe", "d"] },
  { word: "lamp", emoji: "💡", begin: "l", end: "p", units: ["l", "a", "m", "p"] },
  { word: "wiel", emoji: "🛞", begin: "w", end: "l", units: ["w", "ie", "l"] },
  { word: "foto", emoji: "📷", begin: "f", end: "o", units: ["f", "o", "t", "o"] },
  { word: "fiets", emoji: "🚲", begin: "f", end: "s", units: ["f", "ie", "t", "s"] },
  { word: "brood", emoji: "🍞", begin: "b", end: "d", units: ["b", "r", "oo", "d"] },
  { word: "kroon", emoji: "👑", begin: "k", end: "n", units: ["k", "r", "oo", "n"] },
  { word: "trein", emoji: "🚂", begin: "t", end: "n", units: ["t", "r", "ei", "n"] },
  { word: "banaan", emoji: "🍌", begin: "b", end: "n", units: ["b", "a", "n", "aa", "n"] },
  { word: "druif", emoji: "🍇", begin: "d", end: "f", units: ["d", "r", "ui", "f"] }
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

/**
 * One phonics round. `tier` shapes the mix dynamically: tier 1 practises
 * begin-sounds only (the entry skill), tier 2 mixes everything, tier 3 leans
 * on the harder blend rounds.
 */
export function phonicsRound(mode?: PhonicsMode, tier: 1 | 2 | 3 = 2): PhonicsRound {
  const pickedMode =
    mode ??
    pickOne(tier === 1 ? (["begin", "begin", "end"] as PhonicsMode[]) : tier === 3 ? (["blend", "blend", "end"] as PhonicsMode[]) : MODES);
  return phonicsRoundFor(pickedMode);
}

function phonicsRoundFor(mode: PhonicsMode): PhonicsRound {
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
