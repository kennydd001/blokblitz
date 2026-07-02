import { LETTERS } from "./letters";
import { PHONICS_WORDS } from "./phonics";

export type ReadingPhonemeKind = "continuous" | "stop" | "short-vowel" | "long-vowel" | "digraph";

export interface ReadingPhoneme {
  key: string;
  display: string;
  kind: ReadingPhonemeKind;
  stretchable: boolean;
  spokenText: string;
  durationMs: number;
}

export interface ReadingWordClip {
  word: string;
  units: string[];
  spokenText: string;
  durationMs: number;
}

export const READING_PHONEMES: ReadingPhoneme[] = [
  { key: "m", display: "m", kind: "continuous", stretchable: true, spokenText: "mmm", durationMs: 520 },
  { key: "s", display: "s", kind: "continuous", stretchable: true, spokenText: "sss", durationMs: 520 },
  { key: "v", display: "v", kind: "continuous", stretchable: true, spokenText: "vvv", durationMs: 500 },
  { key: "r", display: "r", kind: "continuous", stretchable: true, spokenText: "rrr", durationMs: 480 },
  { key: "n", display: "n", kind: "continuous", stretchable: true, spokenText: "nnn", durationMs: 500 },
  { key: "z", display: "z", kind: "continuous", stretchable: true, spokenText: "zzz", durationMs: 500 },
  { key: "h", display: "h", kind: "continuous", stretchable: true, spokenText: "hhh", durationMs: 420 },
  { key: "l", display: "l", kind: "continuous", stretchable: true, spokenText: "lll", durationMs: 480 },
  { key: "f", display: "f", kind: "continuous", stretchable: true, spokenText: "fff", durationMs: 500 },
  { key: "w", display: "w", kind: "continuous", stretchable: true, spokenText: "www", durationMs: 470 },
  { key: "b", display: "b", kind: "stop", stretchable: false, spokenText: "buh", durationMs: 230 },
  { key: "d", display: "d", kind: "stop", stretchable: false, spokenText: "duh", durationMs: 230 },
  { key: "k", display: "k", kind: "stop", stretchable: false, spokenText: "kuh", durationMs: 230 },
  { key: "p", display: "p", kind: "stop", stretchable: false, spokenText: "puh", durationMs: 230 },
  { key: "t", display: "t", kind: "stop", stretchable: false, spokenText: "tuh", durationMs: 230 },
  { key: "a", display: "a", kind: "short-vowel", stretchable: true, spokenText: "aaa", durationMs: 500 },
  { key: "e", display: "e", kind: "short-vowel", stretchable: true, spokenText: "eh", durationMs: 420 },
  { key: "i", display: "i", kind: "short-vowel", stretchable: true, spokenText: "ih", durationMs: 420 },
  { key: "o", display: "o", kind: "short-vowel", stretchable: true, spokenText: "oh", durationMs: 450 },
  { key: "u", display: "u", kind: "short-vowel", stretchable: true, spokenText: "uh", durationMs: 420 },
  { key: "aa", display: "aa", kind: "long-vowel", stretchable: true, spokenText: "aa", durationMs: 560 },
  { key: "ee", display: "ee", kind: "long-vowel", stretchable: true, spokenText: "ee", durationMs: 540 },
  { key: "oo", display: "oo", kind: "long-vowel", stretchable: true, spokenText: "oo", durationMs: 560 },
  { key: "uu", display: "uu", kind: "long-vowel", stretchable: true, spokenText: "uu", durationMs: 540 },
  { key: "oe", display: "oe", kind: "digraph", stretchable: true, spokenText: "oe", durationMs: 540 },
  { key: "ie", display: "ie", kind: "digraph", stretchable: true, spokenText: "ie", durationMs: 540 },
  { key: "eu", display: "eu", kind: "digraph", stretchable: true, spokenText: "eu", durationMs: 540 },
  { key: "ui", display: "ui", kind: "digraph", stretchable: true, spokenText: "ui", durationMs: 560 },
  { key: "ei", display: "ei", kind: "digraph", stretchable: true, spokenText: "ei", durationMs: 540 },
  { key: "ij", display: "ij", kind: "digraph", stretchable: true, spokenText: "ij", durationMs: 540 },
  { key: "ou", display: "ou", kind: "digraph", stretchable: true, spokenText: "ou", durationMs: 540 },
  { key: "au", display: "au", kind: "digraph", stretchable: true, spokenText: "au", durationMs: 540 }
];

export const READING_PHONEME_KEYS = READING_PHONEMES.map((phoneme) => phoneme.key);

export const READING_WORD_CLIPS: ReadingWordClip[] = PHONICS_WORDS.map((word) => ({
  word: word.word,
  units: word.units,
  spokenText: word.word,
  durationMs: Math.max(520, word.units.length * 210)
}));

export function phonemeForKey(key: string): ReadingPhoneme | undefined {
  return READING_PHONEMES.find((phoneme) => phoneme.key === key);
}

export function phonemeFallbackText(key: string): string {
  return phonemeForKey(key)?.spokenText ?? key;
}

export function blendFallbackText(units: string[], word?: string): string {
  const sounds = units.map((unit) => phonemeFallbackText(unit)).join("... ");
  return word ? `${sounds}... ${word}` : sounds;
}

export function readingInventoryIssues(): string[] {
  const phonemeKeys = new Set(READING_PHONEME_KEYS);
  const issues: string[] = [];
  for (const letter of LETTERS) {
    if (!phonemeKeys.has(letter)) issues.push(`missing-letter:${letter}`);
  }
  for (const word of PHONICS_WORDS) {
    for (const unit of word.units) {
      if (!phonemeKeys.has(unit)) issues.push(`missing-unit:${word.word}:${unit}`);
    }
  }
  return issues;
}
