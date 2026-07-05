import { JOURNEY } from "../../data/journey";
import { stickerById } from "../../data/stickers";
import { SCENE_DOMAINS } from "../../education/difficulty";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { praiseWord } from "../../game/VoiceManager";
import { skinById } from "../../runner/skins";
import { cssHex, getWorld } from "../../runner/worlds";
import { createBuddy, type Buddy } from "../buddy";
import { BaseScene } from "../SceneUtils";
import { buildDoneScreen, showStickerReveal, starsFromPerfect } from "./miniUi";

// Shared shell for the calm, tap-based learning modes. No timer, no game over:
// the child answers at their own pace, a wrong tap just gives a gentle nudge and
// a retry, and a short set ends in a friendly star screen. Every answer is logged
// through game.recordAttempt so the parent dashboard stays accurate.
export abstract class MiniGameScene extends BaseScene {
  protected total = 7;
  protected round = 1;
  protected correctRounds = 0;
  protected perfectRounds = 0;
  protected current!: Challenge;
  protected startedAt = 0;
  protected hintUsed = false;
  protected resolving = false;
  private celebrateCount = 0;
  private streak = 0;
  protected goldenRound = false;
  protected buddy?: Buddy;
  /** Tracked timeouts so a fast child tapping Home mid-animation can't trigger work on a detached scene. */
  protected timers: number[] = [];

  /** setTimeout that is cancelled automatically on unmount. */
  protected later(fn: () => void, ms: number): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  protected abstract readonly emoji: string;
  protected abstract readonly heading: string;
  /** Mutable so a mode can change the instruction per round (e.g. "one more" vs "one less"). */
  protected instruction = "";
  /** Build the Challenge for this round. */
  protected abstract makeChallenge(): Challenge;
  /** Render the interactive play area; call this.pick(option) when the child answers. */
  protected abstract renderPlay(challenge: Challenge): HTMLElement;

  protected constructor(game: Game, name: string) {
    super(game, name);
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    this.root.classList.add("mini-scene", "centered");
    this.themeArena();
    this.round = 1;
    this.correctRounds = 0;
    this.perfectRounds = 0;
    this.streak = 0;
    this.buddy = createBuddy(skinById(this.game.data().progress.cosmetics.activeSkin), this.game.data().progress.stars);
    this.startRound();
  }

  unmount(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    this.resolving = false;
    this.game.readingAudio.cancel();
    this.game.voice.cancel();
    super.unmount();
  }

  /**
   * The dynamic difficulty tier for this activity (round + path + mastery).
   * The mastery signal is scoped to this mode's own learning domain, so a
   * strong rekenaar who still practises lezen plays each at its own level.
   */
  protected tier(): 1 | 2 | 3 {
    return this.game.difficultyTier(SCENE_DOMAINS[this.name]);
  }

  /**
   * A friendly quantity for this round, nudged by the adaptive engine and
   * shaped by the difficulty tier: tier 1 keeps numbers small (max 5), tier 2
   * uses the mode's full range, tier 3 biases toward the harder end.
   */
  protected focusQuantity(min: number, max: number): number {
    const tier = this.tier();
    const cappedMax = tier === 1 ? Math.max(min + 1, Math.min(max, 5)) : max;
    const raisedMin = tier === 3 ? Math.min(cappedMax - 1, Math.max(min, 4)) : min;
    const focus = this.game.adaptive.recommendFocus().quantity;
    const jitter = Math.floor(Math.random() * 3) - 1;
    return Math.max(raisedMin, Math.min(cappedMax, focus + jitter));
  }

  protected startRound(): void {
    this.current = this.makeChallenge();
    this.hintUsed = false;
    this.resolving = false;
    this.startedAt = performance.now();
    const play = this.renderPlay(this.current);
    this.root.replaceChildren(this.buildHeader(), this.instructionBar(), play);
    // Juice: every tappable tile pops in one-by-one, so each round OPENS with
    // a little show instead of appearing all at once.
    play.querySelectorAll("button").forEach((tile, i) => {
      tile.classList.add("tile-in");
      tile.style.animationDelay = `${Math.min(i, 11) * 0.05}s`;
    });
    // Golden bonus round: now and then a round glitters — a correct answer pays
    // DOUBLE stars. Variable reward, never on round 1 (warm-up stays calm).
    this.goldenRound = this.rollGolden();
    this.root.classList.toggle("golden-round", this.goldenRound);
    if (this.goldenRound) {
      const banner = document.createElement("div");
      banner.className = "mini-golden-banner";
      banner.setAttribute("aria-label", "Gouden ronde: dubbele sterren");
      banner.innerHTML = `<span aria-hidden="true">✨</span> Gouden ronde — dubbel! <span aria-hidden="true">✨</span>`;
      this.root.appendChild(banner);
      this.game.audio.play("snap");
    }
    if (this.buddy) {
      this.root.appendChild(this.buddy.el);
      this.buddy.setMood("think", 1100);
    }
    this.game.voice.speak(this.instruction, { interrupt: true });
  }

  /** Whether this round goes golden (~1 in 6, never the first round). */
  protected rollGolden(): boolean {
    return this.round > 1 && Math.random() < 1 / 6;
  }

  // How an answer is logged + scored. Default = the number pipeline; literacy /
  // measurement modes override this to log a curriculum attempt instead.
  protected logAttempt(option: ChallengeOption): boolean {
    return this.game.recordAttempt(this.current, option, this.startedAt, this.hintUsed);
  }

  protected pick(option: ChallengeOption): void {
    if (this.resolving) return;
    const correct = this.logAttempt(option);
    if (correct) {
      this.resolving = true;
      this.correctRounds += 1;
      if (!this.hintUsed) this.perfectRounds += 1;
      if (this.goldenRound) {
        // The golden payoff: double the base star/block reward.
        this.game.save.award({ stars: 1, blocks: 1 });
        this.game.flashMessage("Dubbel! ⭐⭐", "good");
      }
      this.onCorrect(option);
      this.celebrate();
      this.round += 1;
      this.later(() => (this.round > this.total ? this.finish() : this.startRound()), 1000);
    } else {
      this.hintUsed = true;
      this.streak = 0;
      this.root.classList.remove("mini-fever");
      // Multi-sensory "oops" + a teaching scaffold, then let them retry.
      this.game.audio.play("soft-error");
      this.game.haptics.play("soft-error");
      this.game.voice.encourage();
      this.buddy?.setMood("oops", 1400);
      this.buddy?.say("Probeer nog!");
      this.showScaffold(option);
      this.onWrong();
    }
  }

  /** Override to highlight the right answer on a wrong tap (audio/voice handled by pick). */
  protected onWrong(): void {
    this.game.flashMessage(this.current.hint || "Bijna! Probeer nog eens.", "warn");
  }

  /** Override for a mode's signature "yes!" moment (played before the shared celebrate). */
  protected onCorrect(_option: ChallengeOption): void {}

  // Re-teach the concept visually after a wrong answer instead of just revealing it.
  protected showScaffold(option: ChallengeOption): void {
    const correctQ = Math.round(Number(this.current.quantity) || 0);
    if (correctQ < 1) return;
    const playerQ = Math.round(Number(option.quantity ?? option.value) || 0);
    let line = `Kijk: dit is ${correctQ}.`;
    if (playerQ === correctQ - 1) line = `Eentje meer: ${correctQ}.`;
    else if (playerQ === correctQ + 1) line = `Eentje minder: ${correctQ}.`;
    const representation = correctQ > 5 ? "tenframe" : "fiveframe";
    const panel = document.createElement("div");
    panel.className = "mini-scaffold";
    panel.dataset.scaffold = "true";
    panel.innerHTML = `<small>${line}</small><div class="mini-scaffold-art">${RepresentationFactory.renderSvg(representation, correctQ, { label: line })}</div>`;
    this.root.querySelector(".mini-scaffold")?.remove();
    this.root.appendChild(panel);
    this.later(() => panel.remove(), 2400);
  }

  protected celebrate(): void {
    this.streak += 1;
    const big = this.streak >= 3;
    // Three-in-a-row lights the whole arena: fever mode, just like the runner.
    this.root.classList.toggle("mini-fever", big);
    this.game.voice.praise();
    this.buddy?.setMood(big ? "wow" : "happy", 1300);
    this.buddy?.say(this.streak >= 2 ? `${this.streak} op een rij!` : praiseWord(this.celebrateCount));
    this.game.flashMessage(`${praiseWord(this.celebrateCount++)} ⭐`, "good");

    // A star flies from the play area up into this round's progress dot, so
    // the header dots feel EARNED, not just ticked off.
    const dot = this.root.querySelector<HTMLElement>(".mini-dot.now");
    if (dot) {
      const star = document.createElement("span");
      star.className = "mini-star-fly";
      star.setAttribute("aria-hidden", "true");
      star.textContent = "⭐";
      star.style.left = `${window.innerWidth / 2}px`;
      star.style.top = `${window.innerHeight * 0.52}px`;
      this.root.appendChild(star);
      const rect = dot.getBoundingClientRect();
      this.later(() => {
        star.style.left = `${rect.left + rect.width / 2}px`;
        star.style.top = `${rect.top + rect.height / 2}px`;
        star.classList.add("away");
      }, 30);
      this.later(() => {
        star.remove();
        dot.classList.add("filled");
        this.game.audio.play("coin");
      }, 640);
    }

    // Confetti that grows with the streak; each piece flies a random direction.
    const pieces = Math.min(22, 7 + this.streak * 3);
    const burst = document.createElement("div");
    burst.className = `mini-correct-burst${big ? " big" : ""}`;
    burst.setAttribute("aria-hidden", "true");
    const mark = document.createElement("span");
    mark.textContent = big ? "🎉" : "✓";
    burst.appendChild(mark);
    for (let i = 0; i < pieces; i += 1) {
      const piece = document.createElement("i");
      piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 360}px`);
      piece.style.animationDelay = `${Math.random() * 0.12}s`;
      burst.appendChild(piece);
    }
    this.root.appendChild(burst);
    this.later(() => burst.remove(), 1100);

    // A streak banner from two-in-a-row, with a brighter chime as it climbs.
    if (this.streak >= 2) {
      const banner = document.createElement("div");
      banner.className = "mini-streak";
      banner.textContent = `🔥 ${this.streak} op een rij!`;
      this.root.appendChild(banner);
      this.later(() => banner.remove(), 1100);
      if (this.streak >= 4) this.game.audio.play("snap");
    }
  }

  // When launched from the Sterrenreis, softly tint the play area with that
  // region's colours so every story activity feels like it's in its own world.
  // (The boss scene overrides this with a moodier version after super.mount.)
  private themeArena(): void {
    const node = this.game.lastJourneyNode ? JOURNEY.find((n) => n.id === this.game.lastJourneyNode) : undefined;
    if (!node) return;
    const pal = getWorld(node.regionId).palette;
    this.root.style.background = `radial-gradient(120% 100% at 50% 18%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.5)), linear-gradient(180deg, ${cssHex(pal.sky)} 0%, ${cssHex(pal.ground)} 100%)`;
  }

  /** Where "back"/"home" goes: the story map when launched from it, else the Speeltuin. */
  protected returnScene(): string {
    return this.game.lastJourneyNode ? "reis" : "hub";
  }

  private buildHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = "mini-header";
    const home = this.iconButton("Terug", "back", () => this.game.showScene(this.returnScene()));
    home.classList.add("mini-home");
    const title = document.createElement("div");
    title.className = "mini-title";
    title.innerHTML = `<span aria-hidden="true">${this.emoji}</span><strong>${this.heading}</strong>`;
    const dots = document.createElement("div");
    dots.className = "mini-dots";
    dots.setAttribute("aria-label", `Ronde ${Math.min(this.round, this.total)} van ${this.total}`);
    for (let i = 1; i <= this.total; i += 1) {
      const dot = document.createElement("span");
      dot.className = `mini-dot${i < this.round ? " done" : i === this.round ? " now" : ""}`;
      dots.appendChild(dot);
    }
    header.append(home, title, dots);
    return header;
  }

  private instructionBar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "mini-instruction";
    bar.textContent = this.instruction;
    return bar;
  }

  protected finish(): void {
    this.game.audio.play("win");
    this.game.haptics.play("win");
    this.buddy?.setMood("wow");
    this.buddy?.say("Joepie!");
    // In story mode, finishing this stop drops a stone for Buddy's star.
    if (this.game.lastJourneyNode) this.game.save.advanceJourney(this.game.lastJourneyNode);
    // Every finished activity fills the treasure meter (chest at 3).
    this.game.save.bumpTreasure();
    const stars = starsFromPerfect(this.perfectRounds, this.total);
    this.game.voice.speak(stars >= 3 ? "Perfect! Heel knap gedaan!" : "Goed gedaan!", { interrupt: true, pitch: 1.25 });
    const newStickers = this.game.save
      .syncStickers()
      .map((id) => stickerById(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ emoji: s.emoji, name: s.name }));
    if (newStickers.length > 0) this.game.voice.speak(`Je verdiende een nieuwe sticker: ${newStickers[0].name}!`);
    this.root.replaceChildren(
      buildDoneScreen({
        emoji: this.emoji,
        heading: this.heading,
        stars,
        sub: `Je had er ${this.correctRounds} van de ${this.total} goed!`,
        newStickers,
        homeLabel: this.game.lastJourneyNode ? "Verder" : "Speeltuin",
        onReplay: () => this.mountReplay(),
        onHome: () => this.game.showScene(this.returnScene())
      })
    );
    if (this.buddy) this.root.appendChild(this.buddy.el);
    // New sticker? Big unboxing moment on top of the done screen.
    showStickerReveal(this.root, newStickers);
  }

  protected mountReplay(): void {
    this.root.classList.remove("centered");
    this.root.classList.add("mini-scene", "centered");
    this.round = 1;
    this.correctRounds = 0;
    this.perfectRounds = 0;
    this.streak = 0;
    this.startRound();
  }
}
