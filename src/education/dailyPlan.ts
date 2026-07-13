import { PLAY_MODES, type PlayMode, type PlayTrack } from "../data/playModes";
import type { ActivityHistoryEntry, AttemptLog } from "./types";

export interface DailyPlanInput {
  dayKey: string;
  now: number;
  attempts: AttemptLog[];
  activityHistory: ActivityHistoryEntry[];
  journeyIndex: number;
  journeyRound: number;
}

export interface DailyRecommendation {
  scene: string;
  track: PlayTrack;
  reason: "rekenen" | "lezen" | "ontdekken";
}

const TRACKS: Array<{ track: PlayTrack; reason: DailyRecommendation["reason"] }> = [
  { track: "math", reason: "rekenen" },
  { track: "literacy", reason: "lezen" },
  { track: "discovery", reason: "ontdekken" }
];

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function recommendationStage(input: Pick<DailyPlanInput, "attempts" | "journeyIndex" | "journeyRound">): 1 | 2 | 3 {
  if (input.journeyRound > 1 || input.journeyIndex >= 28 || input.attempts.length >= 150) return 3;
  if (input.journeyIndex >= 9 || input.attempts.length >= 45) return 2;
  return 1;
}

export function buildDailyPlayPlan(input: DailyPlanInput): DailyRecommendation[] {
  const stage = recommendationStage(input);
  return TRACKS.map(({ track, reason }) => {
    const eligible = PLAY_MODES.filter((mode) => mode.track === track && mode.stage <= stage);
    const candidates = eligible.length > 0 ? eligible : PLAY_MODES.filter((mode) => mode.track === track && mode.stage === 1);
    const best = [...candidates].sort((a, b) => scoreMode(b, input) - scoreMode(a, input) || a.sequence - b.sequence || a.scene.localeCompare(b.scene))[0];
    return { scene: best.scene, track, reason };
  });
}

function scoreMode(mode: PlayMode, input: DailyPlanInput): number {
  const relevant = input.attempts.filter((attempt) => attemptMatchesMode(attempt, mode));
  const accuracy = relevant.length === 0 ? 1 : relevant.filter((attempt) => attempt.wasCorrect).length / relevant.length;
  const weakness = relevant.length >= 3 ? (1 - accuracy) * 74 : 0;
  const latest = relevant[relevant.length - 1];
  const dueBoost = latest && input.now - latest.timestamp >= 3 * 86_400_000 ? 13 : 0;

  const completions = input.activityHistory.filter((entry) => entry.sceneId === mode.scene);
  const latestCompletion = completions[completions.length - 1];
  const ageDays = latestCompletion ? Math.max(0, (input.now - latestCompletion.completedAt) / 86_400_000) : 20;
  const novelty = latestCompletion ? Math.min(24, ageDays * 2.4) : Math.max(8, 32 - mode.sequence * 1.7);

  const recentScenes = input.activityHistory.slice(-5).map((entry) => entry.sceneId).reverse();
  const recentIndex = recentScenes.indexOf(mode.scene);
  const repeatPenalty = recentIndex < 0 ? 0 : Math.max(10, 58 - recentIndex * 12);
  const rotation = stableFraction(`${input.dayKey}:${mode.scene}`) * 3;
  return weakness + dueBoost + novelty + rotation - repeatPenalty - completions.length * 0.8;
}

export function attemptMatchesMode(attempt: AttemptLog, mode: PlayMode): boolean {
  if (mode.levelIds?.includes(attempt.levelId)) return true;
  if (mode.challengeTypes?.includes(attempt.challengeType)) return true;
  if (mode.targetPrefixes?.length && attempt.targetKey) {
    return mode.targetPrefixes.some((prefix) => attempt.targetKey?.startsWith(prefix));
  }
  if (mode.skills?.length) return mode.skills.includes(attempt.skill);
  return Boolean(mode.domain && attempt.domain === mode.domain);
}

function stableFraction(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}
