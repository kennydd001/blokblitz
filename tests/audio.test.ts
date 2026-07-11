import { describe, expect, it, vi } from "vitest";
import { soundPattern, type SoundCue } from "../src/game/AudioManager";
import { HapticManager, hapticPattern } from "../src/game/HapticManager";
import { existsSync, readFileSync } from "node:fs";
import { PHONICS_WORDS } from "../src/education/literacy/phonics";
import { READING_PHONEMES, READING_WORD_CLIPS, readingInventoryIssues } from "../src/education/literacy/phonemeInventory";
import { READING_PHONEME_BASE_PATH, READING_PHONEME_FILES, READING_PHONEME_KEYS } from "../src/game/readingAudioManifest";
import { VOICE_LINE_BASE_PATH, VOICE_LINE_SLUGS, voiceLineFile, voiceLineSlug } from "../src/game/voiceLineManifest";
import { CURRENT_VOICE_LINE_CATALOG } from "../src/game/voiceLineCatalog";

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

describe("local ElevenLabs voice-pack", () => {
  it("maps high-frequency spoken lines to local MP3 clips", () => {
    expect(VOICE_LINE_BASE_PATH).toBe("/audio/voice/nl/elevenlabs-lily-v3/");
    for (const text of ["Goed zo!", "Bijna! Probeer nog eens.", "vijf", "Zoem de klanken samen. Welk plaatje is het?"]) {
      const slug = voiceLineSlug(text);
      expect(VOICE_LINE_SLUGS.has(slug), text).toBe(true);
      expect(existsSync(`public/audio/voice/nl/elevenlabs-lily-v3/${slug}.mp3`), text).toBe(true);
    }
    const requiredSlugs = new Set(CURRENT_VOICE_LINE_CATALOG.map((line) => voiceLineSlug(line.text)));
    expect(VOICE_LINE_SLUGS.size).toBeGreaterThanOrEqual(requiredSlugs.size);
    for (const slug of requiredSlugs) {
      expect(VOICE_LINE_SLUGS.has(slug), slug).toBe(true);
      expect(existsSync(`public/audio/voice/nl/elevenlabs-lily-v3/${voiceLineFile(slug)}`), slug).toBe(true);
    }
  });

  it("queues local clips and only starts the next line after the active one ends", async () => {
    const originalAudio = globalThis.Audio;
    const originalUserAgent = navigator.userAgent;

    class FakeAudio {
      static instances: FakeAudio[] = [];
      preload = "";
      playbackRate = 1;
      currentTime = 0;
      paused = false;
      playCount = 0;
      private readonly listeners = new Map<string, () => void>();

      constructor(readonly src: string) {
        FakeAudio.instances.push(this);
      }

      addEventListener(type: string, listener: () => void): void {
        this.listeners.set(type, listener);
      }

      play(): Promise<void> {
        this.paused = false;
        this.playCount += 1;
        return Promise.resolve();
      }

      pause(): void {
        this.paused = true;
      }

      end(): void {
        this.listeners.get("ended")?.();
      }
    }

    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Chrome" });
    Object.defineProperty(globalThis, "Audio", { configurable: true, value: FakeAudio });

    try {
      const { VoiceManager } = await import("../src/game/VoiceManager");
      const voice = new VoiceManager();
      voice.speak("Goed zo!", { interrupt: true });
      voice.speak("Knap!", { interrupt: false });
      expect(FakeAudio.instances).toHaveLength(1);

      FakeAudio.instances[0].end();
      expect(FakeAudio.instances).toHaveLength(2);

      voice.speak("Super!", { interrupt: true });
      expect(FakeAudio.instances[1].paused).toBe(true);
      expect(FakeAudio.instances).toHaveLength(3);

      const completed = vi.fn();
      voice.speakThen("Wauw!", completed, { interrupt: false });
      expect(FakeAudio.instances).toHaveLength(3);
      FakeAudio.instances[2].end();
      expect(FakeAudio.instances).toHaveLength(4);
      expect(completed).not.toHaveBeenCalled();
      FakeAudio.instances[3].end();
      expect(completed).toHaveBeenCalledTimes(1);

      voice.speak("Goed zo!", { interrupt: true });
      const activePraiseBase = FakeAudio.instances[4];
      voice.praise();
      expect(activePraiseBase.paused).toBe(false);
      expect(FakeAudio.instances).toHaveLength(5);
      activePraiseBase.end();
      expect(FakeAudio.instances).toHaveLength(6);

      const activePraise = FakeAudio.instances[5];
      activePraise.currentTime = 0.25;
      voice.pause();
      expect(activePraise.paused).toBe(true);
      voice.resume();
      expect(activePraise.paused).toBe(false);
      expect(activePraise.playCount).toBe(2);
      expect(activePraise.currentTime).toBe(0.25);

      const mutedCompletion = vi.fn();
      voice.setEnabled(false);
      voice.speakThen("Knap!", mutedCompletion);
      expect(mutedCompletion).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(navigator, "userAgent", { configurable: true, value: originalUserAgent });
      Object.defineProperty(globalThis, "Audio", { configurable: true, value: originalAudio });
    }
  });
});

describe("reading audio path", () => {
  it("covers every current reading letter, phoneme unit, and word in the didactic inventory", () => {
    expect(readingInventoryIssues()).toEqual([]);
    expect(READING_PHONEMES.length).toBeGreaterThanOrEqual(30);
    expect(READING_WORD_CLIPS.map((clip) => clip.word).sort()).toEqual(PHONICS_WORDS.map((word) => word.word).sort());
    expect(READING_PHONEME_BASE_PATH).toBe("/audio/reading/nl/elevenlabs-lily-v3/phonemes/");
    expect(READING_PHONEME_KEYS.size).toBe(READING_PHONEMES.length);
    for (const phoneme of READING_PHONEMES) {
      expect(READING_PHONEME_KEYS.has(phoneme.key), phoneme.key).toBe(true);
      expect(existsSync(`public/audio/reading/nl/elevenlabs-lily-v3/phonemes/${READING_PHONEME_FILES[phoneme.key]}`), phoneme.key).toBe(true);
    }
  });

  it("routes isolated letters and whole words through local audio without browser speech", () => {
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

    // Isolated phonemes use the dedicated pack. Whole words use the same local
    // Lily queue as sentence voice, at a slower playback rate.
    const managerSource = readFileSync("src/game/ReadingAudioManager.ts", "utf8");
    expect(managerSource).toContain("READING_PHONEME_FILES");
    expect(managerSource).toContain("playLocalFile");
    expect(managerSource).toContain("this.voice.speak(word, options)");
    expect(managerSource).not.toContain("speakBrowserOnly");
    expect(managerSource).not.toContain("speechSynthesis");

    const voiceSource = readFileSync("src/game/VoiceManager.ts", "utf8");
    expect(voiceSource).not.toContain("speechSynthesis");
    expect(voiceSource).not.toContain("SpeechSynthesisUtterance");
  });
});
