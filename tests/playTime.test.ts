import { describe, expect, it } from "vitest";
import {
  DEFAULT_DAILY_PLAY_MINUTES,
  dailyPlayTimeStatus,
  defaultDailyPlayTime,
  normalizeDailyPlayMinutes,
  normalizeDailyPlayTime,
  playTimeDayKey,
  roundedPlayMinutes
} from "../src/gameplay/session/playTime";

const NOW = new Date(2026, 6, 13, 12, 0, 0).getTime();

describe("profile-local daily play time", () => {
  it("uses a conservative default and normalizes parent choices", () => {
    expect(DEFAULT_DAILY_PLAY_MINUTES).toBe(20);
    expect(normalizeDailyPlayMinutes(undefined)).toBe(20);
    expect(normalizeDailyPlayMinutes(14)).toBe(15);
    expect(normalizeDailyPlayMinutes(29)).toBe(30);
    expect(normalizeDailyPlayMinutes(0)).toBe(0);
  });

  it("resets elapsed time, bonus and reward at the local day boundary", () => {
    const yesterday = new Date(2026, 6, 12, 23, 59, 0).getTime();
    const saved = {
      dayKey: playTimeDayKey(yesterday),
      usedMs: 18 * 60_000,
      bonusMs: 10 * 60_000,
      restRewardClaimed: true
    };
    expect(normalizeDailyPlayTime(saved, NOW)).toEqual(defaultDailyPlayTime(NOW));
  });

  it("reaches the configured limit and lets a parent bonus extend it", () => {
    const settings = { dailyPlayMinutes: 20 };
    const saved = { ...defaultDailyPlayTime(NOW), usedMs: 20 * 60_000 };
    expect(dailyPlayTimeStatus(settings, saved, NOW)).toMatchObject({ reached: true, remainingMs: 0 });

    saved.bonusMs = 10 * 60_000;
    expect(dailyPlayTimeStatus(settings, saved, NOW)).toMatchObject({ reached: false, remainingMs: 10 * 60_000 });
  });

  it("keeps tracking useful statistics when a parent disables the limit", () => {
    const saved = { ...defaultDailyPlayTime(NOW), usedMs: 42 * 60_000 };
    expect(dailyPlayTimeStatus({ dailyPlayMinutes: 0 }, saved, NOW)).toMatchObject({
      usedMs: 42 * 60_000,
      limitMs: null,
      remainingMs: null,
      reached: false,
      unlimited: true
    });
  });

  it("includes unpersisted foreground time and formats child-facing minutes", () => {
    const saved = { ...defaultDailyPlayTime(NOW), usedMs: 19 * 60_000 + 50_000 };
    expect(dailyPlayTimeStatus({ dailyPlayMinutes: 20 }, saved, NOW, 10_000).reached).toBe(true);
    expect(roundedPlayMinutes(0)).toBe(0);
    expect(roundedPlayMinutes(31_000)).toBe(1);
    expect(roundedPlayMinutes(19 * 60_000 + 40_000)).toBe(20);
  });
});
