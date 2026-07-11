import { journeyProgressLabel } from "../data/journey";
import type { Game } from "../game/Game";
import { skinById } from "../runner/skins";
import { createBuddy, type Buddy } from "./buddy";
import { openParentGate } from "./parentGate";
import { PROFILE_AVATARS, createProfileAvatar, profileAvatarById } from "./profileAvatars";
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
    const buddy = createBuddy(skinById(data.progress.cosmetics.activeSkin), data.progress.stars);
    buddy.el.classList.add("boot-buddy");
    buddy.setMood("wow");
    buddy.say(returning ? "Jouw teken?" : "Ga je mee?");
    hero.appendChild(buddy.el);

    const action = document.createElement("div");
    action.className = "boot-action";
    const prompt = document.createElement("strong");
    prompt.className = "boot-prompt";
    prompt.textContent = returning ? `${active?.name || "Dino Redder"}, Buddy wacht op jou!` : "Buddy zoekt een Dino Redder!";
    if (!returning) action.appendChild(prompt);

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

    if (active) action.appendChild(this.buildIdentityCheck(active, buddy));
    else {
      const start = this.button("Start avontuur", () => {
        this.game.audio.play("boost");
        this.game.showScene("profiles");
      });
      start.classList.add("boot-start");
      start.setAttribute("aria-label", "Start het avontuur");
      start.innerHTML = `<span aria-hidden="true">▶</span><strong>Start avontuur</strong>`;
      action.appendChild(start);
    }

    panel.append(scenery, brand, hero, action);
    return panel;
  }

  private buildIdentityCheck(active: { id: string; name: string; avatar: string }, buddy: Buddy): HTMLElement {
    const identity = document.createElement("div");
    identity.className = "boot-identity";

    const prompt = document.createElement("span");
    prompt.className = "boot-sign-prompt";
    prompt.textContent = `${active.name || "Speler"}: tik jouw teken`;

    const signs = document.createElement("div");
    signs.className = "boot-signs";
    signs.setAttribute("aria-label", `Kies het teken van ${active.name || "de speler"}`);
    const correct = profileAvatarById(active.avatar);
    const correctIndex = PROFILE_AVATARS.findIndex((avatar) => avatar.id === correct.id);
    const choices = [correct, PROFILE_AVATARS[(correctIndex + 2) % PROFILE_AVATARS.length], PROFILE_AVATARS[(correctIndex + 4) % PROFILE_AVATARS.length]];
    const rotation = [...active.id].reduce((total, character) => total + character.charCodeAt(0), 0) % choices.length;
    const ordered = [...choices.slice(rotation), ...choices.slice(0, rotation)];

    ordered.forEach((avatar) => {
      const sign = document.createElement("button");
      sign.type = "button";
      sign.className = "boot-sign";
      sign.dataset.avatar = avatar.id;
      sign.dataset.correct = String(avatar.id === correct.id);
      sign.setAttribute("aria-label", avatar.label);
      sign.setAttribute("aria-pressed", "false");
      const token = createProfileAvatar(avatar.id);
      token.classList.add("boot-sign-token");
      sign.appendChild(token);
      sign.addEventListener("click", () => {
        if (avatar.id !== correct.id) {
          sign.classList.remove("wrong");
          void sign.offsetWidth;
          sign.classList.add("wrong");
          this.game.audio.play("soft-error");
          this.game.haptics.play("soft-error");
          this.game.voice.speak("Kijk nog eens goed.", { interrupt: true });
          buddy.setMood("think", 1000);
          buddy.say("Kijk goed!");
          const timer = window.setTimeout(() => sign.classList.remove("wrong"), 650);
          this.addCleanup(() => window.clearTimeout(timer));
          return;
        }
        signs.querySelectorAll<HTMLButtonElement>(".boot-sign").forEach((button) => (button.disabled = true));
        identity.querySelector<HTMLButtonElement>(".boot-switch")?.setAttribute("disabled", "true");
        sign.classList.add("correct");
        sign.setAttribute("aria-pressed", "true");
        this.game.audio.play("boost");
        buddy.setMood("wow", 1200);
        buddy.say("Daar gaan we!");
        this.game.voice.speakThen(
          "Hoi! Daar gaan we!",
          () => {
            if (this.root.isConnected) this.game.showScene("reis");
          },
          { interrupt: true, pitch: 1.2 }
        );
      });
      signs.appendChild(sign);
    });

    const change = this.button(
      "Andere speler",
      () => openParentGate(() => this.game.showScene("profiles"), { holdToConfirm: true }),
      "ghost"
    );
    change.classList.add("boot-switch");
    change.setAttribute("aria-label", "Andere speler kiezen, voor volwassenen");
    identity.append(prompt, signs, change);
    return identity;
  }
}
