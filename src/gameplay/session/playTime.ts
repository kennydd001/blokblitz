import type { DailyPlayTime, GameSettings } from "../../education/types";

export const DEFAULT_DAILY_PLAY_MINUTES = 20;
export const DAILY_PLAY_MINUTE_OPTIONS = [10, 15, 20, 30, 0] as const;
export const EXTRA_PLAY_MINUTES = 10;
export const REST_REWARD_STARS = 3;

export interface PlayTimeStatus {
  dayKey: string;
  usedMs: number;
  bonusMs: number;
  limitMs: number | null;
  remainingMs: number | null;
  reached: boolean;
  unlimited: boolean;
}

function finiteNonNegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function playTimeDayKey(now = Date.now()): string {
  const date = new Date(now);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeDailyPlayMinutes(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_DAILY_PLAY_MINUTES;
  if (value <= 0) return 0;
  const timed = DAILY_PLAY_MINUTE_OPTIONS.filter((minutes) => minutes > 0);
  return timed.reduce((closest, minutes) =>
    Math.abs(minutes - value) < Math.abs(closest - value) ? minutes : closest
  , DEFAULT_DAILY_PLAY_MINUTES);
}

export function defaultDailyPlayTime(now = Date.now()): DailyPlayTime {
  return {
    dayKey: playTimeDayKey(now),
    usedMs: 0,
    bonusMs: 0,
    restRewardClaimed: false
  };
}

export function normalizeDailyPlayTime(value: unknown, now = Date.now()): DailyPlayTime {
  const dayKey = playTimeDayKey(now);
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultDailyPlayTime(now);
  const saved = value as Partial<DailyPlayTime>;
  if (saved.dayKey !== dayKey) return defaultDailyPlayTime(now);
  return {
    dayKey,
    usedMs: finiteNonNegative(saved.usedMs),
    bonusMs: finiteNonNegative(saved.bonusMs),
    restRewardClaimed: saved.restRewardClaimed === true
  };
}

export function dailyPlayTimeStatus(
  settings: Pick<GameSettings, "dailyPlayMinutes">,
  value: unknown,
  now = Date.now(),
  pendingMs = 0
): PlayTimeStatus {
  const playTime = normalizeDailyPlayTime(value, now);
  const dailyMinutes = normalizeDailyPlayMinutes(settings.dailyPlayMinutes);
  const usedMs = playTime.usedMs + finiteNonNegative(pendingMs);
  if (dailyMinutes === 0) {
    return {
      dayKey: playTime.dayKey,
      usedMs,
      bonusMs: playTime.bonusMs,
      limitMs: null,
      remainingMs: null,
      reached: false,
      unlimited: true
    };
  }
  const limitMs = dailyMinutes * 60_000 + playTime.bonusMs;
  return {
    dayKey: playTime.dayKey,
    usedMs,
    bonusMs: playTime.bonusMs,
    limitMs,
    remainingMs: Math.max(0, limitMs - usedMs),
    reached: usedMs >= limitMs,
    unlimited: false
  };
}

export function roundedPlayMinutes(milliseconds: number): number {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 0;
  return Math.max(1, Math.round(milliseconds / 60_000));
}
