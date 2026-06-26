// Builds each "getalbeeld" (number image) as a real 3D voxel shape so the child
// learns the quantity across every representation, not just block stacks. Gates
// rotate through these: dice, beads, ten-frames, dominoes, fingers, eggs, paws,
// numerals and more — all rendered from cubes to keep the Minecraft look.

import * as THREE from "three";
import {
  canonicalDotPositions,
  canonicalParts,
  diceParts,
  dominoParts,
  fiveFrameCells,
  tenFrameCells,
  type Point
} from "../education/quantityLayouts";

const CUBE = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map<number, THREE.MeshStandardMaterial>();

function mat(color: number, intensity = 0.24): THREE.MeshStandardMaterial {
  const key = color * 100 + Math.round(intensity * 100);
  let material = materials.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, emissive: color, emissiveIntensity: intensity });
    materials.set(key, material);
  }
  return material;
}

function cube(group: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, color: number, intensity = 0.12): void {
  const mesh = new THREE.Mesh(CUBE, mat(color, intensity));
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

const COL = {
  five: 0xf7c531,
  extra: 0xff7a59,
  frame: 0xffffff,
  pip: 0x1a2336,
  die: 0xfbfbfb,
  bead5: 0xe4564b,
  beadX: 0xf2f2f2,
  rod: 0x8a5a3c,
  egg: 0xfff0d6,
  nest: 0x9b6b4a,
  numeral: 0x37c0f0,
  pawPad: 0x9a6b45,
  pawToe: 0xc1956a,
  finger: 0xffd6ad,
  palm: 0xf0b078
};

// One stable colour per quantity 1..10. The whole point of the gate revamp:
// "which number is which gate" is answered by COLOUR first (every 7 is always
// the same purple-pink), then the giant numeral, then the getalbeeld. The child
// can lock onto "my colour" before they can parse dots at running speed.
const NUMBER_COLORS = [
  0xff3b30, // 1 red
  0xff8c1a, // 2 orange
  0xffd60a, // 3 yellow
  0x34c759, // 4 green
  0x0a84ff, // 5 blue
  0x7c5cff, // 6 purple
  0xff5fb8, // 7 pink
  0x00c8d6, // 8 cyan
  0x9be35a, // 9 lime
  0xf4b942 // 10 gold
];

/** The canonical colour for a quantity (1..10), used by the runner gates + HUD. */
export function numberColor(quantity: number): number {
  const q = Math.max(1, Math.min(10, Math.round(quantity)));
  return NUMBER_COLORS[(q - 1) % NUMBER_COLORS.length];
}

// Map a 2D canonical layout (SVG-ish coords) onto a centred vertical voxel panel.
function mapPoints(points: Point[], scale: number): { x: number; y: number }[] {
  if (points.length === 0) return [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return points.map((p) => ({ x: (p.x - cx) * scale, y: (cy - p.y) * scale }));
}

// 3x3 pip grids for dice/domino faces.
const PIP_GRID: Record<number, [number, number][]> = {
  0: [],
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]]
};

// Blocky 3x5 pixel font for the numeral representation.
const PIXEL_DIGITS: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"]
};

function buildDots(q: number): THREE.Group {
  const group = new THREE.Group();
  const pts = mapPoints(canonicalDotPositions(q), 0.016);
  pts.forEach((p, i) => cube(group, p.x, p.y, 0, 0.26, 0.26, 0.16, i < 5 ? COL.five : COL.extra));
  return group;
}

function buildDie(group: THREE.Group, count: number, offsetX: number): void {
  cube(group, offsetX, 0, -0.05, 0.92, 0.92, 0.16, COL.die, 0.08);
  for (const [gx, gy] of PIP_GRID[Math.max(0, Math.min(6, count))]) {
    cube(group, offsetX + (gx - 1) * 0.27, (1 - gy) * 0.27, 0.06, 0.16, 0.16, 0.12, COL.pip, 0);
  }
}

function buildDice(q: number): THREE.Group {
  const group = new THREE.Group();
  const parts = diceParts(q);
  if (parts.length === 1) buildDie(group, parts[0], 0);
  else {
    buildDie(group, parts[0], -0.6);
    buildDie(group, parts[1], 0.6);
  }
  return group;
}

function buildDomino(q: number): THREE.Group {
  const group = new THREE.Group();
  const [a, b] = dominoParts(q);
  const half = (count: number, offsetX: number): void => {
    cube(group, offsetX, 0, -0.05, 0.86, 0.92, 0.16, COL.die, 0.08);
    for (const [gx, gy] of PIP_GRID[Math.max(0, Math.min(6, count))]) {
      cube(group, offsetX + (gx - 1) * 0.24, (1 - gy) * 0.27, 0.06, 0.15, 0.15, 0.12, COL.pip, 0);
    }
  };
  half(a, -0.5);
  cube(group, 0, 0, 0.02, 0.06, 0.92, 0.18, COL.pip, 0);
  half(b, 0.5);
  return group;
}

function buildFrame(q: number, cells: Point[]): THREE.Group {
  const group = new THREE.Group();
  const pts = mapPoints(cells, 0.018);
  pts.forEach((p, i) => {
    cube(group, p.x, p.y, -0.04, 0.34, 0.34, 0.08, COL.frame, 0.06); // slot
    if (i < q) cube(group, p.x, p.y, 0.05, 0.26, 0.26, 0.14, i < 5 ? COL.five : COL.extra);
  });
  return group;
}

function buildBeads(q: number): THREE.Group {
  const group = new THREE.Group();
  cube(group, 0, 0, -0.05, 2.0, 0.08, 0.08, COL.rod, 0.04);
  const startX = -((q - 1) * 0.2) / 2;
  for (let i = 0; i < q; i += 1) {
    cube(group, startX + i * 0.2, 0, 0, 0.18, 0.26, 0.18, i < 5 ? COL.bead5 : COL.beadX);
  }
  return group;
}

function buildBlocks(q: number): THREE.Group {
  const group = new THREE.Group();
  const parts = canonicalParts(q);
  const place = (count: number, rowY: number, color: number): void => {
    const startX = -((count - 1) * 0.32) / 2;
    for (let i = 0; i < count; i += 1) cube(group, startX + i * 0.32, rowY, 0, 0.28, 0.28, 0.28, color);
  };
  if (parts.length === 1) place(parts[0], 0, COL.five);
  else {
    place(parts[0], -0.18, COL.five);
    place(parts[1], 0.2, COL.extra);
  }
  return group;
}

function buildFingers(q: number): THREE.Group {
  const group = new THREE.Group();
  const hand = (count: number, baseX: number): void => {
    cube(group, baseX, -0.35, 0, 1.0, 0.34, 0.2, COL.palm, 0.05); // palm
    for (let i = 0; i < count; i += 1) {
      cube(group, baseX - 0.36 + i * 0.18, 0.05, 0, 0.14, 0.52, 0.16, COL.finger);
    }
  };
  if (q <= 5) hand(q, 0);
  else {
    hand(5, -0.62);
    hand(q - 5, 0.62);
  }
  return group;
}

function buildEggs(q: number): THREE.Group {
  const group = new THREE.Group();
  cube(group, 0, -0.34, 0, 1.9, 0.26, 0.5, COL.nest, 0.03); // nest
  const perRow = 5;
  for (let i = 0; i < q; i += 1) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const inRow = Math.min(perRow, q - row * perRow);
    const startX = -((inRow - 1) * 0.32) / 2;
    cube(group, startX + col * 0.32, -0.05 + row * 0.34, 0.05, 0.22, 0.3, 0.22, COL.egg);
  }
  return group;
}

function buildPaws(q: number): THREE.Group {
  const group = new THREE.Group();
  const perRow = 5;
  for (let i = 0; i < q; i += 1) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const inRow = Math.min(perRow, q - row * perRow);
    const startX = -((inRow - 1) * 0.36) / 2;
    const x = startX + col * 0.36;
    const y = -0.1 + row * 0.4;
    cube(group, x, y, 0, 0.26, 0.26, 0.16, COL.pawPad); // pad
    cube(group, x - 0.12, y + 0.2, 0, 0.1, 0.1, 0.12, COL.pawToe);
    cube(group, x, y + 0.23, 0, 0.1, 0.1, 0.12, COL.pawToe);
    cube(group, x + 0.12, y + 0.2, 0, 0.1, 0.1, 0.12, COL.pawToe);
  }
  return group;
}

function buildNumeral(q: number): THREE.Group {
  const group = new THREE.Group();
  const digits = String(q).split("");
  const glyphW = 3 * 0.22 + 0.18;
  const totalW = digits.length * glyphW;
  digits.forEach((digit, di) => {
    const rows = PIXEL_DIGITS[digit] ?? PIXEL_DIGITS["0"];
    const ox = -totalW / 2 + glyphW / 2 + di * glyphW;
    rows.forEach((row, ry) => {
      row.split("").forEach((cellChar, cx) => {
        if (cellChar === "1") cube(group, ox + (cx - 1) * 0.22, (2 - ry) * 0.24, 0, 0.2, 0.22, 0.14, COL.numeral);
      });
    });
  });
  return group;
}

function buildMixed(q: number): THREE.Group {
  const group = new THREE.Group();
  // The numeral up top, the same amount as dots underneath.
  const numeral = buildNumeral(q);
  numeral.position.y = 0.5;
  numeral.scale.set(0.7, 0.7, 1);
  group.add(numeral);
  const dots = buildDots(q);
  dots.position.y = -0.55;
  dots.scale.set(0.7, 0.7, 1);
  group.add(dots);
  return group;
}

export function buildVoxelNumber(representation: string, quantity: number): THREE.Group {
  const q = Math.max(1, Math.min(10, Math.round(quantity)));
  switch (representation) {
    case "dots":
      return buildDots(q);
    case "dice":
      return buildDice(q);
    case "domino":
      return buildDomino(q);
    case "fingers":
      return buildFingers(q);
    case "fiveframe":
      return buildFrame(q, fiveFrameCells());
    case "tenframe":
      return buildFrame(q, tenFrameCells());
    case "beads":
      return buildBeads(q);
    case "eggs":
      return buildEggs(q);
    case "pawprints":
      return buildPaws(q);
    case "numeral":
      return buildNumeral(q);
    case "mixed":
      return buildMixed(q);
    case "blocks":
    default:
      return buildBlocks(q);
  }
}

// A friendly, varied order so every pattern shows up as the run goes on.
export const GATE_REPRESENTATION_ROTATION: string[] = [
  "dice",
  "dots",
  "tenframe",
  "fingers",
  "beads",
  "domino",
  "blocks",
  "fiveframe",
  "eggs",
  "numeral",
  "pawprints",
  "mixed"
];
