import { BOSSES, JOURNEY, type BossSpec } from "../../data/journey";
import { stickerById } from "../../data/stickers";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, Representation } from "../../education/types";
import type { Game } from "../../game/Game";
import { getWorld } from "../../runner/worlds";
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
  private boss: BossSpec = DEFAULT_BOSS;
  private regionId = "grasland";
  private cap = 10;

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
    // Theme from the journey node we were launched from (falls back for free play).
    const node = JOURNEY.find((n) => n.id === this.game.lastJourneyNode && n.kind === "boss");
    this.regionId = node?.regionId ?? "grasland";
    this.boss = BOSSES[this.regionId] ?? DEFAULT_BOSS;
    this.cap = getWorld(this.regionId).maxQuantity;
    super.mount();
    this.root.classList.add("boss-scene");
    this.showBossIntro();
  }

  // A short, dramatic reveal so the boss feels like an EVENT, not just a screen.
  private showBossIntro(): void {
    const intro = document.createElement("div");
    intro.className = "boss-intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML =
      `<div class="boss-intro-card">` +
      `<span class="boss-intro-vs">BAAS!</span>` +
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

  protected renderPlay(challenge: Challenge): HTMLElement {
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
    this.game.audio.play("win");
    this.game.haptics.play("win");
    this.buddy?.setMood("wow");
    this.buddy?.say("Verslagen!");
    // Beating the boss completes this journey node (frees the friend next).
    if (this.game.lastJourneyNode) this.game.save.advanceJourney(this.game.lastJourneyNode);
    this.game.voice.speak(`${this.boss.name} is verslagen! ${this.boss.defeat}`, { interrupt: true, pitch: 1.2 });
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
