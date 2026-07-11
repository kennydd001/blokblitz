import { journeyProgressLabel } from "../data/journey";
import type { Game } from "../game/Game";
import { skinById } from "../runner/skins";
import { createBuddy } from "./buddy";
import { BaseScene } from "./SceneUtils";

/**
 * The first tap is required to unlock browser audio, so boot stays interactive.
 * Make that necessary stop feel like the opening frame of the game instead of
 * a loading card: Buddy, the lost star and Sterrenstad are already on screen.
 */
export class BootScene extends BaseScene {
  constructor(game: Game) {
    super(game, "boot");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    this.root.classList.add("boot-scene");
    this.root.appendChild(this.makeSplash());
  }

  private makeSplash(): HTMLElement {
    const data = this.game.data();
    const active = this.game.save.activeProfile();
    const returning = Boolean(active);
    const panel = document.createElement("div");
    panel.className = "splash-panel boot-splash";
    panel.dataset.returning = String(returning);

    const scenery = document.createElement("div");
    scenery.className = "boot-scenery";
    scenery.setAttribute("aria-hidden", "true");
    scenery.innerHTML = `
      <span class="boot-cloud c1"></span>
      <span class="boot-cloud c2"></span>
      <span class="boot-spark s1">★</span>
      <span class="boot-spark s2">★</span>
      <span class="boot-spark s3">★</span>
      <span class="boot-star-beam"></span>
      <span class="boot-lost-star">★</span>
      <div class="boot-city">
        <i class="tower t1"></i><i class="tower t2"></i><i class="tower t3"></i>
        <i class="tower t4"></i><i class="tower t5"></i><i class="tower t6"></i>
      </div>
    `;

    const brand = document.createElement("header");
    brand.className = "boot-brand";
    brand.innerHTML = `
      <span class="boot-brand-mark" aria-hidden="true">BB</span>
      <span>
        <h1><b>Blok</b><em>Blitz</em></h1>
        <p>Dino Redders van Sterrenstad</p>
      </span>
    `;

    const hero = document.createElement("div");
    hero.className = "boot-hero";
    const buddy = createBuddy(skinById(active?.avatar ?? data.progress.cosmetics.activeSkin), data.progress.stars);
    buddy.el.classList.add("boot-buddy");
    buddy.setMood("wow");
    buddy.say(returning ? "Daar gaan we!" : "Ga je mee?");
    hero.appendChild(buddy.el);

    const action = document.createElement("div");
    action.className = "boot-action";
    const prompt = document.createElement("strong");
    prompt.className = "boot-prompt";
    prompt.textContent = returning ? `${active?.name || "Dino Redder"}, Buddy wacht op jou!` : "Buddy zoekt een Dino Redder!";
    action.appendChild(prompt);

    if (returning) {
      const progress = document.createElement("div");
      progress.className = "boot-progress";
      progress.setAttribute("aria-label", `Sterrenreis ${journeyProgressLabel(data.progress.journey.completed)}, ${data.progress.stars} sterren`);
      progress.innerHTML = `
        <span><i aria-hidden="true">★</i><b>${data.progress.stars}</b></span>
        <span><i aria-hidden="true">🛤️</i><b>${journeyProgressLabel(data.progress.journey.completed)}</b></span>
      `;
      action.appendChild(progress);
    }

    const label = returning ? "Verder spelen" : "Start avontuur";
    const start = this.button(label, () => {
      this.game.audio.play("boost");
      this.game.showScene(returning ? "reis" : "profiles");
    });
    start.classList.add("boot-start");
    start.setAttribute("aria-label", returning ? `Verder spelen als ${active?.name || "Dino Redder"}` : "Start het avontuur");
    start.innerHTML = `<span aria-hidden="true">▶</span><strong>${label}</strong>`;
    action.appendChild(start);

    panel.append(scenery, brand, hero, action);
    return panel;
  }
}
