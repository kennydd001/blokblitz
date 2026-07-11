import type { GameSettings } from "../education/types";
import { READING_PHONEME_BASE_PATH, READING_PHONEME_FILES } from "./readingAudioManifest";
import type { VoiceManager } from "./VoiceManager";

export interface ReadingAudioOptions {
  interrupt?: boolean;
  rate?: number;
}

/**
 * Isolated phonemes use their approved dedicated clips. Whole words use Lily's
 * natural local word clips, slowed slightly for reading. Rejected synthetic
 * blend/browser voices never enter the runtime path.
 */
export class ReadingAudioManager {
  private enabled = true;

  constructor(private readonly voice: VoiceManager) {}

  setSettings(settings: GameSettings): void {
    this.enabled = settings.voice;
    if (!this.enabled) this.cancel();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  setDuckHook(_fn: (durationMs: number) => void): void {
    // VoiceManager owns ducking for both sentence and reading clips.
  }

  playPhoneme(key: string, options: ReadingAudioOptions = {}): void {
    if (!this.enabled) return;
    const file = READING_PHONEME_FILES[key];
    if (!file) return;
    this.voice.playLocalFile(`${READING_PHONEME_BASE_PATH}${file}`, `klank ${key}`, options);
  }

  playPhonemeSequence(units: string[], options: ReadingAudioOptions = {}): void {
    if (!this.enabled || units.length === 0) return;
    if (units.length === 1) {
      this.playPhoneme(units[0], options);
      return;
    }
    this.voice.speak(units.join(""), options);
  }

  playZoemWord(_units: string[], word: string, options: ReadingAudioOptions = {}): void {
    if (!this.enabled) return;
    this.voice.speak(word, options);
  }

  cancel(): void {
    this.voice.cancel();
  }
}
