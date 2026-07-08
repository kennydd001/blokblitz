import { REGION_IDS } from "../../data/journey";
import type { Game } from "../../game/Game";
import { BossScene } from "./BossScene";
import { buildDoneScreen, starsFromPerfect } from "./miniUi";

// "Sterrenarena" — the endgame gauntlet: fight all six region bosses back to
// back, hearts and hits tallied, difficulty scaled by the current Sterrenronde
// tier, ending on one triumphant cumulative screen. Unlocked once the star is
// home. Reuses BossScene wholesale (each fight is fully parameterised by
// region); only the chaining + final screen differ.
export class BossRushScene extends BossScene {
  private readonly order = REGION_IDS;
  private index = 0;
  private hitsTotal = 0;
  private roundsTotal = 0;
  private perfectTotal = 0;

  constructor(game: Game) {
    super(game);
  }

  // The gauntlet starts at the first region and marches through them all.
  protected resolveRegionId(): string {
    return this.order[0];
  }

  // Each fight plays one tier harder than its region's own boss would (the
  // "beat the game again, but harder" rematch).
  protected beginFight(regionId: string): void {
    super.beginFight(regionId);
    this.cap = Math.min(9, this.cap + (this.game.difficultyTier() - 1));
  }

  // When a boss falls, chain to the next one instead of the per-boss done
  // screen; after the sixth, show the cumulative champion screen.
  protected onBossDefeated(): void {
    this.roundsTotal += this.total;
    this.hitsTotal += this.correctRounds;
    this.perfectTotal += this.perfectRounds;
    this.index += 1;
    if (this.index >= this.order.length) {
      this.showRushDone();
      return;
    }
    this.beginFight(this.order[this.index]);
    this.round = 1;
    this.correctRounds = 0;
    this.perfectRounds = 0;
    this.root.classList.remove("phase-2", "phase-3");
    this.root.classList.toggle("boss-final", this.isFinal);
    this.applyArenaTheme();
    this.startRound();
    this.showBossIntro();
    this.game.flashMessage(`Baas ${this.index + 1} van ${this.order.length}!`, "good");
  }

  private showRushDone(): void {
    this.game.audio.play("win");
    this.buddy?.setMood("wow");
    this.buddy?.say("Kampioen!");
    const stars = starsFromPerfect(this.perfectTotal, Math.max(1, this.roundsTotal));
    // A big champion bonus on top of the per-hit rewards already earned.
    const bonus = 6 + this.perfectTotal;
    this.game.save.award({ stars: bonus, blocks: bonus });
    this.game.voice.speak("Alle bazen verslagen! Jij bent de kampioen van de Sterrenarena!", { interrupt: true, pitch: 1.25 });
    this.root.replaceChildren(
      buildDoneScreen({
        emoji: "🏆",
        heading: "Sterrenarena gewonnen!",
        stars,
        sub: `Je versloeg alle ${this.order.length} bazen! +${bonus} sterren.`,
        newStickers: [],
        homeLabel: "Speeltuin",
        onReplay: () => this.replayRush(),
        onHome: () => this.game.showScene(this.returnScene())
      })
    );
    const burst = document.createElement("div");
    burst.className = "results-burst boss-defeat-burst";
    burst.setAttribute("aria-hidden", "true");
    burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
    this.root.appendChild(burst);
    if (this.buddy) this.root.appendChild(this.buddy.el);
  }

  private replayRush(): void {
    this.index = 0;
    this.hitsTotal = 0;
    this.roundsTotal = 0;
    this.perfectTotal = 0;
    this.beginFight(this.order[0]);
    this.round = 1;
    this.correctRounds = 0;
    this.perfectRounds = 0;
    this.root.classList.remove("phase-2", "phase-3");
    this.root.classList.add("mini-scene", "centered", "boss-scene");
    this.root.classList.toggle("boss-final", this.isFinal);
    this.applyArenaTheme();
    this.startRound();
    this.showBossIntro();
  }
}
