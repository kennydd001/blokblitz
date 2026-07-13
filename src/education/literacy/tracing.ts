import type { DifficultyTier } from "../difficulty";
import type { AttemptLog, Challenge, ChallengeOption, Representation } from "../types";
import { LETTERS, STARTER_LETTERS } from "./letters";

export interface TracePoint {
  x: number;
  y: number;
}

export interface TraceGuide {
  grapheme: string;
  width: number;
  height: number;
  strokes: TracePoint[][];
}

export interface TraceEvaluation {
  coverage: number;
  precision: number;
  direction: number;
  score: number;
  complete: boolean;
  excellent: boolean;
  missedPoint?: TracePoint;
}

export interface TraceSettings {
  corridor: number;
  guideLevel: "full" | "dotted" | "faint";
}

const GUIDE_WIDTH = 220;
const GUIDE_HEIGHT = 180;
const SINGLE_OFFSET = 60;
const DOUBLE_OFFSETS = [8, 112];

const point = (x: number, y: number): TracePoint => ({ x, y });

// Simple school-print lowercase paths. Curves use short polyline segments so
// scoring and rendering share exactly the same child-visible geometry.
const GLYPHS: Record<string, TracePoint[][]> = {
  i: [[point(48, 58), point(48, 142)], [point(48, 30)]],
  k: [
    [point(28, 25), point(28, 142)],
    [point(28, 92), point(78, 58)],
    [point(28, 92), point(82, 142)]
  ],
  m: [
    [point(18, 60), point(18, 142)],
    [point(18, 82), point(28, 67), point(42, 60), point(55, 66), point(58, 82), point(58, 142)],
    [point(58, 82), point(68, 67), point(82, 60), point(94, 68), point(96, 84), point(96, 142)]
  ],
  s: [[point(83, 69), point(69, 59), point(48, 58), point(29, 66), point(23, 81), point(32, 94), point(54, 99), point(76, 104), point(84, 118), point(76, 134), point(56, 142), point(35, 138), point(21, 127)]],
  p: [
    [point(24, 60), point(24, 164)],
    [point(24, 68), point(43, 59), point(66, 62), point(81, 78), point(82, 99), point(70, 117), point(48, 122), point(24, 111)]
  ],
  a: [
    [point(78, 77), point(66, 62), point(46, 59), point(28, 70), point(20, 92), point(23, 119), point(38, 138), point(59, 142), point(78, 129), point(78, 77)],
    [point(78, 61), point(78, 142)]
  ],
  r: [
    [point(24, 60), point(24, 142)],
    [point(24, 82), point(36, 66), point(52, 60), point(69, 66)]
  ],
  e: [[point(22, 96), point(80, 96), point(78, 78), point(66, 64), point(47, 59), point(30, 67), point(21, 84), point(20, 108), point(30, 130), point(50, 141), point(72, 138), point(84, 127)]],
  v: [[point(16, 64), point(49, 142), point(90, 64)]],
  n: [
    [point(22, 60), point(22, 142)],
    [point(22, 83), point(34, 67), point(50, 60), point(68, 64), point(78, 80), point(80, 142)]
  ],
  t: [[point(52, 29), point(52, 142)], [point(24, 68), point(80, 68)]],
  b: [
    [point(22, 25), point(22, 142)],
    [point(22, 73), point(39, 61), point(59, 60), point(76, 72), point(84, 93), point(79, 117), point(62, 136), point(40, 142), point(22, 132)]
  ],
  o: [[point(52, 59), point(33, 63), point(21, 80), point(18, 103), point(25, 127), point(43, 141), point(64, 140), point(80, 124), point(86, 101), point(82, 78), point(69, 63), point(52, 59)]],
  d: [
    [point(72, 73), point(59, 61), point(40, 60), point(24, 74), point(18, 96), point(22, 121), point(39, 138), point(60, 141), point(76, 127), point(76, 78)],
    [point(76, 25), point(76, 142)]
  ],
  z: [[point(18, 63), point(84, 63), point(20, 140), point(87, 140)]],
  j: [[point(62, 58), point(62, 139), point(56, 153), point(43, 160), point(29, 155), point(23, 145)], [point(62, 30)]],
  h: [
    [point(22, 25), point(22, 142)],
    [point(22, 84), point(35, 67), point(52, 60), point(69, 66), point(79, 82), point(80, 142)]
  ],
  w: [[point(12, 65), point(31, 142), point(52, 83), point(72, 142), point(94, 65)]],
  u: [[point(20, 64), point(20, 111), point(27, 131), point(43, 141), point(60, 139), point(75, 125), point(80, 106), point(80, 64), point(80, 142)]],
  l: [[point(50, 25), point(50, 128), point(55, 140), point(67, 143)]],
  f: [[point(74, 34), point(61, 25), point(47, 30), point(40, 45), point(40, 142)], [point(18, 70), point(75, 70)]]
};

export const WRITABLE_GRAPHEMES = LETTERS.filter((grapheme) => [...grapheme].every((letter) => Boolean(GLYPHS[letter])));

function shiftedStroke(stroke: TracePoint[], offsetX: number): TracePoint[] {
  return stroke.map(({ x, y }) => point(x + offsetX, y));
}

/** Compose one or two lowercase glyphs into the same stable writing board. */
export function traceGuide(grapheme: string): TraceGuide {
  const letters = [...grapheme.toLowerCase()];
  const offsets = letters.length === 1 ? [SINGLE_OFFSET] : DOUBLE_OFFSETS;
  const strokes = letters.flatMap((letter, index) => {
    const glyph = GLYPHS[letter] ?? GLYPHS.i;
    return glyph.map((stroke) => shiftedStroke(stroke, offsets[index] ?? DOUBLE_OFFSETS[1]));
  });
  return { grapheme, width: GUIDE_WIDTH, height: GUIDE_HEIGHT, strokes };
}

export function traceSettings(tier: DifficultyTier): TraceSettings {
  if (tier === 1) return { corridor: 21, guideLevel: "full" };
  if (tier === 2) return { corridor: 18, guideLevel: "dotted" };
  return { corridor: 16, guideLevel: "faint" };
}

function distance(a: TracePoint, b: TracePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function sampleStroke(stroke: TracePoint[], step = 4): TracePoint[] {
  if (stroke.length <= 1) return stroke.map(({ x, y }) => point(x, y));
  const samples: TracePoint[] = [];
  for (let index = 1; index < stroke.length; index += 1) {
    const from = stroke[index - 1];
    const to = stroke[index];
    const parts = Math.max(1, Math.ceil(distance(from, to) / step));
    for (let part = index === 1 ? 0 : 1; part <= parts; part += 1) {
      const ratio = part / parts;
      samples.push(point(from.x + (to.x - from.x) * ratio, from.y + (to.y - from.y) * ratio));
    }
  }
  return samples;
}

function nearestDistance(target: TracePoint, candidates: TracePoint[]): number {
  let closest = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) closest = Math.min(closest, distance(target, candidate));
  return closest;
}

function directionScore(guide: TraceGuide, userStrokes: TracePoint[][], corridor: number): number {
  if (guide.strokes.length === 0) return 0;
  let matched = 0;
  let correct = 0;
  for (const guideStroke of guide.strokes) {
    const start = guideStroke[0];
    const end = guideStroke[guideStroke.length - 1];
    let best: TracePoint[] | undefined;
    let bestEndpoint = Number.POSITIVE_INFINITY;
    for (const userStroke of userStrokes) {
      if (userStroke.length === 0) continue;
      const first = userStroke[0];
      const last = userStroke[userStroke.length - 1];
      const endpoint = Math.min(distance(first, start), distance(first, end), distance(last, start), distance(last, end));
      if (endpoint < bestEndpoint) {
        bestEndpoint = endpoint;
        best = userStroke;
      }
    }
    if (!best || bestEndpoint > corridor * 1.8) continue;
    matched += 1;
    if (guideStroke.length === 1 || distance(best[0], start) <= distance(best[0], end)) correct += 1;
  }
  return matched === 0 ? 0 : correct / guide.strokes.length;
}

/**
 * Lenient little-finger scoring. Coverage carries most weight: a wobbly child
 * who follows the complete form succeeds, while a short neat dash does not.
 */
export function evaluateTrace(guide: TraceGuide, userStrokes: TracePoint[][], corridor = 18): TraceEvaluation {
  const guideSamples = guide.strokes.flatMap((stroke) => sampleStroke(stroke));
  const userSamples = userStrokes.flatMap((stroke) => sampleStroke(stroke, 3));
  if (guideSamples.length === 0 || userSamples.length === 0) {
    return { coverage: 0, precision: 0, direction: 0, score: 0, complete: false, excellent: false, missedPoint: guideSamples[0] };
  }

  const guideDistances = guideSamples.map((sample) => nearestDistance(sample, userSamples));
  const coverage = guideDistances.filter((value) => value <= corridor).length / guideSamples.length;
  const precision = userSamples.filter((sample) => nearestDistance(sample, guideSamples) <= corridor * 1.45).length / userSamples.length;
  const direction = directionScore(guide, userStrokes, corridor);
  const score = coverage * 0.65 + precision * 0.25 + direction * 0.1;
  const complete = coverage >= 0.64 && precision >= 0.4;
  const excellent = coverage >= 0.84 && precision >= 0.64 && direction >= 0.55;
  const missedIndex = guideDistances.reduce((worst, value, index, values) => (value > values[worst] ? index : worst), 0);

  return {
    coverage,
    precision,
    direction,
    score,
    complete,
    excellent,
    missedPoint: complete ? undefined : guideSamples[missedIndex]
  };
}

function attemptedGrapheme(attempt: AttemptLog): string | undefined {
  if (attempt.domain !== "literacy-writing" || !attempt.targetKey?.startsWith("write-")) return undefined;
  const grapheme = attempt.targetKey.slice("write-".length).toLowerCase();
  return WRITABLE_GRAPHEMES.includes(grapheme) ? grapheme : undefined;
}

/** Choose the least-evidenced unlocked writing target, unless remediation has one. */
export function writingPracticeTarget(attempts: AttemptLog[], available: readonly string[], adaptiveTarget?: string): string {
  const pool = available.filter((grapheme) => WRITABLE_GRAPHEMES.includes(grapheme));
  const safePool = pool.length > 0 ? pool : STARTER_LETTERS;
  const focused = adaptiveTarget?.startsWith("write-") ? adaptiveTarget.slice("write-".length).toLowerCase() : undefined;
  if (focused && safePool.includes(focused)) return focused;

  const stats = new Map<string, { clean: number; exposures: number; lastSeen: number }>();
  for (const grapheme of safePool) stats.set(grapheme, { clean: 0, exposures: 0, lastSeen: 0 });
  for (const attempt of attempts) {
    const grapheme = attemptedGrapheme(attempt);
    const current = grapheme ? stats.get(grapheme) : undefined;
    if (!current) continue;
    current.exposures += 1;
    current.lastSeen = Math.max(current.lastSeen, attempt.timestamp);
    if (attempt.wasCorrect && !attempt.hintUsed) current.clean += 1;
  }
  return [...safePool].sort((a, b) => {
    const aa = stats.get(a)!;
    const bb = stats.get(b)!;
    return aa.clean - bb.clean || aa.exposures - bb.exposures || aa.lastSeen - bb.lastSeen || LETTERS.indexOf(a) - LETTERS.indexOf(b);
  })[0] ?? STARTER_LETTERS[0];
}

let traceCounter = 0;

/** Minimal challenge shell so Schrijfspoor shares the calm-mode reward loop. */
export function traceChallenge(grapheme: string): Challenge {
  traceCounter += 1;
  const representation: Representation = "numeral";
  const option: ChallengeOption = {
    id: `trace-${traceCounter}`,
    label: grapheme,
    value: grapheme,
    representation,
    svg: "",
    isCorrect: false
  };
  return {
    id: `schrijfspoor-${traceCounter}`,
    levelId: "schrijfspoor",
    challengeType: "letter-trace",
    title: "Schrijfspoor",
    prompt: "Volg het lichtspoor met je vinger.",
    scene: "minigame",
    // Compatibility field for the number-first Challenge shell; the scene logs
    // the real `letterForm` skill through buildCurriculumAttempt.
    skill: "subitize",
    representation,
    promptRepresentation: representation,
    answerRepresentation: representation,
    quantity: 0,
    correctAnswer: grapheme,
    displayTimeMs: 0,
    options: [option],
    mechanic: `trace|${grapheme}`,
    successEffect: "Mooi geschreven!",
    safeErrorEffect: "Het lichtspoor blijft staan.",
    hint: "Begin bij de groene stip en volg het spoor naar de ster."
  };
}
