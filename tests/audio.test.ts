import { describe, expect, it, vi } from "vitest";
import { soundPattern, type SoundCue } from "../src/game/AudioManager";
import { HapticManager, hapticPattern } from "../src/game/HapticManager";
import { existsSync, readFileSync } from "node:fs";
import { PHONICS_WORDS } from "../src/education/literacy/phonics";
import { READING_PHONEMES, READING_WORD_CLIPS, readingInventoryIssues } from "../src/education/literacy/phonemeInventory";
import { VOICE_LINE_BASE_PATH, VOICE_LINE_SLUGS, voiceLineSlug } from "../src/game/voiceLineManifest";

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

  it("adds a sparkly golden-round jingle and a triumphant boss-defeat stinger", () => {
    for (const cue of ["golden", "boss-defeat"] as SoundCue[]) {
      const pattern = soundPattern(cue);
      expect(pattern.length, cue).toBeGreaterThanOrEqual(4);
      expect(pattern.every((step) => step.frequency > 0 && step.duration > 0 && step.gain > 0 && step.gain <= 0.08)).toBe(true);
    }
    // Golden climbs to a bright sparkle; the boss stinger resolves upward too.
    const golden = soundPattern("golden");
    expect(golden[golden.length - 1].frequency).toBeGreaterThan(golden[0].frequency);
    expect(Math.max(...golden.map((s) => s.frequency))).toBeGreaterThan(1500);
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
    haptics.setSettings({ speed: 1, muted: false, music: true, sound: true, haptics: false, highContrast: false, voice: true });
    haptics.play("snap");
    expect(vibrate).not.toHaveBeenCalled();

    haptics.setSettings({ speed: 1, muted: false, music: true, sound: true, haptics: true, highContrast: false, voice: true });
    haptics.play("snap");
    expect(vibrate).toHaveBeenCalledWith([...hapticPattern("snap")]);

    Object.defineProperty(navigator, "vibrate", { configurable: true, value: originalVibrate });
  });
});

describe("local Hestia voice-pack", () => {
  it("maps high-frequency spoken lines to local MP3 clips", () => {
    expect(VOICE_LINE_BASE_PATH).toBe("/audio/voice/nl/hestia/");
    for (const text of ["Goed zo!", "Bijna! Probeer nog eens.", "vijf", "Zoem de klanken samen. Welk plaatje is het?"]) {
      const slug = voiceLineSlug(text);
      expect(VOICE_LINE_SLUGS.has(slug), text).toBe(true);
      expect(existsSync(`public/audio/voice/nl/hestia/${slug}.mp3`), text).toBe(true);
    }
    expect(VOICE_LINE_SLUGS.size).toBeGreaterThan(700);
  });
});

describe("browser reading audio path", () => {
  it("covers every current reading letter, phoneme unit, and word in the didactic inventory", () => {
    expect(readingInventoryIssues()).toEqual([]);
    expect(READING_PHONEMES.length).toBeGreaterThanOrEqual(30);
    expect(READING_WORD_CLIPS.map((clip) => clip.word).sort()).toEqual(PHONICS_WORDS.map((word) => word.word).sort());
    expect(existsSync("public/audio/reading/nl/hestia")).toBe(false);
  });

  it("routes isolated letters and zoemend lezen through the browser-only ReadingAudioManager", () => {
    const sources = [
      "src/scenes/minigames/KlankgrotScene.ts",
      "src/scenes/minigames/LetterkompasScene.ts",
      "src/scenes/minigames/ZoemrouteScene.ts",
      "src/scenes/minigames/WoordbouwplaatsScene.ts"
    ]
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(sources).toContain("readingAudio.playPhonemeSequence");
    expect(sources).toContain("readingAudio.playPhoneme");
    expect(sources).toContain("readingAudio.playZoemWord");
    expect(sources).not.toContain("voice.speak(unit");
    expect(sources).not.toContain('units.join("... ")');

    // Browser-only: generated Hestia sentence clips are good for full prompts,
    // but were rejected for isolated letters and zoemend lezen.
    const managerSource = readFileSync("src/game/ReadingAudioManager.ts", "utf8");
    expect(managerSource).toContain("speakBrowserOnly");
    expect(managerSource).toContain("browser speech");
    expect(managerSource).not.toContain("VOICE_LINE_SLUGS");
    expect(managerSource).not.toContain("voiceLineFile");
    expect(managerSource).not.toContain("new Audio(");
    expect(managerSource).not.toContain("readingAudioManifest");
  });
});
