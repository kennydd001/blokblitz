import type { Game } from "../game/Game";
import { BaseScene, sceneHeader } from "./SceneUtils";

export class BootScene extends BaseScene {
  private timer = 0;

  constructor(game: Game) {
    super(game, "boot");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    this.root.classList.add("centered");
    this.root.append(
      sceneHeader("BlokBlitz", "Dino Redders van Sterrenstad"),
      this.game.assets.describe() ? this.makeSplash() : document.createElement("div")
    );
    this.timer = window.setTimeout(() => this.game.showScene("mainMenu"), 700);
    this.addCleanup(() => window.clearTimeout(this.timer));
  }

  private makeSplash(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "splash-panel";
    panel.innerHTML = `
      <div class="brand-mark">10</div>
      <p>Getallen maken de stad wakker.</p>
    `;
    panel.appendChild(this.button("Start", () => this.game.showScene("mainMenu")));
    return panel;
  }
}


