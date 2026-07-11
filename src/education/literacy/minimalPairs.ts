// Minimal pairs make a heard or read sound contrast concrete: a child can
// compare two real picture words that change in one place. The pairs below
// are derived only from the local decodable phonics pool, so every picture
// and sound unit is already part of the reading curriculum.

import { PHONICS_WORDS, type PhonicsWord } from "./phonics";

export interface MinimalPair {
  a: PhonicsWord;
  b: PhonicsWord;
  position: number;
  unitA: string;
  unitB: string;
  kind: "begin" | "end" | "medial";
  id: string;
}

// Keep a few familiar Flemish confusions even when this small local pool has
// no matching word pair yet; availableRemediations filters those out.
export const CONFUSABLE_SOUNDS: Array<[string, string]> = [
  ["b", "d"],
  ["b", "p"],
  ["f", "v"],
  ["m", "n"],
  ["a", "e"],
  ["i", "e"],
  ["i", "o"],
  ["o", "oe"],
  ["aa", "oo"],
  ["v", "m"]
];

function wordOrder(a: PhonicsWord, b: PhonicsWord): [PhonicsWord, PhonicsWord] {
  return a.word.localeCompare(b.word) <= 0 ? [a, b] : [b, a];
}

function contrastKind(position: number, unitsLength: number): MinimalPair["kind"] {
  if (position === 0) return "begin";
  if (position === unitsLength - 1) return "end";
  return "medial";
}

function makeMinimalPair(first: PhonicsWord, second: PhonicsWord, position: number): MinimalPair {
  const [a, b] = wordOrder(first, second);
  return {
    a,
    b,
    position,
    unitA: a.units[position],
    unitB: b.units[position],
    kind: contrastKind(position, a.units.length),
    id: `${a.word}-${b.word}`
  };
}

function differsAtExactlyOnePosition(a: PhonicsWord, b: PhonicsWord): number | undefined {
  if (a.word === b.word || a.units.length !== b.units.length) return undefined;

  let differingPosition: number | undefined;
  for (let position = 0; position < a.units.length; position += 1) {
    if (a.units[position] === b.units[position]) continue;
    if (differingPosition !== undefined) return undefined;
    differingPosition = position;
  }
  return differingPosition;
}

/** All unordered one-unit substitutions in the imported phonics pool. */
export function allMinimalPairs(): MinimalPair[] {
  const pairs = new Map<string, MinimalPair>();

  for (let firstIndex = 0; firstIndex < PHONICS_WORDS.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < PHONICS_WORDS.length; secondIndex += 1) {
      const first = PHONICS_WORDS[firstIndex];
      const second = PHONICS_WORDS[secondIndex];
      const position = differsAtExactlyOnePosition(first, second);
      if (position === undefined) continue;

      const pair = makeMinimalPair(first, second, position);
      pairs.set(pair.id, pair);
    }
  }

  return [...pairs.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function hasContrast(pair: MinimalPair, x: string, y: string): boolean {
  return (pair.unitA === x && pair.unitB === y) || (pair.unitA === y && pair.unitB === x);
}

/** Find all pool pairs with the requested contrast, regardless of argument order. */
export function minimalPairsForContrast(x: string, y: string): MinimalPair[] {
  return allMinimalPairs().filter((pair) => hasContrast(pair, x, y));
}

const KIND_ORDER: Record<MinimalPair["kind"], number> = { begin: 0, end: 1, medial: 2 };

/** Pick the most hearable pairs first, with a stable id tie-break. */
export function remediationDrill(x: string, y: string, count = 3): MinimalPair[] {
  const limit = Math.max(0, Math.floor(count));
  if (limit === 0) return [];

  return minimalPairsForContrast(x, y)
    .sort((left, right) => KIND_ORDER[left.kind] - KIND_ORDER[right.kind] || left.id.localeCompare(right.id))
    .slice(0, limit);
}

/** Return only configured confusions that have real pairs in the local pool. */
export function availableRemediations(): Array<{ contrast: [string, string]; pairs: MinimalPair[] }> {
  return CONFUSABLE_SOUNDS.flatMap((contrast) => {
    const pairs = remediationDrill(contrast[0], contrast[1]);
    return pairs.length > 0 ? [{ contrast, pairs }] : [];
  });
}
