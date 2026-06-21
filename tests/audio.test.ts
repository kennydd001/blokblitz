import { describe, expect, it, vi } from "vitest";
import { soundPattern, type SoundCue } from "../src/game/AudioManager";
import { HapticManager, hapticPattern } from "../src/game/HapticManager";

describe("procedural audio cues", () => {
  const cues: SoundCue[] = ["success", "snap", "rescue", "soft-error", "build"];

  it("defines local multi-note patterns for every gameplay cue", () => {
    for (const cue of cues) {
      const pattern = soundPattern(cue);
      expect(pattern.length, cue).toBeGreaterThanOrEqual(3);
      expect(pattern.every((step) => step.frequency > 0)).toBe(true);
      expect(pattern.every((step) => step.duration > 0)).toBe(true);
      expect(pattern.every((step) => step.gain > 0 && step.gain <= 0.08)).toBe(true);
      expect(pattern.every((step) => step.start >= 0)).toBe(true);
    }
  });

  it("keeps Snap bright, retries gentle, and build cues block-like", () => {
    const snap = soundPattern("snap");
    const retry = soundPattern("soft-error");
    const build = soundPattern("build");

    expect(Math.max(...snap.map((step) => step.frequency))).toBeGreaterThan(1200);
    expect(Math.max(...retry.map((step) => step.gain))).toBeLessThan(Math.max(...snap.map((step) => step.gain)));
    expect(retry.map((step) => step.frequency)).toEqual([...retry.map((step) => step.frequency)].sort((a, b) => b - a));
    expect(build.slice(0, 2).every((step) => step.wave === "triangle")).toBe(true);
  });
});

describe("mobile haptic cues", () => {
  const cues: SoundCue[] = ["success", "snap", "rescue", "soft-error", "build"];

  it("defines short safe vibration patterns for every gameplay cue", () => {
    for (const cue of cues) {
      const pattern = hapticPattern(cue);
      expect(pattern.length, cue).toBeGreaterThanOrEqual(1);
      expect(pattern.every((step) => step > 0 && step <= 40)).toBe(true);
      expect(pattern.reduce((total, step) => total + step, 0)).toBeLessThanOrEqual(90);
    }
  });

  it("respects the persisted haptics setting before vibrating", () => {
    const vibrate = vi.fn();
    const originalVibrate = navigator.vibrate;
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vibrate });

    const haptics = new HapticManager();
    haptics.setSettings({ speed: 1, muted: false, haptics: false, highContrast: false });
    haptics.play("snap");
    expect(vibrate).not.toHaveBeenCalled();

    haptics.setSettings({ speed: 1, muted: false, haptics: true, highContrast: false });
    haptics.play("snap");
    expect(vibrate).toHaveBeenCalledWith([...hapticPattern("snap")]);

    Object.defineProperty(navigator, "vibrate", { configurable: true, value: originalVibrate });
  });
});
