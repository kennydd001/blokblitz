import type { GameSettings } from "../education/types";
import { VOICE_LINE_BASE_PATH, VOICE_LINE_SLUGS, voiceLineFile, voiceLineSlug } from "./voiceLineManifest";

// All spoken gameplay audio is local. One shared queue prevents ordinary voice,
// rewards, stories and reading clips from ever talking over one another.

const NUMBER_WORDS = [
  "nul",
  "één",
  "twee",
  "drie",
  "vier",
  "vijf",
  "zes",
  "zeven",
  "acht",
  "negen",
  "tien",
  "elf",
  "twaalf",
  "dertien",
  "veertien",
  "vijftien",
  "zestien",
  "zeventien",
  "achttien",
  "negentien",
  "twintig"
];
const PRAISE = ["Goed zo!", "Knap!", "Super!", "Wauw!", "Yes!", "Top!", "Hoera!", "Heel goed!"];
const ENCOURAGE = ["Bijna! Probeer nog eens.", "Tel rustig mee.", "Kijk nog eens goed.", "Je kan het!"];

export interface VoicePlaybackOptions {
  interrupt?: boolean;
  rate?: number;
  pitch?: number;
}

interface QueuedClip {
  src: string;
  label: string;
  rate: number;
}

export class VoiceManager {
  private enabled = true;
  private praiseIndex = 0;
  private countTimers: number[] = [];
  private queue: QueuedClip[] = [];
  private activeAudio?: HTMLAudioElement;
  private duckHook?: (durationMs: number) => void;
  private readonly missingWarnings = new Set<string>();

  setSettings(settings: GameSettings): void {
    this.enabled = settings.voice;
    if (!this.enabled) this.cancel();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  setDuckHook(fn: (durationMs: number) => void): void {
    this.duckHook = fn;
  }

  /** Queue any approved local clip on the same channel as sentence voice. */
  playLocalFile(src: string, label: string, options: VoicePlaybackOptions = {}): boolean {
    if (!this.enabled || typeof Audio === "undefined") return false;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return false;
    if (options.interrupt) this.interruptPlayback();
    this.queue.push({
      src,
      label,
      rate: Math.max(0.55, Math.min(1.35, options.rate ?? 1))
    });
    this.playNext();
    return true;
  }

  speak(text: string, options: VoicePlaybackOptions = {}): void {
    if (!this.enabled) return;
    const slug = voiceLineSlug(text);
    if (!VOICE_LINE_SLUGS.has(slug)) {
      if (options.interrupt) this.interruptPlayback();
      this.reportMissingClip(text);
      return;
    }
    this.playLocalFile(`${VOICE_LINE_BASE_PATH}${voiceLineFile(slug)}`, text, options);
  }

  sayNumber(n: number, options: { interrupt?: boolean } = {}): void {
    const word = NUMBER_WORDS[Math.max(0, Math.min(20, Math.round(n)))];
    this.speak(word, { rate: 1, ...options });
  }

  /** Count 1..n; each number waits for the previous local clip to finish. */
  countTo(n: number): void {
    if (!this.enabled) return;
    const count = Math.max(1, Math.min(10, Math.round(n)));
    this.cancel();
    for (let i = 1; i <= count; i += 1) {
      this.countTimers.push(window.setTimeout(() => this.sayNumber(i, { interrupt: false }), (i - 1) * 430));
    }
  }

  praise(): void {
    this.praiseIndex = (this.praiseIndex + 1) % PRAISE.length;
    this.speak(PRAISE[this.praiseIndex], { interrupt: true, rate: 1.02, pitch: 1.2 });
  }

  encourage(): void {
    this.speak(ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)], { interrupt: true });
  }

  cancel(): void {
    this.clearCountTimers();
    this.stopAudio();
  }

  private playNext(): void {
    if (!this.enabled || this.activeAudio || this.queue.length === 0) return;
    const request = this.queue.shift();
    if (!request) return;

    try {
      const audio = new Audio(request.src);
      this.activeAudio = audio;
      audio.preload = "auto";
      audio.playbackRate = request.rate;
      this.duckHook?.(request.label.length * 70 + 550);

      const finish = (): void => {
        if (this.activeAudio !== audio) return;
        this.activeAudio = undefined;
        this.playNext();
      };
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      void audio.play().catch(finish);
    } catch {
      this.activeAudio = undefined;
      this.playNext();
    }
  }

  private interruptPlayback(): void {
    this.clearCountTimers();
    this.stopAudio();
  }

  private clearCountTimers(): void {
    for (const id of this.countTimers) window.clearTimeout(id);
    this.countTimers = [];
  }

  private stopAudio(): void {
    this.queue = [];
    const audio = this.activeAudio;
    this.activeAudio = undefined;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Audio teardown is best-effort during a fast scene switch.
    }
  }

  private reportMissingClip(text: string): void {
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return;
    const slug = voiceLineSlug(text);
    if (this.missingWarnings.has(slug)) return;
    this.missingWarnings.add(slug);
    console.warn(`[VoiceManager] Missing local voice clip: ${text}`);
  }
}

export function praiseWord(index: number): string {
  return PRAISE[Math.abs(index) % PRAISE.length];
}

export function numberWord(n: number): string {
  return NUMBER_WORDS[Math.max(0, Math.min(20, Math.round(n)))];
}
