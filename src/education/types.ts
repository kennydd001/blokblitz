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
  | "mainMenu"
  | "numberOfDay"
  | "runner"
  | "webwoud"
  | "city"
  | "minigame"
  | "summary"
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

export interface AttemptLog {
  timestamp: number;
  sessionId: string;
  levelId: string;
  scene: "runner" | "webwoud" | "city" | "minigame";
  challengeType: string;
  skill: Skill;
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
  muted: boolean;
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
}

export interface SaveData {
  version: number;
  settings: GameSettings;
  progress: GameProgress;
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
