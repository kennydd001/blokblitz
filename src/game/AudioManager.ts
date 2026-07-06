import type { GameSettings } from "../education/types";

export type SoundCue =
  | "success"
  | "snap"
  | "rescue"
  | "soft-error"
  | "build"
  | "coin"
  | "jump"
  | "boost"
  | "win"
  | "stumble"
  | "start-race"
  | "golden"
  | "boss-defeat";

export interface SoundStep {
  frequency: number;
  start: number;
  duration: number;
  gain: number;
  wave: OscillatorType;
}

const cuePatterns: Record<SoundCue, readonly SoundStep[]> = {
  success: [
    { frequency: 523, start: 0, duration: 0.12, gain: 0.055, wave: "sine" },
    { frequency: 659, start: 0.07, duration: 0.14, gain: 0.065, wave: "sine" },
    { frequency: 784, start: 0.14, duration: 0.18, gain: 0.07, wave: "sine" }
  ],
  snap: [
    { frequency: 784, start: 0, duration: 0.07, gain: 0.06, wave: "triangle" },
    { frequency: 988, start: 0.04, duration: 0.07, gain: 0.065, wave: "triangle" },
    { frequency: 1175, start: 0.08, duration: 0.09, gain: 0.07, wave: "sine" },
    { frequency: 1568, start: 0.15, duration: 0.2, gain: 0.06, wave: "sine" }
  ],
  rescue: [
    { frequency: 392, start: 0, duration: 0.16, gain: 0.05, wave: "sine" },
    { frequency: 523, start: 0.09, duration: 0.2, gain: 0.065, wave: "sine" },
    { frequency: 659, start: 0.18, duration: 0.24, gain: 0.07, wave: "sine" }
  ],
  "soft-error": [
    { frequency: 220, start: 0, duration: 0.13, gain: 0.035, wave: "triangle" },
    { frequency: 196, start: 0.1, duration: 0.18, gain: 0.03, wave: "triangle" },
    { frequency: 165, start: 0.22, duration: 0.22, gain: 0.025, wave: "sine" }
  ],
  build: [
    { frequency: 247, start: 0, duration: 0.09, gain: 0.045, wave: "triangle" },
    { frequency: 330, start: 0.08, duration: 0.1, gain: 0.055, wave: "triangle" },
    { frequency: 392, start: 0.16, duration: 0.12, gain: 0.06, wave: "sine" },
    { frequency: 494, start: 0.24, duration: 0.18, gain: 0.055, wave: "sine" }
  ],
  // A bright two-note ring pickup, like collecting a coin on the run.
  coin: [
    { frequency: 988, start: 0, duration: 0.06, gain: 0.05, wave: "triangle" },
    { frequency: 1319, start: 0.05, duration: 0.1, gain: 0.05, wave: "sine" }
  ],
  // A quick upward hop.
  jump: [
    { frequency: 392, start: 0, duration: 0.05, gain: 0.045, wave: "sine" },
    { frequency: 659, start: 0.05, duration: 0.1, gain: 0.04, wave: "sine" }
  ],
  // A rising speed-boost sweep.
  boost: [
    { frequency: 523, start: 0, duration: 0.07, gain: 0.05, wave: "sawtooth" },
    { frequency: 784, start: 0.06, duration: 0.08, gain: 0.05, wave: "sawtooth" },
    { frequency: 1047, start: 0.13, duration: 0.12, gain: 0.05, wave: "triangle" }
  ],
  // A short triumphant fanfare for the end-of-run celebration.
  win: [
    { frequency: 523, start: 0, duration: 0.12, gain: 0.06, wave: "sine" },
    { frequency: 659, start: 0.11, duration: 0.12, gain: 0.065, wave: "sine" },
    { frequency: 784, start: 0.22, duration: 0.14, gain: 0.07, wave: "sine" },
    { frequency: 1047, start: 0.36, duration: 0.26, gain: 0.07, wave: "triangle" }
  ],
  // A soft, friendly bonk for a stumble. Never harsh.
  stumble: [
    { frequency: 196, start: 0, duration: 0.1, gain: 0.04, wave: "triangle" },
    { frequency: 147, start: 0.09, duration: 0.16, gain: 0.035, wave: "sine" }
  ],
  // A bright rising "GO!" for the start of a run — distinct from the in-game boost.
  "start-race": [
    { frequency: 440, start: 0, duration: 0.1, gain: 0.05, wave: "square" },
    { frequency: 587, start: 0.1, duration: 0.1, gain: 0.055, wave: "square" },
    { frequency: 880, start: 0.2, duration: 0.22, gain: 0.07, wave: "triangle" }
  ],
  // A sparkly ascending arpeggio that says "this round is special" — plays when
  // a golden bonus round opens.
  golden: [
    { frequency: 784, start: 0, duration: 0.08, gain: 0.05, wave: "triangle" },
    { frequency: 988, start: 0.08, duration: 0.08, gain: 0.055, wave: "triangle" },
    { frequency: 1319, start: 0.16, duration: 0.09, gain: 0.06, wave: "sine" },
    { frequency: 1568, start: 0.26, duration: 0.14, gain: 0.06, wave: "sine" },
    { frequency: 2093, start: 0.4, duration: 0.2, gain: 0.05, wave: "sine" }
  ],
  // A triumphant descending-then-rising stinger for beating a region boss.
  "boss-defeat": [
    { frequency: 330, start: 0, duration: 0.14, gain: 0.06, wave: "sawtooth" },
    { frequency: 494, start: 0.14, duration: 0.14, gain: 0.06, wave: "triangle" },
    { frequency: 659, start: 0.28, duration: 0.16, gain: 0.07, wave: "sine" },
    { frequency: 988, start: 0.46, duration: 0.3, gain: 0.07, wave: "sine" }
  ]
};

type AudioContextConstructor = new () => AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof AudioContext !== "undefined") return AudioContext;
  if (typeof window === "undefined") return undefined;
  return (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
}

export function soundPattern(name: SoundCue): readonly SoundStep[] {
  return cuePatterns[name];
}

// Per-world (and hub) looping melodies + bass — fully procedural, no audio files.
// Each world gets its own key/tempo so unlocking a new world also sounds new.
interface MusicVariant {
  melody: number[];
  bass: number[];
  step: number;
}
const MUSIC_VARIANTS: Record<string, MusicVariant> = {
  hub: { melody: [523, 587, 659, 587, 523, 659, 784, 659], bass: [131, 131, 196, 196], step: 300 },
  default: { melody: [523, 659, 784, 880, 784, 659, 587, 659, 698, 784, 880, 988, 880, 784, 659, 587], bass: [131, 131, 165, 165, 147, 147, 196, 196], step: 220 },
  grasland: { melody: [523, 659, 784, 659, 587, 698, 880, 698, 659, 784, 988, 784, 659, 587, 523, 587], bass: [131, 131, 175, 175, 147, 147, 196, 196], step: 235 },
  muntgrot: { melody: [494, 587, 740, 587, 659, 784, 988, 784, 587, 740, 880, 740, 587, 494, 440, 494], bass: [123, 123, 165, 165, 147, 147, 185, 185], step: 215 },
  ijsbaan: { melody: [659, 784, 988, 1175, 988, 784, 880, 784, 659, 880, 1047, 880, 784, 659, 587, 659], bass: [165, 165, 196, 196, 220, 220, 175, 175], step: 240 },
  webwoud: { melody: [440, 523, 659, 523, 587, 698, 587, 494, 440, 587, 698, 587, 523, 440, 392, 440], bass: [110, 110, 147, 147, 131, 131, 165, 165], step: 250 },
  bouwdorp: { melody: [523, 523, 659, 784, 659, 523, 587, 587, 698, 784, 698, 587, 659, 523, 523, 392], bass: [131, 131, 165, 165, 175, 175, 147, 147], step: 210 },
  sterrenrace: { melody: [659, 880, 988, 1175, 988, 880, 784, 880, 988, 1175, 1319, 1175, 988, 784, 659, 784], bass: [165, 165, 220, 220, 196, 196, 247, 247], step: 190 }
};

export class AudioManager {
  private context?: AudioContext;
  // Independent so a parent can keep the sound effects but silence the music
  // (or vice versa) on a tablet. `muted` remains a legacy master.
  private musicOn = true;
  private soundOn = true;
  private musicTimer?: ReturnType<typeof setInterval>;
  private musicStep = 0;
  private musicVariant = "";
  private music: MusicVariant = MUSIC_VARIANTS.default;
  private duckGain = 1;
  private duckTimer?: ReturnType<typeof setTimeout>;

  setSettings(settings: GameSettings): void {
    this.musicOn = settings.music ?? !settings.muted;
    this.soundOn = settings.sound ?? !settings.muted;
    if (!this.musicOn) this.stopMusic();
  }

  /** Legacy master mute: silences both music and effects. */
  setMuted(muted: boolean): void {
    this.musicOn = !muted;
    this.soundOn = !muted;
    if (muted) this.stopMusic();
  }

  play(name: SoundCue): void {
    const AudioContextCtor = getAudioContextConstructor();
    if (!this.soundOn || !AudioContextCtor) return;
    const context = this.context ?? new AudioContextCtor();
    this.context = context;

    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }

    const now = context.currentTime;
    soundPattern(name).forEach((step) => {
      this.note(context, step.frequency, now + step.start, step.duration, step.gain, step.wave);
    });
  }

  startMusic(variant = "default"): void {
    if (!this.musicOn) return;
    const id = MUSIC_VARIANTS[variant] ? variant : "default";
    if (this.musicTimer !== undefined && this.musicVariant === id) return; // already playing this theme
    this.stopMusic();
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) return;
    const context = this.context ?? new AudioContextCtor();
    this.context = context;
    if (context.state === "suspended") void context.resume().catch(() => undefined);
    this.musicVariant = id;
    this.music = MUSIC_VARIANTS[id];
    this.musicStep = 0;
    this.musicTimer = setInterval(() => this.musicTick(), this.music.step);
  }

  stopMusic(): void {
    if (this.musicTimer !== undefined) {
      clearInterval(this.musicTimer);
      this.musicTimer = undefined;
    }
    this.musicVariant = "";
  }

  /** Briefly lower all audio so a spoken instruction stays clear (voice ducking). */
  duck(durationMs: number): void {
    this.duckGain = 0.32;
    if (this.duckTimer !== undefined) clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.duckGain = 1;
    }, Math.max(200, durationMs));
  }

  private musicTick(): void {
    const context = this.context;
    if (!this.musicOn || !context) {
      this.stopMusic();
      return;
    }
    const now = context.currentTime;
    const melody = this.music.melody[this.musicStep % this.music.melody.length];
    this.note(context, melody, now, 0.17, 0.02, "triangle");
    if (this.musicStep % 2 === 0) {
      const bass = this.music.bass[(this.musicStep >> 1) % this.music.bass.length];
      this.note(context, bass, now, 0.34, 0.018, "sine");
    }
    this.musicStep += 1;
  }

  private note(context: AudioContext, frequency: number, start: number, duration: number, gainValue: number, wave: OscillatorType): void {
    const end = start + duration;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue * this.duckGain, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(context.destination);

    const osc = context.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, start);
    osc.connect(gain);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}
