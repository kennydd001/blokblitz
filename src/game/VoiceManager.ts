import type { GameSettings } from "../education/types";
import { VOICE_LINE_BASE_PATH, VOICE_LINE_SLUGS, voiceLineFile, voiceLineSlug } from "./voiceLineManifest";

// Spoken Dutch helper. For a 4-7 year old who can't read yet, hearing the task
// ("Tik de grootste!"), the count ("een... twee... drie...") and warm praise is
// the single biggest clarity win. Prefer local Hestia clips; fall back to Web
// Speech only for dynamic lines that were not pre-generated.

const NUMBER_WORDS = [
  "nul",
  "\u00e9\u00e9n",
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

type SpeechSynth = typeof window.speechSynthesis;

export class VoiceManager {
  private enabled = true;
  private praiseIndex = 0;
  private countTimers: number[] = [];
  private activeAudio = new Set<HTMLAudioElement>();
  private duckHook?: (durationMs: number) => void;

  setSettings(settings: GameSettings): void {
    this.enabled = settings.voice;
    if (!this.enabled) this.cancel();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  /** Hook so the audio engine can duck music/SFX while the voice speaks. */
  setDuckHook(fn: (durationMs: number) => void): void {
    this.duckHook = fn;
  }

  private get synth(): SpeechSynth | undefined {
    if (typeof window === "undefined") return undefined;
    return window.speechSynthesis;
  }

  private pickVoice(synth: SpeechSynth): SpeechSynthesisVoice | undefined {
    const voices = synth.getVoices?.() ?? [];
    return voices.find((v) => /^nl/i.test(v.lang)) ?? voices.find((v) => /dutch|nederlands/i.test(v.name));
  }

  private stopCurrentSpeech(): void {
    for (const audio of this.activeAudio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    }
    this.activeAudio.clear();
    try {
      this.synth?.cancel();
    } catch {
      // ignore
    }
  }

  private speakBrowser(text: string, options: { interrupt?: boolean; rate?: number; pitch?: number } = {}): void {
    const synth = this.synth;
    if (!this.enabled || !synth || typeof SpeechSynthesisUtterance === "undefined") return;
    try {
      this.duckHook?.(text.length * 65 + 450);
      if (options.interrupt) this.stopCurrentSpeech();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "nl-NL";
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = options.pitch ?? 1.12;
      utterance.volume = 1;
      const voice = this.pickVoice(synth);
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    } catch {
      // Speech is a best-effort enhancement; never let it break gameplay.
    }
  }

  private playLocalClip(text: string, options: { interrupt?: boolean; rate?: number; pitch?: number } = {}): boolean {
    if (typeof Audio === "undefined") return false;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return false;
    const slug = voiceLineSlug(text);
    if (!VOICE_LINE_SLUGS.has(slug)) return false;

    try {
      if (options.interrupt) this.stopCurrentSpeech();
      this.duckHook?.(text.length * 70 + 550);
      const audio = new Audio(`${VOICE_LINE_BASE_PATH}${voiceLineFile(slug)}`);
      audio.preload = "auto";
      audio.playbackRate = Math.max(0.55, Math.min(1.35, options.rate ?? 1));
      this.activeAudio.add(audio);
      const cleanup = () => this.activeAudio.delete(audio);
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener(
        "error",
        () => {
          cleanup();
          this.speakBrowser(text, options);
        },
        { once: true }
      );
      void audio.play().catch(() => {
        cleanup();
        this.speakBrowser(text, options);
      });
      return true;
    } catch {
      return false;
    }
  }

  speak(text: string, options: { interrupt?: boolean; rate?: number; pitch?: number } = {}): void {
    if (!this.enabled) return;
    if (this.playLocalClip(text, options)) return;
    this.speakBrowser(text, options);
  }

  /** Speak dynamic/didactic text with the browser voice, bypassing pre-generated Hestia clips. */
  speakBrowserOnly(text: string, options: { interrupt?: boolean; rate?: number; pitch?: number } = {}): void {
    if (!this.enabled) return;
    this.speakBrowser(text, options);
  }

  /** Speak a number 0-20 as a Dutch word. */
  sayNumber(n: number, options: { interrupt?: boolean } = {}): void {
    const word = NUMBER_WORDS[Math.max(0, Math.min(20, Math.round(n)))];
    this.speak(word, { rate: 1, ...options });
  }

  /** Count out loud from 1 to n with a clear, spaced rhythm so each number is distinct. */
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
    for (const id of this.countTimers) window.clearTimeout(id);
    this.countTimers = [];
    this.stopCurrentSpeech();
  }
}

export function praiseWord(index: number): string {
  return PRAISE[Math.abs(index) % PRAISE.length];
}

export function numberWord(n: number): string {
  return NUMBER_WORDS[Math.max(0, Math.min(20, Math.round(n)))];
}
