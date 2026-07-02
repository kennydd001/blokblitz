import type { GameSettings } from "../education/types";
import { blendFallbackText, phonemeFallbackText } from "../education/literacy/phonemeInventory";
import type { VoiceManager } from "./VoiceManager";

type ReadingVoiceFallback = Pick<VoiceManager, "speakBrowserOnly" | "cancel">;

export interface ReadingAudioOptions {
  interrupt?: boolean;
  rate?: number;
}

export class ReadingAudioManager {
  private enabled = true;
  private duckHook?: (durationMs: number) => void;

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
    this.speakReadingText(phonemeFallbackText(key), options);
  }

  playPhonemeSequence(units: string[], options: ReadingAudioOptions = {}): void {
    this.speakReadingText(blendFallbackText(units), options);
  }

  playZoemWord(units: string[], word: string, options: ReadingAudioOptions = {}): void {
    this.speakReadingText(blendFallbackText(units, word), options);
  }

  cancel(): void {
    this.fallback?.cancel();
  }

  private speakReadingText(text: string, options: ReadingAudioOptions): void {
    if (!this.enabled || !text.trim()) return;
    const rate = options.rate ?? 0.72;
    this.duckHook?.(text.length * 85 + 600);
    this.fallback?.speakBrowserOnly(text, { interrupt: options.interrupt, rate, pitch: 1.06 });
  }
}
