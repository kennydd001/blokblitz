// The worlds the child travels through. Each is a distinct biome with its own
// look, number focus and mechanic mix, and they get gradually harder — small
// numbers and subitising first, up to 10 and comparing/10-structure later. This
// turns one runner into a whole progression of levels that feel like new games.

import type { MinigameType } from "../education/types";

export type PropStyle = "tree" | "crystal" | "ice" | "mushroom" | "cactus" | "star";

export interface WorldPalette {
  sky: number;
  fog: number;
  ground: number;
  stripeLight: number;
  stripeDark: number;
  rail: number;
  curb: number;
  props: number[];
  propStyle: PropStyle;
}

export interface WorldMechanics {
  obstacleChance: number;
  swingRounds: number[];
  build: boolean;
  coinDensity: number; // multiplier on the coin runs
}

export interface WorldDef {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** Previous world that must be completed first; null = open from the start. */
  unlockAfter: string | null;
  gatesTotal: number;
  maxQuantity: number;
  speed: number; // pace multiplier on top of the parent Settings speed
  gateTypes: MinigameType[];
  representations: string[];
  palette: WorldPalette;
  mechanics: WorldMechanics;
}

export const WORLDS: WorldDef[] = [
  {
    id: "grasland",
    name: "Grasland",
    emoji: "🌳",
    blurb: "Leer de kleine getallen tot 5.",
    unlockAfter: null,
    gatesTotal: 6,
    maxQuantity: 5,
    speed: 0.92,
    gateTypes: ["flash-gates", "dice-hunt"],
    representations: ["dots", "dice", "fingers", "blocks"],
    palette: {
      sky: 0x8fd6ff,
      fog: 0x8fd6ff,
      ground: 0x6cc36a,
      stripeLight: 0x86e08a,
      stripeDark: 0x5bb262,
      rail: 0xffffff,
      curb: 0xf6c453,
      props: [0x2f9e54, 0x39b06a, 0x7bd389],
      propStyle: "tree"
    },
    mechanics: { obstacleChance: 0.25, swingRounds: [], build: false, coinDensity: 1 }
  },
  {
    id: "muntgrot",
    name: "Muntgrot",
    emoji: "🪙",
    blurb: "Verzamel munten en tel tot 6.",
    unlockAfter: "grasland",
    gatesTotal: 6,
    maxQuantity: 6,
    speed: 0.98,
    gateTypes: ["flash-gates", "dice-hunt"],
    representations: ["dots", "dice", "tenframe", "beads"],
    palette: {
      sky: 0xffce8a,
      fog: 0xf3a44e,
      ground: 0x8a6b4a,
      stripeLight: 0xa07a52,
      stripeDark: 0x6f5238,
      rail: 0xffe9a8,
      curb: 0xf4b942,
      props: [0x6f59d9, 0x35a7f0, 0xb084f5],
      propStyle: "crystal"
    },
    mechanics: { obstacleChance: 0.4, swingRounds: [], build: false, coinDensity: 1.6 }
  },
  {
    id: "ijsbaan",
    name: "IJsbaan",
    emoji: "❄️",
    blurb: "Pak de grootste groep tot 8.",
    unlockAfter: "muntgrot",
    gatesTotal: 7,
    maxQuantity: 8,
    speed: 1.05,
    gateTypes: ["enemy-wave-compare", "flash-gates"],
    representations: ["dice", "tenframe", "domino", "dots", "fiveframe"],
    palette: {
      sky: 0xcdeeff,
      fog: 0xdff4ff,
      ground: 0xbfe6f5,
      stripeLight: 0xeaffff,
      stripeDark: 0xa6d8ec,
      rail: 0xffffff,
      curb: 0x7ec8e6,
      props: [0xffffff, 0xcaf0ff, 0x9bdcff],
      propStyle: "ice"
    },
    mechanics: { obstacleChance: 0.4, swingRounds: [], build: false, coinDensity: 1 }
  },
  {
    id: "webwoud",
    name: "Webwoud",
    emoji: "🕸️",
    blurb: "Slinger door het woud tot 8.",
    unlockAfter: "ijsbaan",
    gatesTotal: 7,
    maxQuantity: 8,
    speed: 1.08,
    gateTypes: ["flash-gates", "dice-hunt", "enemy-wave-compare"],
    representations: ["dice", "dots", "tenframe", "fingers", "beads", "domino"],
    palette: {
      sky: 0xbfe0d0,
      fog: 0x9fd0b8,
      ground: 0x2f7a4a,
      stripeLight: 0x3c9a5c,
      stripeDark: 0x256b3e,
      rail: 0xeafff2,
      curb: 0xe4564b,
      props: [0xe4564b, 0x6f59d9, 0xf5a623],
      propStyle: "mushroom"
    },
    mechanics: { obstacleChance: 0.3, swingRounds: [1, 3, 5], build: false, coinDensity: 1.1 }
  },
  {
    id: "bouwdorp",
    name: "Bouwdorp",
    emoji: "🧱",
    blurb: "Bouw mee en maak tien.",
    unlockAfter: "webwoud",
    gatesTotal: 7,
    maxQuantity: 10,
    speed: 1.02,
    gateTypes: ["dice-hunt", "flash-gates"],
    representations: ["tenframe", "numeral", "blocks", "beads", "fiveframe"],
    palette: {
      sky: 0xffe1b0,
      fog: 0xffcf8f,
      ground: 0xb88a5a,
      stripeLight: 0xcda06a,
      stripeDark: 0x96703f,
      rail: 0xfff2cc,
      curb: 0x8a5a3c,
      props: [0x39b06a, 0x6cc36a, 0x9b6b4a],
      propStyle: "cactus"
    },
    mechanics: { obstacleChance: 0.35, swingRounds: [], build: true, coinDensity: 1.2 }
  },
  {
    id: "sterrenrace",
    name: "Sterrenrace",
    emoji: "🚀",
    blurb: "De grote finale tot 10!",
    unlockAfter: "bouwdorp",
    gatesTotal: 8,
    maxQuantity: 10,
    speed: 1.2,
    gateTypes: ["flash-gates", "dice-hunt", "enemy-wave-compare"],
    representations: ["dice", "dots", "tenframe", "fingers", "beads", "domino", "numeral", "pawprints", "eggs", "mixed"],
    palette: {
      sky: 0x1a1444,
      fog: 0x2a2150,
      ground: 0x3a2f6a,
      stripeLight: 0x5a4aa0,
      stripeDark: 0x2c2358,
      rail: 0x9be3ff,
      curb: 0xf7c531,
      props: [0xffe27a, 0x9be3ff, 0xff7ad9],
      propStyle: "star"
    },
    mechanics: { obstacleChance: 0.45, swingRounds: [2, 5], build: true, coinDensity: 1.2 }
  }
];

export function getWorld(id: string | undefined): WorldDef {
  return WORLDS.find((world) => world.id === id) ?? WORLDS[0];
}

export function nextWorldId(id: string): string | null {
  const index = WORLDS.findIndex((world) => world.id === id);
  if (index < 0 || index >= WORLDS.length - 1) return null;
  return WORLDS[index + 1].id;
}

/** 1 = finished, 2 = most gates right, 3 = (near) perfect. */
export function starsForRun(gatesCorrect: number, gatesTotal: number): number {
  const ratio = gatesTotal > 0 ? gatesCorrect / gatesTotal : 0;
  if (ratio >= 0.99) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function cssHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
