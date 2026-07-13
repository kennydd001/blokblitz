import { EXTRA_PLAY_MINUTES, REST_REWARD_STARS, roundedPlayMinutes } from "../gameplay/session/playTime";
import type { Game } from "../game/Game";
import { skinById } from "../runner/skins";
import { createBuddy } from "./buddy";
import { openParentGate } from "./parentGate";
import { BaseScene } from "./SceneUtils";

export class RestScene extends BaseScene {
  constructor(game: Game) {
    super(game, "rest");
  }

  mount(): void {
    super.mount();
    this.root.classList.add("rest-scene");
    this.game.resetWorld("summary");
    this.game.audio.startMusic("hub");
    this.game.save.endSession();

    const rewarded = this.game.save.claimRestReward();
    const data = this.game.data();
    const status = this.game.playTimeStatus();
    const active = this.game.save.activeProfile();
    const name = active?.name?.trim() || "Dino Redder";
    const minutes = roundedPlayMinutes(status.usedMs);

    const sky = document.createElement("div");
    sky.className = "rest-sky";
    sky.setAttribute("aria-hidden", "true");
    sky.innerHTML = `<span class="rest-moon">☾</span><i></i><i></i><i></i><i></i><div class="rest-city"></div>`;

    const buddy = createBuddy(skinById(data.progress.cosmetics.activeSkin), data.progress.stars);
    buddy.el.classList.add("rest-buddy");
    buddy.setMood("sleep");

    const content = document.createElement("div");
    content.className = "rest-content";
    const copy = document.createElement("div");
    copy.className = "rest-copy";
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Rustmoment";
    const title = document.createElement("h1");
    title.textContent = `Goed gespeeld, ${name}!`;
    const message = document.createElement("p");
    message.textContent = "Buddy is moe. Tijd om te bewegen, iets te drinken of samen een boekje te lezen.";
    copy.append(eyebrow, title, message);

    const stats = document.createElement("div");
    stats.className = "rest-stats";
    stats.append(this.restStat("⏱", `${minutes} min`), this.restStat("★", data.progress.stars));
    if (rewarded) {
      const reward = document.createElement("div");
      reward.className = "rest-reward";
      reward.setAttribute("role", "status");
      reward.innerHTML = `<span aria-hidden="true">🌙</span><strong>+${REST_REWARD_STARS} ruststerren</strong>`;
      stats.appendChild(reward);
    }

    const adultActions = document.createElement("div");
    adultActions.className = "rest-adult-actions";
    const extra = this.button(`🔒 Nog ${EXTRA_PLAY_MINUTES} minuten`, () => this.extraTime(), "secondary");
    extra.setAttribute("aria-label", `Voor volwassenen: geef ${EXTRA_PLAY_MINUTES} minuten extra`);
    const profiles = this.button("🔒 Andere speler", () => this.parentOpen("profiles", true), "ghost");
    profiles.setAttribute("aria-label", "Voor volwassenen: wissel van speler");
    const settings = this.button("Instellingen", () => this.parentOpen("settings"), "ghost");
    adultActions.append(extra, profiles, settings);

    content.append(copy, stats, adultActions);
    this.root.append(sky, buddy.el, content);
    this.game.voice.speakThen(
      "Buddy is moe. Tijd voor een fijne pauze.",
      () => this.game.voice.speak("Goed gespeeld! Morgen wacht er weer een avontuur.", { interrupt: false }),
      { interrupt: true }
    );
  }

  private restStat(icon: string, value: string | number): HTMLElement {
    const item = document.createElement("div");
    item.innerHTML = `<span aria-hidden="true">${icon}</span><strong>${value}</strong>`;
    return item;
  }

  private extraTime(): void {
    openParentGate(
      () => {
        this.game.grantExtraPlayTime(EXTRA_PLAY_MINUTES);
        this.game.save.startNewSession();
        this.game.showScene(this.game.lastJourneyNode ? "reis" : "hub");
        this.game.flashMessage(`${EXTRA_PLAY_MINUTES} minuten extra`, "good");
        this.game.voice.speak("Een volwassene gaf je tien minuten extra.", { interrupt: true });
      },
      { holdToConfirm: true, holdPrompt: "Houd vast voor extra speeltijd" }
    );
  }

  private parentOpen(scene: "profiles" | "settings", holdToConfirm = false): void {
    openParentGate(() => this.game.showScene(scene), { holdToConfirm });
  }
}
