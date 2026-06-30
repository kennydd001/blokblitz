// Geometry content for the Vormenburcht mode: recognise shapes, count corners,
// continue a pattern. Shapes are drawn as local SVG (no assets). Pure data.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type ShapeMode = "find-shape" | "count-corners" | "continue-pattern";

export interface ShapeDef {
  id: string;
  name: string; // Dutch
  corners: number;
  color: number;
}

export const SHAPES: ShapeDef[] = [
  { id: "circle", name: "cirkel", corners: 0, color: 0xff5a5a },
  { id: "triangle", name: "driehoek", corners: 3, color: 0x34c759 },
  { id: "square", name: "vierkant", corners: 4, color: 0x0a84ff },
  { id: "rectangle", name: "rechthoek", corners: 4, color: 0x7c5cff },
  { id: "pentagon", name: "vijfhoek", corners: 5, color: 0xff8c1a },
  { id: "hexagon", name: "zeshoek", corners: 6, color: 0x00bcd4 }
];

function hex(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}

function polygonPoints(n: number, cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** A local SVG for a shape. */
export function shapeSvg(id: string, size = 80): string {
  const shape = SHAPES.find((s) => s.id === id) ?? SHAPES[0];
  const fill = hex(shape.color);
  const ink = `stroke="#10131c" stroke-width="4" stroke-linejoin="round"`;
  let body = "";
  if (id === "circle") body = `<circle cx="40" cy="40" r="32" fill="${fill}" ${ink}/>`;
  else if (id === "square") body = `<rect x="10" y="10" width="60" height="60" rx="6" fill="${fill}" ${ink}/>`;
  else if (id === "rectangle") body = `<rect x="6" y="22" width="68" height="36" rx="6" fill="${fill}" ${ink}/>`;
  else body = `<polygon points="${polygonPoints(shape.corners, 40, 42, 33)}" fill="${fill}" ${ink}/>`;
  return `<svg class="shape-svg" width="${size}" height="${size}" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}

export const SHAPE_MISCONCEPTIONS = ["shape-confusion", "corner-miscount", "pattern-weak"] as const;
export type ShapeMisconception = (typeof SHAPE_MISCONCEPTIONS)[number];

export interface ShapeRound {
  mode: ShapeMode;
  prompt: string;
  /** SVG shown above the choices (the shape to count, or the pattern row). */
  promptHtml?: string;
  options: Array<{ label: string; value: string; isCorrect: boolean }>;
  targetKey: string;
  skill: "shapeRecognize" | "patternContinue";
}

const MODES: ShapeMode[] = ["find-shape", "count-corners", "continue-pattern"];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function shapeRound(mode: ShapeMode = pickOne(MODES)): ShapeRound {
  if (mode === "count-corners") {
    const shape = pickOne(SHAPES.filter((s) => s.corners > 0));
    const pool = [shape.corners - 1, shape.corners + 1, shape.corners + 2, 0].filter((n) => n >= 0 && n <= 8 && n !== shape.corners);
    const distractors = shuffle([...new Set(pool)]).slice(0, 2);
    return {
      mode,
      prompt: "Hoeveel hoeken heeft deze vorm?",
      promptHtml: `<div class="vormen-stage">${shapeSvg(shape.id, 120)}</div>`,
      options: shuffle([{ label: String(shape.corners), value: String(shape.corners), isCorrect: true }, ...distractors.map((n) => ({ label: String(n), value: String(n), isCorrect: false }))]),
      targetKey: `corners-${shape.id}`,
      skill: "shapeRecognize"
    };
  }
  if (mode === "continue-pattern") {
    const [a, b] = shuffle(SHAPES).slice(0, 2);
    const seq = [a, b, a, b];
    const next = a;
    const others = shuffle(SHAPES.filter((s) => s.id !== next.id)).slice(0, 2);
    return {
      mode,
      prompt: "Wat komt er nu? Maak het patroon af.",
      promptHtml: `<div class="vormen-pattern">${seq.map((s) => shapeSvg(s.id, 52)).join("")}<span class="vormen-next">?</span></div>`,
      options: shuffle([{ label: next.name, value: next.id, isCorrect: true }, ...others.map((s) => ({ label: s.name, value: s.id, isCorrect: false }))]),
      targetKey: `pattern-${a.id}-${b.id}`,
      skill: "patternContinue"
    };
  }
  // find-shape
  const target = pickOne(SHAPES);
  const others = shuffle(SHAPES.filter((s) => s.id !== target.id)).slice(0, 2);
  return {
    mode,
    prompt: `Tik de ${target.name}.`,
    options: shuffle([{ label: target.name, value: target.id, isCorrect: true }, ...others.map((s) => ({ label: s.name, value: s.id, isCorrect: false }))]),
    targetKey: `shape-${target.id}`,
    skill: "shapeRecognize"
  };
}

export function classifyShapeError(mode: ShapeMode): ShapeMisconception {
  if (mode === "count-corners") return "corner-miscount";
  if (mode === "continue-pattern") return "pattern-weak";
  return "shape-confusion";
}

let shapeCounter = 0;

export function shapeChallenge(round: ShapeRound): Challenge {
  shapeCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `shape-${shapeCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `vormenburcht-${shapeCounter}`,
    levelId: "vormenburcht",
    challengeType: `shape-${round.mode}`,
    title: "Vormenburcht",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: options.find((o) => o.isCorrect)?.value ?? "",
    displayTimeMs: 4000,
    options,
    mechanic: `shape|${round.mode}`,
    successEffect: "Goed gezien!",
    safeErrorEffect: "Kijk goed naar de vorm.",
    hint: "Tel de hoeken of kijk naar de vorm."
  };
}
