import type { GameSettings } from "../education/types";
import type { SoundCue } from "./AudioManager";

export type HapticCue = SoundCue;

const hapticPatterns: Record<HapticCue, readonly number[]> = {
  success: [18],
  snap: [12, 28, 32],
  rescue: [20, 36, 20],
  "soft-error": [30],
  build: [16, 24, 16],
  coin: [8],
  jump: [10],
  boost: [12, 18, 24],
  win: [16, 24, 16, 28],
  stumble: [26],
  "start-race": [16, 8, 16, 24],
  golden: [10, 14, 10, 18],
  "boss-defeat": [22, 30, 22, 36]
};

export function hapticPattern(name: HapticCue): readonly number[] {
  return hapticPatterns[name];
}

export class HapticManager {
  private enabled = true;

  setSettings(settings: GameSettings): void {
    this.enabled = settings.haptics;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  play(name: HapticCue): void {
    if (!this.enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    const activation = "userActivation" in navigator ? navigator.userActivation : undefined;
    if (activation && !activation.hasBeenActive) return;
    navigator.vibrate([...hapticPattern(name)]);
  }
}
