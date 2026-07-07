import type { GameSettings } from "../education/types";
import { blendFallbackText, phonemeFallbackText } from "../education/literacy/phonemeInventory";
import { READING_PHONEME_BASE_PATH, READING_PHONEME_FILES } from "./readingAudioManifest";
import type { VoiceManager } from "./VoiceManager";

type ReadingVoiceFallback = Pick<VoiceManager, "speakBrowserOnly" | "cancel">;

export interface ReadingAudioOptions {
  interrupt?: boolean;
  rate?: number;
}

/**
 * Reading audio is deliberately separate from the normal sentence voice-pack.
 * Isolated phoneme taps use a dedicated ElevenLabs pack. Zoemend lezen and
 * word-splitting remain on the separate fallback path because generated TTS did
 * not pass listening QA for stretched blends.
 */
export class ReadingAudioManager {
  private enabled = true;
  private duckHook?: (durationMs: number) => void;
  private activeAudio = new Set<HTMLAudioElement>();

  constructor(private readonly fallback?: ReadingVoiceFallback) {}

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

  playPhoneme(key: string, options: ReadingAudioOptions = {}): void {
    if (!this.enabled) return;
    if (this.playLocalPhonemeClip(key, options)) return;
    this.speakReadingText(phonemeFallbackText(key), options);
  }

  playPhonemeSequence(units: string[], options: ReadingAudioOptions = {}): void {
    if (!this.enabled || units.length === 0) return;
    this.speakReadingText(blendFallbackText(units), options);
  }

  playZoemWord(units: string[], word: string, options: ReadingAudioOptions = {}): void {
    if (!this.enabled) return;
    this.speakReadingText(blendFallbackText(units, word), options);
  }

  cancel(): void {
    this.stopLocalAudio();
    this.fallback?.cancel();
  }

  private stopLocalAudio(): void {
    for (const audio of this.activeAudio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    }
    this.activeAudio.clear();
  }

  private playLocalPhonemeClip(key: string, options: ReadingAudioOptions): boolean {
    if (typeof Audio === "undefined") return false;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return false;
    const file = READING_PHONEME_FILES[key];
    if (!file) return false;

    try {
      if (options.interrupt) {
        this.stopLocalAudio();
        this.fallback?.cancel();
      }
      const fallbackText = phonemeFallbackText(key);
      this.duckHook?.(fallbackText.length * 85 + 600);
      const audio = new Audio(`${READING_PHONEME_BASE_PATH}${file}`);
      audio.preload = "auto";
      audio.playbackRate = Math.max(0.55, Math.min(1.25, options.rate ?? 1));
      this.activeAudio.add(audio);
      const cleanup = () => this.activeAudio.delete(audio);
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener(
        "error",
        () => {
          cleanup();
          this.speakReadingText(fallbackText, options);
        },
        { once: true }
      );
      void audio.play().catch(() => {
        cleanup();
        this.speakReadingText(fallbackText, options);
      });
      return true;
    } catch {
      return false;
    }
  }

  private speakReadingText(text: string, options: ReadingAudioOptions): void {
    if (!text.trim()) return;
    const rate = options.rate ?? 0.72;
    this.duckHook?.(text.length * 85 + 600);
    this.fallback?.speakBrowserOnly(text, { interrupt: options.interrupt, rate, pitch: 1.06 });
  }
}
