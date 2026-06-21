import type { GameSettings } from "../education/types";
import type { SoundCue } from "./AudioManager";

export type HapticCue = SoundCue;

const hapticPatterns: Record<HapticCue, readonly number[]> = {
  success: [18],
  snap: [12, 28, 32],
  rescue: [20, 36, 20],
  "soft-error": [30],
  build: [16, 24, 16]
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
