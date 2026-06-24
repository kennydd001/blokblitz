// "De Sterrenreis" — the one winding road that ties every activity into a single
// adventure: help Buddy carry the lost star home. Each node is one existing
// activity (a tap mode or a runner world) or a reward beat (a rescued friend),
// laid out over the six world colour bands so the map literally IS the world
// progression. Pure data + deterministic coordinates — no logic, no assets.

import { getWorld, cssHex } from "../runner/worlds";

export type JourneyKind = "stop" | "gate" | "friend" | "star";

export interface JourneyNode {
  id: string;
  kind: JourneyKind;
  /** scene to launch for a stop (a mini-game name); gates use 'run'. */
  scene?: string;
  worldId?: string;
  regionId: string;
  emoji: string;
  /** collectible friend id for friend nodes. */
  friendId?: string;
  friendName?: string;
  x: number;
  y: number;
}

const MODE_EMOJI: Record<string, string> = {
  count: "🐣",
  onemoreless: "➕",
  match: "🧩",
  memory: "🧠",
  compare: "🦖",
  order: "🔢",
  fill: "🔟"
};

const MODE_TITLE: Record<string, string> = {
  count: "Tel de diertjes",
  onemoreless: "Eentje erbij",
  match: "Zoek evenveel",
  memory: "Vind de paren",
  compare: "Kies de grootste",
  order: "Zet op volgorde",
  fill: "Vul de tien"
};

const MODE_ACTION: Record<string, string> = {
  count: "Tik en tel hardop.",
  onemoreless: "Spring naar meer of minder.",
  match: "Zoek hetzelfde getalbeeld.",
  memory: "Draai twee gelijke beelden om.",
  compare: "Pak de grootste groep.",
  order: "Leg de getallen klein naar groot.",
  fill: "Maak het doelgetal vol."
};

// Ordered by each region's number cap (5 -> 6 -> 8 -> 8 -> 10 -> 10), so difficulty
// rises along the road for free. Each region ends in its runner GATE, then a friend.
interface RegionPlan {
  region: string;
  stops: string[];
  friend: { id: string; name: string; emoji: string };
}

const REGIONS: RegionPlan[] = [
  { region: "grasland", stops: ["count", "onemoreless"], friend: { id: "f-bun", name: "Hippie het konijn", emoji: "🐰" } },
  { region: "muntgrot", stops: ["match", "memory"], friend: { id: "f-fox", name: "Vonk de vos", emoji: "🦊" } },
  { region: "ijsbaan", stops: ["compare", "order"], friend: { id: "f-peng", name: "Pim de pinguïn", emoji: "🐧" } },
  { region: "webwoud", stops: ["memory", "compare"], friend: { id: "f-owl", name: "Oeki de uil", emoji: "🦉" } },
  { region: "bouwdorp", stops: ["fill", "order", "count"], friend: { id: "f-frog", name: "Bram de kikker", emoji: "🐸" } },
  { region: "sterrenrace", stops: ["match", "fill"], friend: { id: "f-dragon", name: "Sterre de draak", emoji: "🐲" } }
];

const SPACING = 150;
const TOP_MARGIN = 150;
const VIEW_W = 360;
const AMPLITUDE = 112;

function buildNodes(): JourneyNode[] {
  // First gather the kinds in order (stops..., gate, friend) per region; star at the end.
  const specs: Omit<JourneyNode, "x" | "y">[] = [];
  REGIONS.forEach((plan) => {
    plan.stops.forEach((scene, s) => {
      specs.push({ id: `${plan.region}-${scene}-${s}`, kind: "stop", scene, regionId: plan.region, emoji: MODE_EMOJI[scene] ?? "❓" });
    });
    specs.push({ id: `${plan.region}-gate`, kind: "gate", scene: "run", worldId: plan.region, regionId: plan.region, emoji: getWorld(plan.region).emoji });
    specs.push({
      id: plan.friend.id,
      kind: "friend",
      regionId: plan.region,
      emoji: plan.friend.emoji,
      friendId: plan.friend.id,
      friendName: plan.friend.name
    });
  });
  specs.push({ id: "ster", kind: "star", regionId: "sterrenrace", emoji: "⭐" });

  // Node 0 sits at the bottom; the road climbs to the star at the top.
  const n = specs.length;
  return specs.map((spec, i) => ({
    ...spec,
    x: Math.round(VIEW_W / 2 + Math.sin(i * 0.8) * AMPLITUDE),
    y: Math.round(TOP_MARGIN + (n - 1 - i) * SPACING)
  }));
}

export const JOURNEY: JourneyNode[] = buildNodes();

export const JOURNEY_WIDTH = VIEW_W;
export const JOURNEY_HEIGHT = TOP_MARGIN * 2 + (JOURNEY.length - 1) * SPACING;

export interface RegionBand {
  regionId: string;
  color: string;
  topY: number;
  bottomY: number;
}

/** Coloured background bands (light world sky) covering each region's stretch of road. */
export function regionBands(): RegionBand[] {
  const bands: RegionBand[] = [];
  REGIONS.forEach((plan, index) => {
    const ys = JOURNEY.filter((node) => node.regionId === plan.region).map((node) => node.y);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const next = index < REGIONS.length - 1;
    bands.push({
      regionId: plan.region,
      color: cssHex(getWorld(plan.region).palette.sky),
      topY: index === REGIONS.length - 1 ? 0 : top - SPACING / 2,
      bottomY: next ? bottom + SPACING / 2 : JOURNEY_HEIGHT
    });
  });
  return bands;
}

export function nodeIndexById(id: string): number {
  return JOURNEY.findIndex((node) => node.id === id);
}

/** The first node not yet completed = the glowing frontier. */
export function frontierIndex(completed: string[]): number {
  const done = new Set(completed);
  const idx = JOURNEY.findIndex((node) => !done.has(node.id));
  return idx < 0 ? JOURNEY.length : idx;
}

export const FRIENDS = REGIONS.map((plan) => plan.friend);

export function journeyNodeTitle(node: JourneyNode): string {
  if (node.kind === "gate") return `${getWorld(node.worldId).name} run`;
  if (node.kind === "friend") return node.friendName ? `Red ${node.friendName}` : "Red een vriendje";
  if (node.kind === "star") return "Breng de ster thuis";
  return MODE_TITLE[node.scene ?? ""] ?? "Volgende stap";
}

export function journeyNodeAction(node: JourneyNode): string {
  if (node.kind === "gate") return "Ren door de juiste getalpoorten.";
  if (node.kind === "friend") return "Tik om je vriendje mee te nemen.";
  if (node.kind === "star") return "Tik de ster en vier de thuisreis.";
  return MODE_ACTION[node.scene ?? ""] ?? "Speel en help Buddy verder.";
}

export function journeyProgressLabel(completed: string[]): string {
  const frontier = frontierIndex(completed);
  if (frontier >= JOURNEY.length) return "Ster thuis";
  return `${frontier + 1}/${JOURNEY.length}`;
}
