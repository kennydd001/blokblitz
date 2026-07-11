// Letter-sound mapping for the Letterkompas mode. Bridges sounds (Klankgrot) to
// letters. Voice-first, emoji pictures, single starter letters first and
// two-letter graphemes later. The ORDER stays data-driven + configurable.

import type { DifficultyTier } from "../difficulty";
import type { Challenge, ChallengeOption, Representation } from "../types";
import { PHONICS_WORDS } from "./phonics";

export type LetterMode = "sound-to-letter" | "letter-to-word";

// Default starter order; swap this array for a school method's order later.
export const LETTERS = [
  // Single-letter graphemes (consonants + short vowels).
  "m", "s", "v", "r", "n", "b", "k", "z", "h", "t", "l", "d", "p", "f", "w", "o", "a", "e", "i", "u",
  // Two-letter graphemes (long vowels + digraphs) the decodable words use, so
  // Letterkompas teaches "aa"/"ui" as one sound-picture instead of two letters.
  "aa", "ee", "oo", "oe", "ie", "ui", "eu", "ij"
];

const SINGLE_LETTERS = LETTERS.slice(0, 20);
export const STARTER_LETTERS = ["m", "s", "v", "r", "n", "b", "k", "z", "h", "t", "o", "a"];

// Letters that have a picture word (for letter -> word rounds).
const LETTERS_WITH_WORDS = [...new Set(PHONICS_WORDS.map((w) => w.begin))].filter((l) => LETTERS.includes(l));

export const LETTER_MISCONCEPTIONS = ["letter-reversal-confusion", "letter-sound-weak"] as const;
export type LetterMisconception = (typeof LETTER_MISCONCEPTIONS)[number];

export interface LetterRound {
  mode: LetterMode;
  letter: string;
  prompt: string;
  /** what the voice says (the sound). */
  say: string;
  options: Array<{ label: string; value: string; isCorrect: boolean }>;
  targetKey: string;
  skill: "letterSound";
}

const MODES: LetterMode[] = ["sound-to-letter", "letter-to-word"];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function letterkompasRound(mode?: LetterMode, tier: DifficultyTier = 2): LetterRound {
  const eligibleModes: LetterMode[] = tier === 1 ? ["sound-to-letter"] : MODES;
  const roundMode = mode ?? pickOne(eligibleModes);
  const letterPool = tier === 1 ? STARTER_LETTERS : tier === 2 ? SINGLE_LETTERS : LETTERS;
  const optionCount = tier === 1 ? 2 : tier === 2 ? 3 : 4;
  if (roundMode === "sound-to-letter") {
    const letter = pickOne(letterPool);
    const others = shuffle(letterPool.filter((l) => l !== letter)).slice(0, optionCount - 1);
    return {
      mode: roundMode,
      letter,
      prompt: `Welke letter hoor je?`,
      say: letter,
      options: shuffle([
        { label: letter.toUpperCase(), value: letter, isCorrect: true },
        ...others.map((l) => ({ label: l.toUpperCase(), value: l, isCorrect: false }))
      ]),
      targetKey: `letter-${letter}`,
      skill: "letterSound"
    };
  }
  // letter-to-word: show a letter, pick the picture that starts with it.
  const wordPool = tier === 1
    ? PHONICS_WORDS.filter((word) => STARTER_LETTERS.includes(word.begin) && word.units.length === 3)
    : PHONICS_WORDS;
  const eligibleLetters = LETTERS_WITH_WORDS.filter((letter) => letterPool.includes(letter) && wordPool.some((word) => word.begin === letter));
  const letter = pickOne(eligibleLetters);
  const target = pickOne(wordPool.filter((word) => word.begin === letter));
  const others = shuffle(wordPool.filter((word) => word.begin !== letter)).slice(0, optionCount - 1);
  return {
    mode: roundMode,
    letter,
    prompt: `Welk woord begint met de letter ${letter.toUpperCase()}?`,
    say: letter,
    options: shuffle([
      { label: target.emoji, value: target.word, isCorrect: true },
      ...others.map((w) => ({ label: w.emoji, value: w.word, isCorrect: false }))
    ]),
    targetKey: `letter-${letter}`,
    skill: "letterSound"
  };
}

const REVERSAL_LETTERS = new Set(["b", "d", "p", "q"]);

/**
 * Classify a wrong letter answer. A reversal confusion is picking a MIRROR of
 * the target (b<->d, p<->q, b<->p...), so it must compare the child's actual
 * response to the stimulus — not just look at the stimulus (the old bug flagged
 * a reversal whenever the target happened to be b/d/p/q, even for an unrelated
 * pick or a letter-to-word round).
 */
export function classifyLetterError(stimulus: string, response = ""): LetterMisconception {
  if (stimulus !== response && REVERSAL_LETTERS.has(stimulus) && REVERSAL_LETTERS.has(response)) {
    return "letter-reversal-confusion";
  }
  return "letter-sound-weak";
}

let letterCounter = 0;

// Minimal Challenge so Letterkompas rides the shared MiniGameScene flow; the
// scene overrides logAttempt() to log a curriculum (literacy-reading) attempt.
export function letterkompasChallenge(round: LetterRound): Challenge {
  letterCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `letter-${letterCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `letterkompas-${letterCounter}`,
    levelId: "letterkompas",
    challengeType: `letter-${round.mode}`,
    title: "Letterkompas",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.mode === "sound-to-letter" ? round.letter : (options.find((o) => o.isCorrect)?.value ?? round.letter),
    displayTimeMs: 4000,
    options,
    mechanic: `letter|${round.mode}|${round.letter}`,
    successEffect: "Knap, juiste letter!",
    safeErrorEffect: "Luister nog eens.",
    hint: `Luister naar de ${round.letter}-klank.`
  };
}
