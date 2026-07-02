import type { Game } from "../game/Game";
import { BaseScene, sceneHeader } from "./SceneUtils";

export class SettingsScene extends BaseScene {
  constructor(game: Game) {
    super(game, "settings");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    this.game.audio.stopMusic();
    const data = this.game.data();
    const panel = document.createElement("div");
    panel.className = "settings-panel";
    panel.innerHTML = `
      <label class="setting-row">
        <span>Snelheid</span>
        <input id="speed" type="range" min="0.7" max="1.4" step="0.1" value="${data.settings.speed}">
      </label>
      <label class="setting-row">
        <span>Geluid uit</span>
        <input id="muted" type="checkbox" ${data.settings.muted ? "checked" : ""}>
      </label>
      <label class="setting-row">
        <span>Voorlezen (stem)</span>
        <input id="voice" type="checkbox" ${data.settings.voice ? "checked" : ""}>
      </label>
      <label class="setting-row">
        <span>Trillen</span>
        <input id="haptics" type="checkbox" ${data.settings.haptics ? "checked" : ""}>
      </label>
      <label class="setting-row">
        <span>Hoog contrast</span>
        <input id="contrast" type="checkbox" ${data.settings.highContrast ? "checked" : ""}>
      </label>
    `;
    const speed = panel.querySelector<HTMLInputElement>("#speed");
    const muted = panel.querySelector<HTMLInputElement>("#muted");
    const voice = panel.querySelector<HTMLInputElement>("#voice");
    const haptics = panel.querySelector<HTMLInputElement>("#haptics");
    const contrast = panel.querySelector<HTMLInputElement>("#contrast");
    const save = (): void => {
      this.game.save.updateSettings((settings) => {
        settings.speed = Number(speed?.value ?? 1);
        settings.muted = Boolean(muted?.checked);
        settings.voice = Boolean(voice?.checked);
        settings.haptics = Boolean(haptics?.checked);
        settings.highContrast = Boolean(contrast?.checked);
      });
      this.game.audio.setSettings(this.game.save.getMutableData().settings);
      this.game.haptics.setSettings(this.game.save.getMutableData().settings);
      this.game.voice.setSettings(this.game.save.getMutableData().settings);
      this.game.readingAudio.setSettings(this.game.save.getMutableData().settings);
      document.body.classList.toggle("high-contrast", Boolean(contrast?.checked));
    };
    speed?.addEventListener("input", save);
    muted?.addEventListener("change", save);
    voice?.addEventListener("change", save);
    haptics?.addEventListener("change", save);
    contrast?.addEventListener("change", save);
    panel.append(this.button("Terug", () => this.game.showScene("hub")));
    this.root.append(sceneHeader("Instellingen"), panel);
  }
}

