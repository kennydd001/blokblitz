import type { GameSettings } from "../education/types";
import { blendFallbackText, phonemeFallbackText } from "../education/literacy/phonemeInventory";
import { VOICE_LINE_BASE_PATH, VOICE_LINE_SLUGS, voiceLineFile, voiceLineSlug } from "./voiceLineManifest";
import type { VoiceManager } from "./VoiceManager";

type ReadingVoiceFallback = Pick<VoiceManager, "speakBrowserOnly" | "cancel">;

export interface ReadingAudioOptions {
  interrupt?: boolean;
  rate?: number;
}

// Gap between chained phoneme clips: long enough to hear the units as separate
// sounds, short enough to still feel like one word being stretched.
const CHAIN_GAP_MS = 160;

/**
 * Reading audio — the phoneme-true voice for letters and zoemend lezen.
 *
 * Plays the recorded Hestia clips (real Dutch phoneme pronunciations) and CHAINS
 * them for blends: playPhonemeSequence(["m","aa","n"]) plays m.mp3, aa.mp3,
 * n.mp3 back to back; playZoemWord prefers the single professionally-paced blend
 * clip ("m... aa... n... maan") and falls back to chaining units + the word.
 * Browser speech synthesis is only the last resort when a clip is missing.
 */
export class ReadingAudioManager {
  private enabled = true;
  private duckHook?: (durationMs: number) => void;
  private activeAudio = new Set<HTMLAudioElement>();
  private chainTimer = 0;
  private chainToken = 0;

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

  /** One isolated sound: the phoneme clip, else spoken fallback. */
  playPhoneme(key: string, options: ReadingAudioOptions = {}): void {
    if (!this.enabled) return;
    if (this.playClips([key], options)) return;
    this.speakFallback(phonemeFallbackText(key), options);
  }

  /** A stretched sequence of sounds (m... aa... n) as chained phoneme clips. */
  playPhonemeSequence(units: string[], options: ReadingAudioOptions = {}): void {
    if (!this.enabled || units.length === 0) return;
    if (this.playClips(units, options)) return;
    this.speakFallback(blendFallbackText(units), options);
  }

  /** The zoem blend: sounds stretched into the whole word. */
  playZoemWord(units: string[], word: string, options: ReadingAudioOptions = {}): void {
    if (!this.enabled) return;
    // Best: the single Hestia blend clip, paced by the voice itself.
    const blendSlug = voiceLineSlug(`${units.join("... ")}... ${word}`);
    if (this.playClips([], options, [blendSlug])) return;
    // Next best: chain the unit clips, then the word clip.
    if (this.playClips([...units, word], options)) return;
    this.speakFallback(blendFallbackText(units, word), options);
  }

  cancel(): void {
    this.chainToken += 1;
    if (this.chainTimer) {
      window.clearTimeout(this.chainTimer);
      this.chainTimer = 0;
    }
    for (const audio of this.activeAudio) {
      audio.pause();
      audio.src = "";
    }
    this.activeAudio.clear();
    this.fallback?.cancel();
  }

  // ---- clip playback ---------------------------------------------------------

  private canPlayClips(): boolean {
    if (typeof Audio === "undefined") return false;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return false;
    return true;
  }

  /**
   * Play a chain of clips (keys resolved via voiceLineSlug, or raw slugs).
   * Returns false — without starting anything — when a clip is missing, so the
   * caller can fall back as one coherent utterance instead of a broken mix.
   */
  private playClips(keys: string[], options: ReadingAudioOptions, rawSlugs?: string[]): boolean {
    if (!this.canPlayClips()) return false;
    const slugs = rawSlugs ?? keys.map((key) => voiceLineSlug(key));
    if (slugs.length === 0 || !slugs.every((slug) => VOICE_LINE_SLUGS.has(slug))) return false;

    if (options.interrupt !== false) this.cancel();
    const token = this.chainToken;
    const rate = Math.max(0.55, Math.min(1.35, options.rate ?? 1));
    this.duckHook?.(slugs.length * 900 + 600);

    const playAt = (index: number): void => {
      if (token !== this.chainToken || index >= slugs.length) return;
      const audio = new Audio(`${VOICE_LINE_BASE_PATH}${voiceLineFile(slugs[index])}`);
      audio.preload = "auto";
      audio.playbackRate = rate;
      this.activeAudio.add(audio);
      const advance = (): void => {
        this.activeAudio.delete(audio);
        if (token !== this.chainToken) return;
        if (index + 1 < slugs.length) {
          this.chainTimer = window.setTimeout(() => playAt(index + 1), CHAIN_GAP_MS);
        }
      };
      audio.addEventListener("ended", advance, { once: true });
      audio.addEventListener("error", advance, { once: true });
      void audio.play().catch(() => advance());
    };
    playAt(0);
    return true;
  }

  private speakFallback(text: string, options: ReadingAudioOptions): void {
    if (!text.trim()) return;
    const rate = options.rate ?? 0.72;
    this.duckHook?.(text.length * 85 + 600);
    this.fallback?.speakBrowserOnly(text, { interrupt: options.interrupt, rate, pitch: 1.06 });
  }
}
