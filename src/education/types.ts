export type Skill =
  | "subitize"
  | "make10"
  | "partwhole"
  | "compare"
  | "oneMoreLess"
  | "quantityToNumeral"
  | "numeralToQuantity"
  | "buildQuantity";

export type Representation =
  | "dots"
  | "dice"
  | "domino"
  | "fingers"
  | "fiveframe"
  | "tenframe"
  | "beads"
  | "blocks"
  | "eggs"
  | "pawprints"
  | "numeral"
  | "mixed";

export type QuantityRange = "1-3" | "4-5" | "6-8" | "9-10";

export type MasteryLevel = "emerging" | "secure" | "fluent";

export type SceneId =
  | "boot"
  | "hub"
  | "reis"
  | "mainMenu"
  | "run"
  | "results"
  | "count"
  | "match"
  | "compare"
  | "fill"
  | "onemoreless"
  | "order"
  | "memory"
  | "splitbord"
  | "klankgrot"
  | "letterkompas"
  | "tientalhuis"
  | "zoemroute"
  | "getallenlijn"
  | "woordbouwplaats"
  | "tienbrug"
  | "dubbelspel"
  | "vormenburcht"
  | "kloktoren"
  | "geldmarkt"
  | "meetwerf"
  | "verkeerspad"
  | "luisterbos"
  | "parentDashboard"
  | "settings";

export interface MasteryCell {
  skill: Skill;
  representation: Representation;
  range: QuantityRange;
  accuracy: number;
  medianRT: number;
  hintRate: number;
  exposures: number;
  recentErrors: string[];
  misconceptions: string[];
  mastery: MasteryLevel;
}

// Per-target mastery for a curriculum domain (reading, math-to-20, measure...).
// One cell per (domain, skill, targetKey) — e.g. the /s/ sound, the word "vis",
// the split 5=2+3, the teen 13. Lets the game resurface weak targets and the
// parent see exactly what is emerging vs secure.
export interface CurriculumCell {
  domain: string;
  skill: string;
  targetKey: string;
  exposures: number;
  accuracy: number;
  hintRate: number;
  recentErrors: string[];
  mastery: MasteryLevel;
}

export interface AttemptLog {
  timestamp: number;
  sessionId: string;
  levelId: string;
  scene: "runner" | "webwoud" | "city" | "minigame";
  challengeType: string;
  // Widened to the curriculum superset so non-number domains (reading, etc.) can
  // log here too. Number skills are unchanged; number views filter by `domain`.
  skill: Skill | CurriculumSkill;
  representation: Representation;
  quantity: number;
  quantityRange: QuantityRange;
  promptRepresentation: Representation;
  answerRepresentation?: Representation;
  correctAnswer: number | string | Array<number | string>;
  playerAnswer: number | string | Array<number | string>;
  wasCorrect: boolean;
  reactionTimeMs: number;
  hintUsed: boolean;
  errorType?: string;
  // ---- Optional generic curriculum fields (non-breaking) ----
  // Let non-number domains (reading, measurement, geometry...) log through the
  // same pipeline. When absent, the tracker falls back to the number fields.
  domain?: LearningDomain;
  targetKey?: string;
  rangeKey?: string;
  stimulusKey?: string;
  responseKey?: string;
}

export interface ChallengeOption {
  id: string;
  label: string;
  value: number | string | Array<number | string>;
  quantity?: number;
  representation: Representation;
  svg: string;
  isCorrect: boolean;
  scaffold?: string;
}

export interface Challenge {
  id: string;
  levelId: string;
  challengeType: string;
  title: string;
  prompt: string;
  scene: "runner" | "webwoud" | "city" | "minigame";
  skill: Skill;
  representation: Representation;
  promptRepresentation: Representation;
  answerRepresentation?: Representation;
  quantity: number;
  correctAnswer: number | string | Array<number | string>;
  displayTimeMs: number;
  options: ChallengeOption[];
  mechanic: string;
  successEffect: string;
  safeErrorEffect: string;
  hint: string;
}

export interface GameSettings {
  speed: number;
  /** Legacy master mute. Kept for old saves; the live UI uses music + sound. */
  muted: boolean;
  /** Background melodies on/off (independent of sound effects). */
  music: boolean;
  /** Gameplay sound effects (coins, snaps, wins) on/off. */
  sound: boolean;
  haptics: boolean;
  highContrast: boolean;
  /** Spoken Dutch voice (instructions, counting, praise). */
  voice: boolean;
}

export interface DistrictProgress {
  id: string;
  name: string;
  representation: Representation;
  restored: boolean;
  level: number;
  targetQuantity: number;
}

export interface PlaySession {
  id: string;
  startedAt: number;
  endedAt?: number;
  starsEarned: number;
  rescued: number;
  attempts: number;
}

export interface CosmeticsProgress {
  activeSkin: string;
  unlockedSkins: string[];
}

export interface WorldProgress {
  unlocked: boolean;
  completed: boolean;
  bestStars: number;
}

export interface JourneyProgress {
  /** Index of the next not-yet-done node on De Sterrenreis (the glowing frontier). */
  nodeIndex: number;
  /** Ids of completed journey nodes. */
  completed: string[];
  /**
   * The Sterrenronde: bringing the star home finishes a round, after which the
   * path continues — same map, one difficulty tier higher, tailored by the
   * adaptive engine. 1 = the first journey; older saves are migrated to 1.
   */
  round?: number;
}

export interface GameProgress {
  sessionId: string;
  stars: number;
  numberBlocks: number;
  rescuedDinos: number;
  rescuedNumerianen: number;
  dinoStreak: number;
  numberOfDay: number;
  currentLevel: number;
  cityDistricts: Record<string, DistrictProgress>;
  attempts: AttemptLog[];
  sessions: PlaySession[];
  lastChallengeIds: string[];
  /** Best run distance in metres, for the menu best-score badge. */
  bestRunDistance: number;
  /** Number of full runs the child has finished. */
  runsCompleted: number;
  cosmetics: CosmeticsProgress;
  /** Per-world unlock state and best star rating, keyed by world id. */
  worlds: Record<string, WorldProgress>;
  /** Earned collectible sticker ids. */
  stickers: string[];
  /** Progress along De Sterrenreis (the story map). */
  journey: JourneyProgress;
  /** Day key (yyyy-mm-dd) of the last opened daily gift chest. */
  dailyChestDay: string;
  /** Come-back-tomorrow streak: consecutive days the daily chest was opened. */
  streak: DayStreak;
  /** Finished activities toward the session treasure chest (full at 3). */
  sessionChestFill: number;
  /** Highest Buddy level already celebrated with the level-up moment. */
  buddyLevelSeen: number;
}

export interface DayStreak {
  /** Consecutive days including today's claim. */
  count: number;
  /** Best streak ever reached. */
  best: number;
  /** Day key (yyyy-mm-dd) of the most recent claim. */
  lastDay: string;
}

export interface SaveData {
  version: number;
  settings: GameSettings;
  progress: GameProgress;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
}

export interface ProfileRoster {
  activeId: string;
  profiles: ChildProfile[];
}

export const SKILLS: Skill[] = [
  "subitize",
  "make10",
  "partwhole",
  "compare",
  "oneMoreLess",
  "quantityToNumeral",
  "numeralToQuantity",
  "buildQuantity"
];

export const REPRESENTATIONS: Representation[] = [
  "dots",
  "dice",
  "domino",
  "fingers",
  "fiveframe",
  "tenframe",
  "beads",
  "blocks",
  "eggs",
  "pawprints",
  "numeral",
  "mixed"
];

export const QUANTITY_RANGES: QuantityRange[] = ["1-3", "4-5", "6-8", "9-10"];

export const MINIGAME_TYPES = [
  "flash-gates",
  "dice-hunt",
  "bead-bridge",
  "make-ten-shield",
  "split-chests",
  "web-anchors",
  "train-of-ten",
  "enemy-wave-compare",
  "build-the-number",
  "one-more-one-less",
  "double-track",
  "rescue-the-herd"
] as const;

export type MinigameType = (typeof MINIGAME_TYPES)[number];

// ---- Generic curriculum layer (non-breaking, additive) -------------------
// The game grows from "number sense 1-10" toward a full first-grade curriculum
// (reading, operations to 20, measurement, geometry...). These types describe a
// learning target in any domain WITHOUT disturbing the number-first Skill union
// above — existing number modes keep using `Skill`; new modes use this superset.
export type LearningDomain =
  | "math-number"
  | "math-operations"
  | "math-measurement"
  | "math-geometry"
  | "literacy-phonemic"
  | "literacy-reading"
  | "literacy-writing"
  | "listening-comprehension"
  | "world-traffic";

export type CurriculumSkill =
  | Skill
  | "numberLine20"
  | "teenNumber"
  | "addSub20"
  | "bridge10"
  | "money10"
  | "timeHourHalf"
  | "measureCompare"
  | "shapeRecognize"
  | "spatialPosition"
  | "patternContinue"
  | "soundDiscriminate"
  | "soundBlend"
  | "soundSegment"
  | "letterSound"
  | "wordRead"
  | "wordBuild"
  | "rhyme"
  | "vocabulary"
  | "listeningQuestion"
  | "trafficSafety";

export interface LearningTarget {
  id: string;
  domain: LearningDomain;
  skill: CurriculumSkill;
  rangeKey: string;
  label: string;
}
