import type { Game } from "../game/Game";
import { HERO_SKINS, skinById } from "../runner/skins";
import { createBuddy } from "./buddy";
import { openParentGate } from "./parentGate";
import { BaseScene, sceneHeader } from "./SceneUtils";

// "Wie speelt er?" — the kid-friendly, reading-free profile picker. Each child
// is a dino face you tap to play; a parent adds a new child (pick a dino, type a
// name) and can remove one behind the parent gate. No passwords: for a 5-year-old
// "login" is tapping your own dino. Each profile has its own fully independent
// save + adaptive trajectory (SaveManager owns the storage).
export class ProfilePickerScene extends BaseScene {
  private manage = false;

  constructor(game: Game) {
    super(game, "profiles");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    this.root.classList.add("centered", "profiles-scene");
    this.render();
  }

  private render(): void {
    this.root.replaceChildren();
    const profiles = this.game.save.listProfiles();
    this.root.appendChild(sceneHeader("Wie speelt er?", "Tik op je eigen dino!"));

    // Brand-new install: go straight to "make your dino".
    if (profiles.length === 0) {
      this.game.voice.speak("Hoi! Maak je eigen dino.", { interrupt: true });
      this.root.appendChild(this.createPanel());
      return;
    }

    this.game.voice.speak("Wie speelt er? Tik op je dino!", { interrupt: true });
    const grid = document.createElement("div");
    grid.className = "profiles-grid";
    profiles.forEach((profile) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "profile-card";
      card.dataset.profile = profile.id;
      card.setAttribute("aria-label", profile.name || "Speler");
      const buddy = createBuddy(skinById(profile.avatar), 0);
      buddy.el.classList.add("profile-avatar");
      card.appendChild(buddy.el);
      const name = document.createElement("strong");
      name.textContent = profile.name || "Speler";
      card.appendChild(name);
      if (this.manage) {
        const del = document.createElement("span");
        del.className = "profile-delete";
        del.setAttribute("aria-hidden", "true");
        del.textContent = "✕";
        card.appendChild(del);
        card.addEventListener("click", () => this.confirmDelete(profile.id, profile.name));
      } else {
        card.addEventListener("click", () => this.play(profile.id, profile.name));
      }
      grid.appendChild(card);
    });

    // "New child" tile.
    const add = document.createElement("button");
    add.type = "button";
    add.className = "profile-card profile-add";
    add.setAttribute("aria-label", "Nieuw kind");
    add.innerHTML = `<span class="profile-add-plus" aria-hidden="true">＋</span><strong>Nieuw</strong>`;
    add.addEventListener("click", () => this.root.replaceChildren(sceneHeader("Nieuwe dino", "Kies er een!"), this.createPanel()));
    grid.appendChild(add);
    this.root.appendChild(grid);

    const tools = document.createElement("div");
    tools.className = "menu-tools profiles-tools";
    tools.appendChild(
      this.button(this.manage ? "Klaar" : "Beheer", () => {
        if (this.manage) {
          this.manage = false;
          this.render();
        } else {
          openParentGate(() => {
            this.manage = true;
            this.render();
          });
        }
      }, "ghost")
    );
    this.root.appendChild(tools);
  }

  // The create flow: pick a dino, optional name, start playing as that child.
  private createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "profile-create";
    let chosen = HERO_SKINS[0].id;

    const choices = document.createElement("div");
    choices.className = "profile-avatar-choices";
    HERO_SKINS.forEach((skin) => {
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "profile-avatar-choice";
      opt.dataset.avatar = skin.id;
      opt.setAttribute("aria-label", skin.name);
      if (skin.id === chosen) opt.classList.add("chosen");
      const buddy = createBuddy(skin, 0);
      buddy.el.classList.add("profile-avatar");
      opt.appendChild(buddy.el);
      opt.addEventListener("click", () => {
        chosen = skin.id;
        choices.querySelectorAll(".profile-avatar-choice").forEach((c) => c.classList.remove("chosen"));
        opt.classList.add("chosen");
        this.game.audio.play("snap");
        this.game.voice.speak(skin.name, { interrupt: true });
      });
      choices.appendChild(opt);
    });

    const nameRow = document.createElement("label");
    nameRow.className = "profile-name-row";
    nameRow.innerHTML = `<span>Naam</span>`;
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.maxLength = 12;
    nameInput.placeholder = "Speler";
    nameInput.className = "profile-name-input";
    nameRow.appendChild(nameInput);

    const start = this.button("Start het spel!", () => {
      const count = this.game.save.listProfiles().length;
      const name = nameInput.value.trim() || `Speler ${count + 1}`;
      const profile = this.game.save.createProfile(name, chosen);
      this.game.audio.play("win");
      this.play(profile.id, profile.name);
    });
    start.classList.add("profile-create-start");

    panel.append(choices, nameRow, start);
    return panel;
  }

  private play(id: string, name: string): void {
    this.game.useProfile(id);
    this.game.voice.speak(`Hoi ${name || "speler"}! Daar gaan we!`, { interrupt: true, pitch: 1.2 });
    this.game.showScene("reis");
  }

  private confirmDelete(id: string, name: string): void {
    if (!window.confirm(`${name || "Deze speler"} verwijderen? Alle voortgang gaat weg.`)) return;
    this.game.save.deleteProfile(id);
    if (this.game.save.listProfiles().length === 0) this.manage = false;
    // SaveManager already reactivated another profile (or default); refresh the
    // mastery view to whatever is active now.
    this.game.useProfile(this.game.save.activeProfile()?.id ?? "");
    this.render();
  }
}
