import type { QuantityRange } from "./types";

export interface Point {
  x: number;
  y: number;
}

export function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(10, Math.round(quantity)));
}

export function getQuantityRange(quantity: number): QuantityRange {
  const q = clampQuantity(quantity);
  if (q <= 3) return "1-3";
  if (q <= 5) return "4-5";
  if (q <= 8) return "6-8";
  return "9-10";
}

export function subitizeThresholdMs(quantity: number): number {
  const range = getQuantityRange(quantity);
  if (range === "1-3") return 400;
  if (range === "4-5") return 600;
  if (range === "6-8") return 900;
  return 1200;
}

export function canonicalParts(quantity: number): number[] {
  const q = clampQuantity(quantity);
  if (q <= 5) return [q];
  if (q === 8) return [5, 3];
  return [5, q - 5];
}

export function alternateParts(quantity: number): number[] {
  const q = clampQuantity(quantity);
  if (q === 4) return [2, 2];
  if (q === 8) return [4, 4];
  return canonicalParts(q);
}

export function makeTenComplement(quantity: number): number {
  return 10 - clampQuantity(quantity);
}

export function canonicalDotPositions(quantity: number): Point[] {
  const q = clampQuantity(quantity);
  const top = [
    { x: 24, y: 28 },
    { x: 48, y: 28 },
    { x: 72, y: 28 },
    { x: 96, y: 28 },
    { x: 120, y: 28 }
  ];
  const bottom = [
    { x: 24, y: 70 },
    { x: 48, y: 70 },
    { x: 72, y: 70 },
    { x: 96, y: 70 },
    { x: 120, y: 70 }
  ];

  if (q === 1) return [{ x: 72, y: 50 }];
  if (q === 2)
    return [
      { x: 52, y: 50 },
      { x: 92, y: 50 }
    ];
  if (q === 3)
    return [
      { x: 72, y: 26 },
      { x: 48, y: 70 },
      { x: 96, y: 70 }
    ];
  if (q === 4)
    return [
      { x: 52, y: 30 },
      { x: 92, y: 30 },
      { x: 52, y: 70 },
      { x: 92, y: 70 }
    ];
  if (q === 5) return top;
  return [...top, ...bottom.slice(0, q - 5)];
}

export function tenFrameCells(): Point[] {
  const cells: Point[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      cells.push({ x: 22 + col * 28, y: 24 + row * 30 });
    }
  }
  return cells;
}

export function fiveFrameCells(rowY = 42): Point[] {
  return [0, 1, 2, 3, 4].map((col) => ({ x: 22 + col * 28, y: rowY }));
}

export function dicePips(quantity: number): Point[] {
  const q = Math.max(1, Math.min(6, Math.round(quantity)));
  const left = 38;
  const mid = 70;
  const right = 102;
  const top = 28;
  const center = 50;
  const bottom = 72;
  const map: Record<number, Point[]> = {
    1: [{ x: mid, y: center }],
    2: [
      { x: left, y: top },
      { x: right, y: bottom }
    ],
    3: [
      { x: left, y: top },
      { x: mid, y: center },
      { x: right, y: bottom }
    ],
    4: [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom }
    ],
    5: [
      { x: left, y: top },
      { x: right, y: top },
      { x: mid, y: center },
      { x: left, y: bottom },
      { x: right, y: bottom }
    ],
    6: [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: center },
      { x: right, y: center },
      { x: left, y: bottom },
      { x: right, y: bottom }
    ]
  };
  return map[q];
}

export function diceParts(quantity: number): number[] {
  const q = clampQuantity(quantity);
  if (q <= 6) return [q];
  if (q === 7) return [5, 2];
  if (q === 8) return [4, 4];
  if (q === 9) return [5, 4];
  return [5, 5];
}

export function dominoParts(quantity: number): number[] {
  const q = clampQuantity(quantity);
  if (q <= 5) return [Math.max(0, q - 2), Math.min(2, q)];
  if (q === 6) return [3, 3];
  if (q === 7) return [5, 2];
  if (q === 8) return [4, 4];
  if (q === 9) return [5, 4];
  return [5, 5];
}

export function stableQuantityFromDate(date = new Date()): number {
  return ((date.getFullYear() + date.getMonth() + date.getDate()) % 10) + 1;
}

