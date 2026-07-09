// Letter-sound mapping for the Letterkompas mode. Bridges sounds (Klankgrot) to
// letters. Voice-first, emoji pictures, single starter letters only. The letter
// ORDER is data-driven + configurable (a school/Kim/Zoem order can replace it).

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

export function letterkompasRound(mode: LetterMode = pickOne(MODES)): LetterRound {
  if (mode === "sound-to-letter") {
    const letter = pickOne(LETTERS);
    const others = shuffle(LETTERS.filter((l) => l !== letter)).slice(0, 2);
    return {
      mode,
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
  const letter = pickOne(LETTERS_WITH_WORDS);
  const target = pickOne(PHONICS_WORDS.filter((w) => w.begin === letter));
  const others = shuffle(PHONICS_WORDS.filter((w) => w.begin !== letter)).slice(0, 2);
  return {
    mode,
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
