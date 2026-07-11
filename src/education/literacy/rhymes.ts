import type { Challenge, ChallengeOption, Representation } from "../types";
import { PHONICS_WORDS, type PhonicsWord } from "./phonics";

const VOWELS = new Set(["a", "e", "i", "o", "u", "aa", "ee", "oo", "uu", "oe", "eu", "ui", "ie", "ei", "ij", "au", "ou"]);

export interface RhymeGroup {
  key: string;
  words: PhonicsWord[];
}

export interface RhymeRound {
  targetWord: PhonicsWord;
  rhymeWord: PhonicsWord;
  prompt: string;
  hintText: string;
  options: Array<{ word: PhonicsWord; isCorrect: boolean }>;
  targetKey: string;
  skill: "rhyme";
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/** The Dutch rime: the final vowel nucleus plus everything after it. */
export function rhymeKey(word: PhonicsWord): string {
  for (let index = word.units.length - 1; index >= 0; index -= 1) {
    if (VOWELS.has(word.units[index])) return word.units.slice(index).join("-");
  }
  return word.units.join("-");
}

export function rhymeGroups(): RhymeGroup[] {
  const grouped = new Map<string, PhonicsWord[]>();
  for (const word of PHONICS_WORDS) {
    const key = rhymeKey(word);
    grouped.set(key, [...(grouped.get(key) ?? []), word]);
  }
  return [...grouped.entries()]
    .filter(([, words]) => words.length >= 2)
    .map(([key, words]) => ({ key, words: [...words].sort((a, b) => a.word.localeCompare(b.word)) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function rhymeRound(): RhymeRound {
  const groups = rhymeGroups();
  const group = pickOne(groups);
  const targetWord = pickOne(group.words);
  const rhymeWord = pickOne(group.words.filter((word) => word.word !== targetWord.word));
  const distractors = shuffle(PHONICS_WORDS.filter((word) => rhymeKey(word) !== group.key)).slice(0, 2);
  return {
    targetWord,
    rhymeWord,
    prompt: `Wat rijmt op ${targetWord.word}?`,
    hintText: "Luister goed naar het einde van de woorden.",
    options: shuffle([{ word: rhymeWord, isCorrect: true }, ...distractors.map((word) => ({ word, isCorrect: false }))]),
    targetKey: `rhyme-${group.key}`,
    skill: "rhyme"
  };
}

let rhymeCounter = 0;

export function rhymeChallenge(round: RhymeRound): Challenge {
  rhymeCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((option, index) => ({
    id: `rhyme-${rhymeCounter}-${index}`,
    label: `${option.word.emoji} ${option.word.word}`,
    value: option.word.word,
    representation: rep,
    svg: "",
    isCorrect: option.isCorrect
  }));
  return {
    id: `rhyme-${rhymeCounter}`,
    levelId: "rijmspel",
    challengeType: "rhyme-find",
    title: "Rijmrivier",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.rhymeWord.word,
    displayTimeMs: 4000,
    options,
    mechanic: `rhyme|${round.targetKey}|${round.targetWord.word}`,
    successEffect: "Dat rijmt!",
    safeErrorEffect: round.hintText,
    hint: round.hintText
  };
}
