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
        <span>🎵 Muziek</span>
        <input id="music" type="checkbox" ${data.settings.music ? "checked" : ""}>
      </label>
      <label class="setting-row">
        <span>🔊 Geluidjes</span>
        <input id="sound" type="checkbox" ${data.settings.sound ? "checked" : ""}>
      </label>
      <label class="setting-row">
        <span>🗣️ Voorlezen (stem)</span>
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
    const music = panel.querySelector<HTMLInputElement>("#music");
    const sound = panel.querySelector<HTMLInputElement>("#sound");
    const voice = panel.querySelector<HTMLInputElement>("#voice");
    const haptics = panel.querySelector<HTMLInputElement>("#haptics");
    const contrast = panel.querySelector<HTMLInputElement>("#contrast");
    const save = (): void => {
      this.game.save.updateSettings((settings) => {
        settings.speed = Number(speed?.value ?? 1);
        settings.music = Boolean(music?.checked);
        settings.sound = Boolean(sound?.checked);
        // Keep the legacy master in sync: muted iff everything audio is off.
        settings.muted = !music?.checked && !sound?.checked && !voice?.checked;
        settings.voice = Boolean(voice?.checked);
        settings.haptics = Boolean(haptics?.checked);
        settings.highContrast = Boolean(contrast?.checked);
      });
      this.game.audio.setSettings(this.game.save.getMutableData().settings);
      this.game.haptics.setSettings(this.game.save.getMutableData().settings);
      this.game.voice.setSettings(this.game.save.getMutableData().settings);
      this.game.readingAudio.setSettings(this.game.save.getMutableData().settings);
      document.body.classList.toggle("high-contrast", Boolean(contrast?.checked));
      // A tiny confirmation so a parent hears the effects toggle take effect.
      if (sound?.checked) this.game.audio.play("coin");
      if (music?.checked) this.game.audio.startMusic("hub");
      else this.game.audio.stopMusic();
    };
    speed?.addEventListener("input", save);
    music?.addEventListener("change", save);
    sound?.addEventListener("change", save);
    voice?.addEventListener("change", save);
    haptics?.addEventListener("change", save);
    contrast?.addEventListener("change", save);
    panel.append(this.button("Terug", () => this.game.showScene("hub")));
    this.root.append(sceneHeader("Instellingen"), panel);
  }
}

