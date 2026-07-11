import type { AttemptLog, Challenge, ChallengeOption, Representation } from "../types";
import { availableRemediations, type MinimalPair } from "./minimalPairs";
import { PHONICS_WORDS, type PhonicsWord } from "./phonics";

export interface SoundContrast {
  units: [string, string];
  key: string;
}

export interface MinimalPairRound {
  pair: MinimalPair;
  contrast: SoundContrast;
  targetWord: PhonicsWord;
  prompt: string;
  hintText: string;
  options: Array<{ word: PhonicsWord; isCorrect: boolean }>;
  targetKey: string;
  skill: "soundDiscriminate";
}

export interface RecommendedRemediation {
  contrast: SoundContrast;
  errors: number;
  latestAt: number;
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function contrastKey(a: string, b: string): string {
  return [a, b].sort((left, right) => left.localeCompare(right)).join("-");
}

function soundContrast(a: string, b: string): SoundContrast {
  const units = [a, b].sort((left, right) => left.localeCompare(right)) as [string, string];
  return { units, key: contrastKey(units[0], units[1]) };
}

const REMEDIATIONS = availableRemediations();
const REMEDIATION_BY_KEY = new Map(REMEDIATIONS.map(({ contrast, pairs }) => [contrastKey(contrast[0], contrast[1]), pairs]));

export function availableSoundContrasts(): SoundContrast[] {
  return [...REMEDIATION_BY_KEY.keys()].map((key) => {
    const [a, b] = key.split("-");
    return soundContrast(a, b);
  });
}

/** Build a two-picture listening round from a real local minimal pair. */
export function minimalPairRound(contrast?: SoundContrast): MinimalPairRound {
  const pickedContrast = contrast ?? pickOne(availableSoundContrasts());
  const pairs = REMEDIATION_BY_KEY.get(pickedContrast.key);
  if (!pairs?.length) throw new Error(`Geen klankpaar beschikbaar voor ${pickedContrast.key}`);

  const pair = pickOne(pairs);
  const targetWord = Math.random() < 0.5 ? pair.a : pair.b;
  return {
    pair,
    contrast: pickedContrast,
    targetWord,
    prompt: "Welk woord hoor je? Tik op het plaatje.",
    hintText: "Luister goed naar het stukje dat anders klinkt.",
    options: shuffle([
      { word: pair.a, isCorrect: pair.a.word === targetWord.word },
      { word: pair.b, isCorrect: pair.b.word === targetWord.word }
    ]),
    targetKey: `pair-${pickedContrast.key}`,
    skill: "soundDiscriminate"
  };
}

function responseSound(attempt: AttemptLog): [string, string] | undefined {
  if (attempt.wasCorrect || attempt.domain !== "literacy-phonemic" || !attempt.targetKey || !attempt.responseKey) return undefined;

  if (attempt.targetKey.startsWith("begin-") || attempt.targetKey.startsWith("end-")) {
    const position = attempt.targetKey.startsWith("begin-") ? "begin" : "end";
    const expected = attempt.targetKey.slice(position.length + 1);
    const response = PHONICS_WORDS.find((word) => word.word === attempt.responseKey);
    if (!response) return undefined;
    const heard = response[position];
    return expected === heard ? undefined : [expected, heard];
  }

  if (attempt.targetKey.startsWith("pair-")) {
    const key = attempt.targetKey.slice("pair-".length);
    const units = key.split("-");
    return units.length === 2 ? [units[0], units[1]] : undefined;
  }

  return undefined;
}

/**
 * Detect a repeated, teachable sound confusion from recent real attempts.
 * One stray tap is not enough: remediation starts after two matching errors.
 */
export function recommendedMinimalPairRemediation(
  attempts: AttemptLog[],
  minimumErrors = 2,
  window = 80
): RecommendedRemediation | undefined {
  const counts = new Map<string, { errors: number; latestAt: number }>();
  for (const attempt of attempts.slice(-Math.max(1, window))) {
    if (attempt.wasCorrect && attempt.domain === "literacy-phonemic" && attempt.targetKey?.startsWith("pair-")) {
      const key = attempt.targetKey.slice("pair-".length);
      if (REMEDIATION_BY_KEY.has(key)) {
        const current = counts.get(key) ?? { errors: 0, latestAt: 0 };
        current.errors = Math.max(0, current.errors - 1);
        current.latestAt = Math.max(current.latestAt, attempt.timestamp);
        counts.set(key, current);
      }
      continue;
    }
    const sounds = responseSound(attempt);
    if (!sounds) continue;
    const key = contrastKey(sounds[0], sounds[1]);
    if (!REMEDIATION_BY_KEY.has(key)) continue;
    const current = counts.get(key) ?? { errors: 0, latestAt: 0 };
    current.errors += 1;
    current.latestAt = Math.max(current.latestAt, attempt.timestamp);
    counts.set(key, current);
  }

  const best = [...counts.entries()]
    .filter(([, score]) => score.errors >= Math.max(1, minimumErrors))
    .sort(([leftKey, left], [rightKey, right]) => right.errors - left.errors || right.latestAt - left.latestAt || leftKey.localeCompare(rightKey))[0];
  if (!best) return undefined;
  const [key, score] = best;
  const [a, b] = key.split("-");
  return { contrast: soundContrast(a, b), ...score };
}

let minimalPairCounter = 0;

export function minimalPairChallenge(round: MinimalPairRound): Challenge {
  minimalPairCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((option, index) => ({
    id: `minimal-pair-${minimalPairCounter}-${index}`,
    label: option.word.emoji,
    value: option.word.word,
    representation: rep,
    svg: "",
    isCorrect: option.isCorrect
  }));
  return {
    id: `minimal-pair-${minimalPairCounter}`,
    levelId: "klankgrot",
    challengeType: "phonics-minimal-pair",
    title: "Klankgrot",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.targetWord.word,
    displayTimeMs: 4000,
    options,
    mechanic: `minimal-pair|${round.contrast.key}|${round.pair.id}`,
    successEffect: "Klankpaar gevonden!",
    safeErrorEffect: round.hintText,
    hint: round.hintText
  };
}
