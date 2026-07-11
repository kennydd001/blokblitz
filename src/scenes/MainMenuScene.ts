import type { Game } from "../game/Game";
import { HERO_SKINS } from "../runner/skins";
import { WORLDS, cssHex, getWorld } from "../runner/worlds";
import { openParentGate } from "./parentGate";
import { showSkinUnlock, unlockEligibleSkins } from "./skinRewards";
import { BaseScene } from "./SceneUtils";

export class MainMenuScene extends BaseScene {
  constructor(game: Game) {
    super(game, "main-menu");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    // Make sure every skin the star total has earned is available to pick.
    const newSkins = unlockEligibleSkins(this.game);
    this.render();
    showSkinUnlock(this.root, this.game, newSkins, {
      onSelect: (skin) => {
        this.root.querySelectorAll<HTMLElement>(".garage-card").forEach((card) => {
          card.classList.toggle("active", card.dataset.skin === skin.id);
        });
      }
    });
  }

  private render(): void {
    this.root.replaceChildren();
    this.root.classList.add("menu-scene", "centered");
    const data = this.game.data();

    const title = document.createElement("div");
    title.className = "menu-title";
    title.innerHTML = `<span class="menu-logo" aria-hidden="true">🦖</span><h1>BlokBlitz Run</h1><p>Kies een wereld en leer de getallen!</p>`;

    const badges = document.createElement("div");
    badges.className = "menu-badges";
    badges.append(
      this.badge("⭐", data.progress.stars, "sterren"),
      this.badge("🏁", `${data.progress.bestRunDistance} m`, "beste run"),
      this.badge("🏃", data.progress.runsCompleted, "runs")
    );

    const map = this.buildWorldMap();
    const garage = this.buildGarage();

    const tools = document.createElement("div");
    tools.className = "menu-tools";
    tools.append(
      this.button("◀ Speeltuin", () => this.game.showScene("hub"), "secondary"),
      this.button("Ouders", () => openParentGate(() => this.game.showScene("parentDashboard")), "ghost"),
      this.button("Instellingen", () => openParentGate(() => this.game.showScene("settings")), "ghost")
    );

    this.root.append(title, badges, map, garage, tools);
  }

  private badge(icon: string, value: string | number, label: string): HTMLElement {
    const badge = document.createElement("div");
    badge.className = "menu-badge";
    badge.innerHTML = `<span aria-hidden="true">${icon}</span><strong>${value}</strong><small>${label}</small>`;
    return badge;
  }

  private buildWorldMap(): HTMLElement {
    const data = this.game.data();
    const wrap = document.createElement("div");
    wrap.className = "world-map";
    wrap.dataset.worldMap = "true";
    const heading = document.createElement("p");
    heading.className = "world-map-title";
    heading.textContent = "Werelden";
    wrap.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "world-grid";
    WORLDS.forEach((world, index) => {
      const progress = data.progress.worlds[world.id] ?? { unlocked: index === 0, completed: false, bestStars: 0 };
      const card = document.createElement("button");
      card.type = "button";
      card.className = `world-card${progress.unlocked ? "" : " locked"}${progress.completed ? " done" : ""}`;
      card.dataset.world = world.id;
      card.dataset.locked = String(!progress.unlocked);
      card.style.setProperty("--world-sky", cssHex(world.palette.sky));
      card.style.setProperty("--world-ground", cssHex(world.palette.ground));
      card.setAttribute("aria-label", progress.unlocked ? `Speel ${world.name}` : `${world.name} op slot`);
      const stars = [0, 1, 2]
        .map((i) => `<span class="ws${i < progress.bestStars ? " earned" : ""}">★</span>`)
        .join("");
      card.innerHTML = `
        <span class="world-num">${index + 1}</span>
        <span class="world-emoji" aria-hidden="true">${progress.unlocked ? world.emoji : "🔒"}</span>
        <strong>${world.name}</strong>
        <small>${progress.unlocked ? world.blurb : `Speel eerst ${getWorld(world.unlockAfter ?? undefined).name}`}</small>
        <span class="world-stars" aria-hidden="true">${stars}</span>
      `;
      card.addEventListener("click", () => this.startWorld(world.id, progress.unlocked));
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  private buildGarage(): HTMLElement {
    const data = this.game.data();
    const unlocked = new Set(data.progress.cosmetics.unlockedSkins);
    const active = data.progress.cosmetics.activeSkin;

    const garage = document.createElement("div");
    garage.className = "menu-garage";
    garage.dataset.garage = "true";
    const heading = document.createElement("p");
    heading.className = "menu-garage-title";
    heading.textContent = "Kies je held";
    garage.appendChild(heading);

    const row = document.createElement("div");
    row.className = "garage-row";
    HERO_SKINS.forEach((skin) => {
      const isUnlocked = unlocked.has(skin.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = `garage-card${skin.id === active ? " active" : ""}${isUnlocked ? "" : " locked"}`;
      card.dataset.skin = skin.id;
      card.dataset.locked = String(!isUnlocked);
      card.style.setProperty("--skin-body", cssHex(skin.colors.body));
      card.style.setProperty("--skin-accent", cssHex(skin.colors.accent));
      card.setAttribute("aria-label", isUnlocked ? `Kies ${skin.name}` : `${skin.name}, nog ${skin.unlockStars} sterren`);
      card.innerHTML = `
        <span class="garage-face" aria-hidden="true"></span>
        <strong>${skin.name}</strong>
        ${isUnlocked ? "" : `<small class="garage-lock">🔒 ${skin.unlockStars}⭐</small>`}
      `;
      card.addEventListener("click", () => this.pickSkin(skin.id, isUnlocked));
      row.appendChild(card);
    });
    garage.appendChild(row);
    return garage;
  }

  private pickSkin(id: string, isUnlocked: boolean): void {
    if (!isUnlocked) return this.wiggle(`.garage-card[data-skin="${id}"]`);
    this.game.save.setActiveSkin(id);
    this.render();
  }

  private startWorld(id: string, isUnlocked: boolean): void {
    if (!isUnlocked) return this.wiggle(`.world-card[data-world="${id}"]`);
    this.game.lastJourneyNode = undefined;
    this.game.requestFullscreenPlay();
    this.game.save.startNewSession();
    this.game.showScene("run", { worldId: id });
  }

  private wiggle(selector: string): void {
    const node = this.root.querySelector<HTMLElement>(selector);
    node?.classList.remove("shake");
    void node?.offsetWidth;
    node?.classList.add("shake");
  }
}
