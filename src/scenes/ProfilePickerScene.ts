import type { Game } from "../game/Game";
import { MAX_CHILD_PROFILES } from "../game/SaveManager";
import { openParentGate } from "./parentGate";
import { PROFILE_AVATARS, createProfileAvatar } from "./profileAvatars";
import { BaseScene, sceneHeader } from "./SceneUtils";

// The parent-controlled profile picker. Normal boot keeps the last child active;
// this screen is reached through the hub's parent gate so a stray child tap
// cannot move progress into a sibling's trajectory. SaveManager owns the actual
// per-profile data isolation.
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
    this.root.appendChild(sceneHeader(profiles.length === 0 ? "Maak je speler" : "Kies de speler", profiles.length === 0 ? "Kies je teken" : "Voor volwassenen"));

    // Brand-new install: go straight to "make your dino".
    if (profiles.length === 0) {
      this.game.voice.speak("Hoi! Maak je eigen dino.", { interrupt: true });
      this.root.appendChild(this.createPanel());
      return;
    }

    this.game.voice.speak("Kies wie er nu speelt.", { interrupt: true });
    const grid = document.createElement("div");
    grid.className = "profiles-grid";
    profiles.forEach((profile) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "profile-card";
      card.dataset.profile = profile.id;
      card.setAttribute("aria-label", profile.name || "Speler");
      const avatar = createProfileAvatar(profile.avatar);
      avatar.classList.add("profile-avatar");
      card.appendChild(avatar);
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
        card.addEventListener("click", () => this.play(profile.id));
      }
      grid.appendChild(card);
    });

    if (profiles.length < MAX_CHILD_PROFILES) {
      const add = document.createElement("button");
      add.type = "button";
      add.className = "profile-card profile-add";
      add.setAttribute("aria-label", "Nieuw kind");
      add.innerHTML = `<span class="profile-add-plus" aria-hidden="true">＋</span><strong>Nieuw</strong>`;
      add.addEventListener("click", () => this.root.replaceChildren(sceneHeader("Nieuwe speler", "Kies je teken"), this.createPanel()));
      grid.appendChild(add);
    }
    this.root.appendChild(grid);

    if (profiles.length >= MAX_CHILD_PROFILES) {
      const limit = document.createElement("p");
      limit.className = "profile-limit";
      limit.textContent = `${MAX_CHILD_PROFILES} spelers op dit toestel. Gebruik Beheer om plaats te maken.`;
      this.root.appendChild(limit);
    }

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

  // The profile sign identifies the child; star-unlocked playable heroes are separate.
  private createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "profile-create";
    let chosen = PROFILE_AVATARS[0].id;

    const choices = document.createElement("div");
    choices.className = "profile-avatar-choices";
    choices.setAttribute("aria-label", "Profielteken");
    PROFILE_AVATARS.forEach((avatar) => {
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "profile-avatar-choice";
      opt.dataset.avatar = avatar.id;
      opt.setAttribute("aria-label", avatar.label);
      opt.setAttribute("aria-pressed", String(avatar.id === chosen));
      if (avatar.id === chosen) opt.classList.add("chosen");
      const token = createProfileAvatar(avatar.id);
      token.classList.add("profile-avatar");
      opt.appendChild(token);
      opt.addEventListener("click", () => {
        chosen = avatar.id;
        choices.querySelectorAll<HTMLButtonElement>(".profile-avatar-choice").forEach((choice) => {
          const selected = choice === opt;
          choice.classList.toggle("chosen", selected);
          choice.setAttribute("aria-pressed", String(selected));
        });
        this.game.audio.play("snap");
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
      this.play(profile.id);
    });
    start.classList.add("profile-create-start");

    panel.append(choices, nameRow, start);
    return panel;
  }

  private play(id: string): void {
    this.game.useProfile(id);
    this.game.voice.speak("Hoi! Daar gaan we!", { interrupt: true, pitch: 1.2 });
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
