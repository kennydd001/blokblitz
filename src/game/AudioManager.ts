import type { GameSettings } from "../education/types";

export type SoundCue = "success" | "snap" | "rescue" | "soft-error" | "build";

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

export class AudioManager {
  private context?: AudioContext;
  private muted = false;

  setSettings(settings: GameSettings): void {
    this.muted = settings.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  play(name: SoundCue): void {
    const AudioContextCtor = getAudioContextConstructor();
    if (this.muted || !AudioContextCtor) return;
    const context = this.context ?? new AudioContextCtor();
    this.context = context;

    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }

    const now = context.currentTime;
    soundPattern(name).forEach((step) => {
      const start = now + step.start;
      const end = start + step.duration;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(step.gain, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      gain.connect(context.destination);

      const osc = context.createOscillator();
      osc.type = step.wave;
      osc.frequency.setValueAtTime(step.frequency, start);
      osc.connect(gain);
      osc.start(start);
      osc.stop(end + 0.02);
    });
  }
}
