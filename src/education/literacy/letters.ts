// Letter-sound mapping for the Letterkompas mode. Bridges sounds (Klankgrot) to
// letters. Voice-first, emoji pictures, single starter letters first and
// two-letter graphemes later. The ORDER stays data-driven + configurable.

import type { DifficultyTier } from "../difficulty";
import type { AttemptLog, Challenge, ChallengeOption, Representation } from "../types";
import { PHONICS_WORDS } from "./phonics";

export type LetterMode = "sound-to-letter" | "letter-to-word";

// One new grapheme is combined with familiar ones. This is the supported game
// inventory in a deliberate initial-reading order; a school's exact method can
// still replace the data without changing the progression engine.
export const LETTERS = [
  "i", "k", "m", "s",
  "p", "aa", "r", "e", "v",
  "n", "t", "ee", "b", "oo",
  "d", "oe", "z", "ij", "h",
  "w", "o", "a", "u", "eu", "ie", "l", "ui", "f"
];

const SINGLE_LETTERS = LETTERS.filter((letter) => letter.length === 1);
export const STARTER_LETTERS = LETTERS.slice(0, 4);
const CLEAN_SUCCESSES_TO_EARN_A_LETTER = 2;

export interface LetterProgress {
  unlockedLetters: string[];
  masteredLetters: string[];
  nextLetter?: string;
}

function attemptedLetter(attempt: AttemptLog): string | undefined {
  if (attempt.domain !== "literacy-reading" || !attempt.targetKey?.startsWith("letter-")) return undefined;
  const letter = attempt.targetKey.slice("letter-".length).toLowerCase();
  return LETTERS.includes(letter) ? letter : undefined;
}

/** Profile-local letter book: never relock legacy-seen letters; otherwise each
 * grapheme with two independent, unhinted successes earns one new grapheme. */
export function letterProgress(attempts: AttemptLog[]): LetterProgress {
  const letterAttempts = attempts
    .map((attempt) => ({ attempt, letter: attemptedLetter(attempt) }))
    .filter((item): item is { attempt: AttemptLog; letter: string } => Boolean(item.letter));
  const cleanByLetter = new Map<string, number>();
  let seenFrontier = STARTER_LETTERS.length;
  for (const { attempt, letter } of letterAttempts) {
    seenFrontier = Math.max(seenFrontier, LETTERS.indexOf(letter) + 1);
    if (attempt.wasCorrect && !attempt.hintUsed) cleanByLetter.set(letter, (cleanByLetter.get(letter) ?? 0) + 1);
  }
  const masteredLetters = LETTERS.filter(
    (letter) => (cleanByLetter.get(letter) ?? 0) >= CLEAN_SUCCESSES_TO_EARN_A_LETTER
  );
  const unlockedCount = Math.min(
    LETTERS.length,
    Math.max(STARTER_LETTERS.length, seenFrontier, STARTER_LETTERS.length + masteredLetters.length)
  );
  return {
    unlockedLetters: LETTERS.slice(0, unlockedCount),
    masteredLetters,
    nextLetter: LETTERS[unlockedCount]
  };
}

/** Prefer an explicit adaptive target; otherwise spread practice over the least
 * evidenced unlocked grapheme so the first four do not depend on lucky rolls. */
export function letterPracticeTarget(
  attempts: AttemptLog[],
  unlockedLetters: readonly string[],
  adaptiveTarget?: string
): string {
  const focused = adaptiveTarget?.startsWith("letter-") ? adaptiveTarget.slice("letter-".length).toLowerCase() : undefined;
  if (focused && unlockedLetters.includes(focused)) return focused;

  const stats = new Map<string, { clean: number; exposures: number; lastSeen: number }>();
  for (const letter of unlockedLetters) stats.set(letter, { clean: 0, exposures: 0, lastSeen: 0 });
  for (const attempt of attempts) {
    const letter = attemptedLetter(attempt);
    const current = letter ? stats.get(letter) : undefined;
    if (!current) continue;
    current.exposures += 1;
    current.lastSeen = Math.max(current.lastSeen, attempt.timestamp);
    if (attempt.wasCorrect && !attempt.hintUsed) current.clean += 1;
  }
  return [...unlockedLetters].sort((a, b) => {
    const aa = stats.get(a)!;
    const bb = stats.get(b)!;
    return aa.clean - bb.clean || aa.exposures - bb.exposures || aa.lastSeen - bb.lastSeen || LETTERS.indexOf(a) - LETTERS.indexOf(b);
  })[0] ?? STARTER_LETTERS[0];
}

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

export function letterkompasRound(
  mode?: LetterMode,
  tier: DifficultyTier = 2,
  availableLetters?: readonly string[],
  preferredLetter?: string
): LetterRound {
  const tierPool = tier === 1 ? STARTER_LETTERS : tier === 2 ? SINGLE_LETTERS : LETTERS;
  const requestedPool = availableLetters?.filter((letter) => LETTERS.includes(letter)) ?? tierPool;
  const letterPool = requestedPool.length >= 2 ? [...requestedPool] : [...STARTER_LETTERS];
  const preferred = preferredLetter && letterPool.includes(preferredLetter) ? preferredLetter : undefined;
  const canUsePreferredWord = !preferred || LETTERS_WITH_WORDS.includes(preferred);
  const eligibleModes: LetterMode[] = tier === 1 || !canUsePreferredWord ? ["sound-to-letter"] : MODES;
  const roundMode = mode && eligibleModes.includes(mode) ? mode : mode ? "sound-to-letter" : pickOne(eligibleModes);
  const optionCount = tier === 1 ? 2 : tier === 2 ? 3 : 4;
  if (roundMode === "sound-to-letter") {
    const letter = preferred ?? pickOne(letterPool);
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
  const letter = preferred && eligibleLetters.includes(preferred) ? preferred : pickOne(eligibleLetters);
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
