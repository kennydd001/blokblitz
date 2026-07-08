import { BOSSES, JOURNEY, type BossSpec } from "../../data/journey";
import { stickerById } from "../../data/stickers";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, Representation } from "../../education/types";
import type { Game } from "../../game/Game";
import { cssHex, getWorld } from "../../runner/worlds";
import { buildBossArt } from "../bossArt";
import { subitizeChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";
import { buildDoneScreen, starsFromPerfect } from "./miniUi";

// The getalbeelden the boss flashes, rotated each hit so the child reads every
// number image while fighting (dots, dice, fingers, ten-frame, domino, eggs).
const REPS: Representation[] = ["dots", "dice", "fingers", "tenframe", "domino", "eggs"];
const DEFAULT_BOSS: BossSpec = { name: "De baas", emoji: "👾", taunt: "Hihi, mis!", defeat: "De kleuren zijn terug!" };

// A region's climactic boss fight. Mechanically it is the calm subitise mode in
// disguise: read the number image, tap the matching numeral to "hit" the boss.
// Each correct answer drains one heart; wrong just gives a gentle retry (no game
// over). Five hits frees the trapped friend and blooms the region's colours back.
export class BossScene extends MiniGameScene {
  protected total = 5;
  protected instruction = "Hoeveel zie je? Tik het getal en raak de baas!";
  protected boss: BossSpec = DEFAULT_BOSS;
  protected regionId = "grasland";
  protected cap = 10;
  /** The Sterrenrover finale: 7 hearts and three escalating phases. */
  protected isFinal = false;
  private lastPhase = 1;

  protected get emoji(): string {
    return this.boss.emoji;
  }

  protected get heading(): string {
    return this.boss.name;
  }

  constructor(game: Game) {
    super(game, "boss");
  }

  mount(): void {
    this.beginFight(this.resolveRegionId());
    super.mount();
    this.root.classList.add("boss-scene");
    this.root.classList.toggle("boss-final", this.isFinal);
    this.applyArenaTheme();
    this.showBossIntro();
  }

  /** Which region's boss this fight is: the launching journey node (else grasland). */
  protected resolveRegionId(): string {
    const node = JOURNEY.find((n) => n.id === this.game.lastJourneyNode && n.kind === "boss");
    return node?.regionId ?? "grasland";
  }

  /** Configure the fight for a region (called before startRound so cap is set). */
  protected beginFight(regionId: string): void {
    this.regionId = regionId;
    this.boss = BOSSES[regionId] ?? DEFAULT_BOSS;
    this.cap = getWorld(regionId).maxQuantity;
    this.isFinal = regionId === "sterrenrace";
    this.total = this.isFinal ? 7 : 5;
    this.lastPhase = 1;
  }

  /** Moody gradient in the region's sky -> ground colours (ice cave, web wood...). */
  protected applyArenaTheme(): void {
    const pal = getWorld(this.regionId).palette;
    this.root.style.background = `radial-gradient(130% 100% at 50% 22%, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.34)), linear-gradient(180deg, ${cssHex(pal.sky)} 0%, ${cssHex(pal.ground)} 100%)`;
  }

  // A short, dramatic reveal so the boss feels like an EVENT, not just a screen.
  protected showBossIntro(): void {
    const intro = document.createElement("div");
    intro.className = "boss-intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML =
      `<div class="boss-intro-card">` +
      `<span class="boss-intro-vs">${this.isFinal ? "EINDBAAS!" : "BAAS!"}</span>` +
      `<span class="boss-intro-face">${buildBossArt(this.regionId)}</span>` +
      `<strong>${this.boss.name}</strong>` +
      `<em>“${this.boss.taunt}”</em>` +
      `</div>`;
    this.root.appendChild(intro);
    this.game.haptics.play("stumble");
    this.game.voice.speak(`${this.boss.name}! ${this.boss.taunt}`, { interrupt: true });
    this.later(() => intro.remove(), 1900);
  }

  protected makeChallenge(): Challenge {
    const rep = REPS[(this.round - 1) % REPS.length];
    return subitizeChallenge(this.focusQuantity(2, Math.min(9, this.cap)), rep);
  }

  /** Finale phases: 1 (calm) -> 2 at 3 hits (angry) -> 3 on the last heart. */
  private phase(): number {
    if (!this.isFinal) return 1;
    if (this.correctRounds >= this.total - 1) return 3;
    if (this.correctRounds >= 3) return 2;
    return 1;
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const phase = this.phase();
    this.root.classList.toggle("phase-2", phase === 2);
    this.root.classList.toggle("phase-3", phase === 3);
    if (this.isFinal && phase > this.lastPhase) {
      this.lastPhase = phase;
      this.game.haptics.play("stumble");
      this.game.audio.play("stumble");
      this.game.flashMessage(phase === 3 ? "Laatste klap! ⚡" : "De Sterrenrover wordt boos! 😠", "warn");
      this.game.voice.speak(phase === 3 ? "Laatste klap!" : "De Sterrenrover wordt boos!", { interrupt: false });
    }
    const wrap = document.createElement("div");
    wrap.className = "mini-play boss-play";

    // The arena: the boss looming over its health bar.
    const arena = document.createElement("div");
    arena.className = "boss-arena";
    const foe = document.createElement("div");
    foe.className = "boss-foe";
    foe.dataset.boss = this.regionId;
    foe.innerHTML = `<span class="boss-face" aria-hidden="true">${buildBossArt(this.regionId)}</span><span class="boss-name">${this.boss.name}</span>`;
    const remaining = this.total - this.correctRounds;
    const health = document.createElement("div");
    health.className = "boss-health";
    health.setAttribute("aria-label", `${remaining} van de ${this.total} levens over`);
    for (let i = 0; i < this.total; i += 1) {
      const heart = document.createElement("span");
      heart.className = `boss-heart${i < remaining ? "" : " gone"}`;
      heart.textContent = i < remaining ? "❤️" : "🤍";
      health.appendChild(heart);
    }
    arena.append(foe, health);

    // The number image to read.
    const prompt = document.createElement("div");
    prompt.className = "boss-prompt";
    prompt.innerHTML = RepresentationFactory.renderSvg(challenge.promptRepresentation, challenge.quantity ?? 1, { label: "hoeveel?" });

    // Tap the numeral to attack.
    const choices = document.createElement("div");
    choices.className = "mini-choices boss-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice boss-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", `Raak met ${option.label}`);
      button.innerHTML = `<span class="boss-choice-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.append(arena, prompt, choices);
    return wrap;
  }

  protected celebrate(): void {
    // Land the hit: the boss recoils, a heart drains, the rest is shared juice.
    const foe = this.root.querySelector<HTMLElement>(".boss-foe");
    if (foe) {
      foe.classList.remove("hit");
      void foe.offsetWidth;
      foe.classList.add("hit");
    }
    this.game.audio.play("snap");
    this.game.haptics.play("boost");
    super.celebrate();
  }

  protected onWrong(): void {
    this.root.querySelector('.boss-choice[data-correct="true"]')?.classList.add("reveal");
    this.root.querySelector(".boss-foe")?.classList.add("taunt");
    this.game.flashMessage(this.boss.taunt, "warn");
  }

  protected finish(): void {
    // Beating the boss completes this journey node (frees the friend next).
    if (this.game.lastJourneyNode) this.game.save.advanceJourney(this.game.lastJourneyNode);
    this.game.audio.play("boss-defeat");
    this.game.haptics.play("win");
    this.game.voice.speak(this.isFinal ? `De Sterrenrover laat de ster los! ${this.boss.defeat}` : `${this.boss.name} is verslagen! ${this.boss.defeat}`, { interrupt: true, pitch: 1.2 });
    // Phase 1: the monster reels and dissolves into a burst of colour...
    this.root.querySelector(".boss-foe")?.classList.add("defeated");
    this.root.querySelectorAll(".boss-heart").forEach((heart) => heart.classList.add("gone"));
    const pop = document.createElement("div");
    pop.className = "boss-pop";
    pop.setAttribute("aria-hidden", "true");
    (this.root.querySelector(".boss-arena") ?? this.root).appendChild(pop);
    if (this.isFinal) {
      // The stolen star breaks free — the whole journey's goal, made visible.
      const star = document.createElement("div");
      star.className = "boss-star-free";
      star.setAttribute("aria-hidden", "true");
      star.textContent = "⭐";
      (this.root.querySelector(".boss-arena") ?? this.root).appendChild(star);
    }
    this.later(() => this.onBossDefeated(), 850);
  }

  /** What happens after a boss falls. Base = the victory screen; the rush chains
   *  to the next boss instead. */
  protected onBossDefeated(): void {
    this.showBossDone();
  }

  // ...then phase 2: the victory screen.
  protected showBossDone(): void {
    this.game.audio.play("win");
    this.buddy?.setMood("wow");
    this.buddy?.say("Verslagen!");
    const stars = starsFromPerfect(this.perfectRounds, this.total);
    const newStickers = this.game.save
      .syncStickers()
      .map((id) => stickerById(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ emoji: s.emoji, name: s.name }));
    this.root.replaceChildren(
      buildDoneScreen({
        emoji: this.boss.emoji,
        heading: `${this.boss.name} verslagen!`,
        stars,
        sub: this.boss.defeat,
        newStickers,
        homeLabel: this.game.lastJourneyNode ? "Verder" : "Speeltuin",
        onReplay: () => this.mountReplay(),
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
}
