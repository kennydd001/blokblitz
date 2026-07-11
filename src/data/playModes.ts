import type { CurriculumSkill, LearningDomain } from "../education/types";

export type PlayCategoryId = "getallen" | "splitsen" | "lezen" | "tot20" | "ontdekken";
export type PlayTrack = "math" | "literacy" | "discovery";

export interface PlayMode {
  scene: string;
  emoji: string;
  name: string;
  desc: string;
  tone: string;
  category: PlayCategoryId;
  track: PlayTrack;
  /** Earliest recommendation stage. Every mode remains available in free play. */
  stage: 1 | 2 | 3;
  /** Order within a track for a child who has no history yet. */
  sequence: number;
  domain?: LearningDomain;
  skills?: CurriculumSkill[];
  targetPrefixes?: string[];
  levelIds?: string[];
  challengeTypes?: string[];
}

export const PLAY_CATEGORIES: Array<{ id: PlayCategoryId; emoji: string; label: string }> = [
  { id: "getallen", emoji: "🔢", label: "Getallen" },
  { id: "splitsen", emoji: "🧩", label: "Splitsen" },
  { id: "lezen", emoji: "🔤", label: "Lezen" },
  { id: "tot20", emoji: "➕", label: "Tot 20" },
  { id: "ontdekken", emoji: "🧭", label: "Ontdekken" }
];

export const PLAY_MODES: PlayMode[] = [
  { scene: "count", emoji: "🐣", name: "Tel mee", desc: "Tel de diertjes", tone: "count", category: "getallen", track: "math", stage: 1, sequence: 0, challengeTypes: ["count-tap"] },
  { scene: "match", emoji: "🧩", name: "Zoek hetzelfde", desc: "Vind even veel", tone: "match", category: "getallen", track: "math", stage: 1, sequence: 1, challengeTypes: ["match-same"] },
  { scene: "compare", emoji: "🦖", name: "Wat is meer?", desc: "Kies de grootste", tone: "compare", category: "getallen", track: "math", stage: 1, sequence: 2, challengeTypes: ["compare-more"] },
  { scene: "onemoreless", emoji: "➕", name: "Eentje erbij", desc: "Meer of minder", tone: "onemore", category: "getallen", track: "math", stage: 1, sequence: 3, challengeTypes: ["one-more-less"] },
  { scene: "order", emoji: "🔢", name: "Op volgorde", desc: "Klein naar groot", tone: "order", category: "getallen", track: "math", stage: 1, sequence: 4, challengeTypes: ["order-up"] },
  { scene: "memory", emoji: "🧠", name: "Memory", desc: "Zoek de paren", tone: "memory", category: "getallen", track: "math", stage: 1, sequence: 5, challengeTypes: ["match-same"] },

  { scene: "splitbord", emoji: "⚖️", name: "Splitsbord", desc: "Maak het getal samen", tone: "splitbord", category: "splitsen", track: "math", stage: 1, sequence: 6, challengeTypes: ["splitbord-parts", "splitbord-missing", "splitbord-total"] },
  { scene: "fill", emoji: "🔟", name: "Vul de tien", desc: "Maak het getal", tone: "fill", category: "splitsen", track: "math", stage: 2, sequence: 7, challengeTypes: ["fill-ten"] },
  { scene: "vriendjes", emoji: "🤝", name: "Vriendjes van 10", desc: "Samen tot 10", tone: "vriendjes", category: "splitsen", track: "math", stage: 2, sequence: 8, domain: "math-number", skills: ["make10"], targetPrefixes: ["bond-", "isten-"] },

  { scene: "klankgrot", emoji: "🔊", name: "Klankgrot", desc: "Luister naar klanken", tone: "klankgrot", category: "lezen", track: "literacy", stage: 1, sequence: 0, domain: "literacy-phonemic", skills: ["soundDiscriminate", "soundBlend"] },
  { scene: "rijmspel", emoji: "🌊", name: "Rijmrivier", desc: "Vind wat rijmt", tone: "rijmspel", category: "lezen", track: "literacy", stage: 1, sequence: 1, domain: "literacy-phonemic", skills: ["rhyme"] },
  { scene: "letterkompas", emoji: "🧭", name: "Letterkompas", desc: "Letter en klank", tone: "letterkompas", category: "lezen", track: "literacy", stage: 1, sequence: 2, domain: "literacy-reading", skills: ["letterSound"] },
  { scene: "luisterbos", emoji: "🌳", name: "Luisterbos", desc: "Luister het verhaaltje", tone: "luister", category: "lezen", track: "literacy", stage: 1, sequence: 3, domain: "listening-comprehension", skills: ["listeningQuestion"] },
  { scene: "zoemroute", emoji: "🐝", name: "Zoemroute", desc: "Zoem tot een woord", tone: "zoemroute", category: "lezen", track: "literacy", stage: 2, sequence: 4, domain: "literacy-reading", skills: ["wordRead"], targetPrefixes: ["word-"] },
  { scene: "woordbouwplaats", emoji: "🔤", name: "Woordbouw", desc: "Bouw het woord", tone: "woordbouw", category: "lezen", track: "literacy", stage: 2, sequence: 5, domain: "literacy-reading", skills: ["wordBuild"], targetPrefixes: ["build-"] },

  { scene: "tientalhuis", emoji: "🏠", name: "Tientalhuis", desc: "Tien en nog wat", tone: "tientalhuis", category: "tot20", track: "math", stage: 2, sequence: 9, domain: "math-number", skills: ["teenNumber"] },
  { scene: "getallenlijn", emoji: "📏", name: "Getallenlijn", desc: "De lijn tot 20", tone: "getallenlijn", category: "tot20", track: "math", stage: 2, sequence: 10, domain: "math-number", skills: ["numberLine20"] },
  { scene: "dubbelspel", emoji: "✌️", name: "Dubbelspel", desc: "Dubbel en even", tone: "dubbelspel", category: "tot20", track: "math", stage: 2, sequence: 11, domain: "math-operations", skills: ["addSub20"], targetPrefixes: ["double-", "near-", "evenodd-"] },
  { scene: "sprongpad", emoji: "🦘", name: "Sprongpad", desc: "Tel per 2, 5 en 10", tone: "sprongpad", category: "tot20", track: "math", stage: 3, sequence: 12, domain: "math-number", skills: ["skipCount"] },
  { scene: "tienbrug", emoji: "🌉", name: "Tienbrug", desc: "Plus en min tot 20", tone: "tienbrug", category: "tot20", track: "math", stage: 3, sequence: 13, domain: "math-operations", skills: ["addSub20", "bridge10"], targetPrefixes: ["toten-", "add-", "sub-"] },

  { scene: "vormenburcht", emoji: "🔷", name: "Vormenburcht", desc: "Vormen en patronen", tone: "vormen", category: "ontdekken", track: "discovery", stage: 1, sequence: 0, domain: "math-geometry", skills: ["shapeRecognize", "patternContinue"] },
  { scene: "verkeerspad", emoji: "🚦", name: "Verkeerspad", desc: "Veilig op straat", tone: "verkeer", category: "ontdekken", track: "discovery", stage: 1, sequence: 1, domain: "world-traffic", skills: ["trafficSafety"] },
  { scene: "meetwerf", emoji: "📐", name: "Meetwerf", desc: "Langer of korter", tone: "meet", category: "ontdekken", track: "discovery", stage: 2, sequence: 2, domain: "math-measurement", skills: ["measureCompare"] },
  { scene: "geldmarkt", emoji: "🪙", name: "Geldmarkt", desc: "Tel het geld", tone: "geld", category: "ontdekken", track: "discovery", stage: 3, sequence: 3, domain: "math-measurement", skills: ["money10"] },
  { scene: "kloktoren", emoji: "🕐", name: "Kloktoren", desc: "Lees de klok", tone: "klok", category: "ontdekken", track: "discovery", stage: 3, sequence: 4, domain: "math-measurement", skills: ["timeHourHalf"] }
];

export function playModeByScene(scene: string): PlayMode | undefined {
  return PLAY_MODES.find((mode) => mode.scene === scene);
}
