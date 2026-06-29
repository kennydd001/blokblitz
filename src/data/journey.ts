// "De Sterrenreis" — the one winding road that ties every activity into a single
// adventure: help Buddy carry the lost star home. Each node is one existing
// activity (a tap mode or a runner world) or a reward beat (a rescued friend),
// laid out over the six world colour bands so the map literally IS the world
// progression. Pure data + deterministic coordinates — no logic, no assets.

import { getWorld, cssHex } from "../runner/worlds";

export type JourneyKind = "stop" | "gate" | "friend" | "boss" | "star";

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
  fill: "🔟",
  splitbord: "⚖️",
  klankgrot: "🔊",
  letterkompas: "🧭",
  tientalhuis: "🏠",
  zoemroute: "🐝"
};

const MODE_TITLE: Record<string, string> = {
  count: "Tel de diertjes",
  onemoreless: "Eentje erbij",
  match: "Zoek evenveel",
  memory: "Vind de paren",
  compare: "Kies de grootste",
  order: "Zet op volgorde",
  fill: "Vul de tien",
  splitbord: "Splitsbord",
  klankgrot: "Klankgrot",
  letterkompas: "Letterkompas",
  tientalhuis: "Tientalhuis",
  zoemroute: "Zoemroute"
};

const MODE_ACTION: Record<string, string> = {
  count: "Tik en tel hardop.",
  onemoreless: "Spring naar meer of minder.",
  match: "Zoek hetzelfde getalbeeld.",
  memory: "Draai twee gelijke beelden om.",
  compare: "Pak de grootste groep.",
  order: "Leg de getallen klein naar groot.",
  fill: "Maak het doelgetal vol.",
  splitbord: "Vul de twee vakjes samen tot het getal.",
  klankgrot: "Luister en kies het juiste plaatje.",
  letterkompas: "Hoor de klank en kies de letter.",
  tientalhuis: "Maak een tiener: tien en nog wat.",
  zoemroute: "Zoem de klanken samen tot een woord."
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
  { region: "muntgrot", stops: ["klankgrot", "match", "memory"], friend: { id: "f-fox", name: "Vonk de vos", emoji: "🦊" } },
  { region: "ijsbaan", stops: ["compare", "letterkompas", "order"], friend: { id: "f-peng", name: "Pim de pinguïn", emoji: "🐧" } },
  { region: "webwoud", stops: ["memory", "compare", "tientalhuis"], friend: { id: "f-owl", name: "Oeki de uil", emoji: "🦉" } },
  { region: "bouwdorp", stops: ["fill", "splitbord", "order", "count"], friend: { id: "f-frog", name: "Bram de kikker", emoji: "🐸" } },
  { region: "sterrenrace", stops: ["match", "zoemroute", "fill"], friend: { id: "f-dragon", name: "Sterre de draak", emoji: "🐲" } }
];

// Each region's climax: a colour-stealing boss that guards the trapped friend.
// You beat it with number challenges (each correct answer is a hit); when it
// falls, the region's colours bloom back and the friend joins the parade.
export interface BossSpec {
  name: string;
  emoji: string;
  taunt: string;
  defeat: string;
}

export const BOSSES: Record<string, BossSpec> = {
  grasland: { name: "Grauwgrijs", emoji: "👾", taunt: "Geen kleur voor jou!", defeat: "Het grasland is weer groen!" },
  muntgrot: { name: "Schaduwvleer", emoji: "🦇", taunt: "Lekker donker hier!", defeat: "De grot glinstert weer goud!" },
  ijsbaan: { name: "Vorstwolf", emoji: "🐺", taunt: "Alles bevriest!", defeat: "Het ijs glimt weer blauw!" },
  webwoud: { name: "Webbaas", emoji: "🕷️", taunt: "Mooi vast in mijn web!", defeat: "Het webwoud kleurt weer groen!" },
  bouwdorp: { name: "Sloopbot", emoji: "🤖", defeat: "Het dorp staat weer overeind!", taunt: "Sloop! Sloop!" },
  sterrenrace: { name: "Sterrenrover", emoji: "👹", taunt: "De ster is van mij!", defeat: "De sterrenhemel schittert weer!" }
};

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
    specs.push({ id: `${plan.region}-boss`, kind: "boss", scene: "boss", worldId: plan.region, regionId: plan.region, emoji: BOSSES[plan.region].emoji });
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

/**
 * Linear-journey repair. A returning save's `completed` ids may predate nodes
 * that were inserted later (e.g. the region bosses). Because the journey is
 * strictly linear (you can only ever tap the current frontier), the correct
 * completed set is always a clean prefix — so fill it back up to the furthest
 * node the child had actually reached, which also marks any newly inserted
 * earlier nodes as already done instead of sending the child backwards.
 */
export function backfillCompleted(completed: string[]): string[] {
  const done = new Set(completed);
  let maxIdx = -1;
  JOURNEY.forEach((node, i) => {
    if (done.has(node.id)) maxIdx = i;
  });
  if (maxIdx < 0) return [];
  return JOURNEY.slice(0, maxIdx + 1).map((node) => node.id);
}

/** The first node not yet completed = the glowing frontier. */
export function frontierIndex(completed: string[]): number {
  const done = new Set(completed);
  const idx = JOURNEY.findIndex((node) => !done.has(node.id));
  return idx < 0 ? JOURNEY.length : idx;
}

export const FRIENDS = REGIONS.map((plan) => plan.friend);

// ---- the story spine -------------------------------------------------------
// When the star fell, the colour drained out of every region. Buddy carries the
// star home one region at a time; each region's colour blooms back as the child
// finishes it, and a friend who was lost there joins the parade. These tiny,
// kid-readable beats give the journey a "why" beyond just "next activity".

/** One-line story hook shown + spoken the first time Buddy enters each region. */
export const REGION_STORY: Record<string, string> = {
  grasland: "Het grasland werd grijs toen de ster viel. Breng de kleuren terug!",
  muntgrot: "In de Muntgrot is het donker. Tel goed, dan glinstert het weer!",
  ijsbaan: "Op de ijsbaan is alles bevroren. Warme antwoorden laten het smelten!",
  webwoud: "In het Webwoud raakte een vriendje verstrikt. Help het los!",
  bouwdorp: "Het Bouwdorp viel om. Samen bouwen we het stukje voor stukje weer op!",
  sterrenrace: "Bijna thuis! De sterrenhemel wacht op zijn verloren sterretje."
};

/** What each rescued friend says/does as it joins the parade. */
export const FRIEND_STORY: Record<string, string> = {
  "f-bun": "Hippie het konijn hupt mee en wijst de weg!",
  "f-fox": "Vonk de vos snuffelt de muntjes zo voor je op!",
  "f-peng": "Pim de pinguïn glijdt vrolijk met je mee!",
  "f-owl": "Oeki de uil houdt van bovenaf de wacht!",
  "f-frog": "Bram de kikker springt van blok naar blok!",
  "f-dragon": "Sterre de draak draagt de ster het laatste stukje!"
};

/** The opening story, shown once on a brand-new journey (no nodes done yet). */
export const JOURNEY_INTRO = {
  title: "De Sterrenreis",
  lines: [
    "Op een nacht viel er een sterretje uit de hemel.",
    "Alle kleuren verdwenen… maar samen brengen we ze terug!",
    "Help Buddy de ster naar huis te dragen en onderweg vriendjes te redden."
  ],
  start: "Start het avontuur!"
};

/** The closing story, spoken at the star finale. */
export function journeyFinale(friendsRescued: number): string {
  return `Hoera! De ster is thuis en schijnt weer! Alle kleuren zijn terug en ${friendsRescued} vriendjes vieren mee. Knap gedaan!`;
}

export function journeyNodeTitle(node: JourneyNode): string {
  if (node.kind === "gate") return `${getWorld(node.worldId).name} run`;
  if (node.kind === "boss") return `Versla ${BOSSES[node.regionId]?.name ?? "de baas"}`;
  if (node.kind === "friend") return node.friendName ? `Red ${node.friendName}` : "Red een vriendje";
  if (node.kind === "star") return "Breng de ster thuis";
  return MODE_TITLE[node.scene ?? ""] ?? "Volgende stap";
}

export function journeyNodeAction(node: JourneyNode): string {
  if (node.kind === "gate") return "Ren door de juiste getalpoorten.";
  if (node.kind === "boss") return "Raak de baas met het juiste getal!";
  if (node.kind === "friend") return "Tik om je vriendje mee te nemen.";
  if (node.kind === "star") return "Tik de ster en vier de thuisreis.";
  return MODE_ACTION[node.scene ?? ""] ?? "Speel en help Buddy verder.";
}

export function journeyProgressLabel(completed: string[]): string {
  const frontier = frontierIndex(completed);
  if (frontier >= JOURNEY.length) return "Ster thuis";
  return `${frontier + 1}/${JOURNEY.length}`;
}
