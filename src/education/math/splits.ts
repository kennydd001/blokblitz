// Part-whole "splits" — the rekenbordje met 3 vakjes. Pure data + pure functions
// (no DOM, no Three.js), so the whole split curriculum is unit-testable. Phase A
// covers every split 0..n for n = 1..10, including the zero-splits (0+n, n+0) and
// reversal pairs (2+3 vs 3+2), which the Splitbord Builder mode teaches.

export type SplitMode = "pick-parts" | "pick-missing" | "pick-total";

export interface SplitPair {
  /** the whole, n */
  total: number;
  left: number;
  right: number;
  /** left === 0 || right === 0 */
  isZeroSplit: boolean;
  /** id of the swapped pair, e.g. split-5-2-3 <-> split-5-3-2 */
  reverseOf: string;
  /** `split-${total}-${left}-${right}` */
  id: string;
}

export const MAX_SPLIT_N = 10;

// Misconception keys, exactly as named in the curriculum proposal.
export const SPLIT_MISCONCEPTIONS = [
  "missing-zero-split",
  "reversed-pair-unclear",
  "missing-part-weak",
  "counts-total-as-part",
  "off-by-one-part"
] as const;
export type SplitMisconception = (typeof SPLIT_MISCONCEPTIONS)[number];

function makePair(total: number, left: number): SplitPair {
  const right = total - left;
  return {
    total,
    left,
    right,
    isZeroSplit: left === 0 || right === 0,
    reverseOf: `split-${total}-${right}-${left}`,
    id: `split-${total}-${left}-${right}`
  };
}

/** Every split of `total`, left = 0..total (so 0+n and n+0 are included). */
export function allSplitsFor(total: number): SplitPair[] {
  const out: SplitPair[] = [];
  for (let left = 0; left <= total; left += 1) out.push(makePair(total, left));
  return out;
}

/** Every split for n = 1..MAX_SPLIT_N, flattened (65 pairs for n=1..10). */
export function allSplits(): SplitPair[] {
  const out: SplitPair[] = [];
  for (let n = 1; n <= MAX_SPLIT_N; n += 1) out.push(...allSplitsFor(n));
  return out;
}

export function splitById(id: string): SplitPair | undefined {
  return allSplits().find((pair) => pair.id === id);
}

/** Distinct unordered reversal pairs {a+b, b+a} where a !== b. */
export function reversalPairs(total: number): Array<[SplitPair, SplitPair]> {
  const out: Array<[SplitPair, SplitPair]> = [];
  for (let left = 1; left < total - left; left += 1) {
    out.push([makePair(total, left), makePair(total, total - left)]);
  }
  return out;
}

export function isValidSplit(total: number, left: number, right: number): boolean {
  return left >= 0 && right >= 0 && left + right === total;
}

/** Classify a wrong Splitbord answer into a teaching-relevant misconception. */
export function classifySplitError(args: {
  mode: SplitMode;
  total: number;
  correctLeft: number;
  correctRight: number;
  knownPart?: number;
  playerLeft?: number;
  playerRight?: number;
  playerValue?: number;
}): SplitMisconception | undefined {
  const { mode, total, correctLeft, correctRight, knownPart, playerLeft, playerRight, playerValue } = args;

  if (mode === "pick-missing") {
    const missing = knownPart === undefined ? correctRight : total - knownPart;
    if (playerValue === undefined) return "missing-part-weak";
    if (playerValue === missing) return undefined; // correct
    // Picked the part that was already shown.
    if (knownPart !== undefined && playerValue === knownPart && knownPart !== missing) return "counts-total-as-part";
    if (Math.abs(playerValue - missing) === 1) return "off-by-one-part";
    if ((playerValue === 0) !== (missing === 0)) return "missing-zero-split";
    return "missing-part-weak";
  }

  if (mode === "pick-total") {
    if (playerValue === undefined) return "missing-part-weak";
    if (playerValue === total) return undefined; // correct
    if (Math.abs(playerValue - total) === 1) return "off-by-one-part";
    if ((playerValue === 0) !== (total === 0)) return "missing-zero-split";
    return "missing-part-weak";
  }

  // pick-parts: a pair was chosen; flag swapped/incorrect pairs.
  if (playerLeft !== undefined && playerRight !== undefined) {
    if (isValidSplit(total, playerLeft, playerRight)) return undefined; // any valid split is accepted
    if (playerLeft === correctRight && playerRight === correctLeft) return "reversed-pair-unclear";
  }
  return "reversed-pair-unclear";
}
