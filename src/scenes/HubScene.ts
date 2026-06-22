import { STICKERS } from "../data/stickers";
import type { Game } from "../game/Game";
import { HERO_SKINS, unlockedSkinIds } from "../runner/skins";
import { cssHex } from "../runner/worlds";
import { openParentGate } from "./parentGate";
import { BaseScene } from "./SceneUtils";

interface ModeCard {
  scene: string;
  emoji: string;
  name: string;
  desc: string;
  tone: string;
}

const MODES: ModeCard[] = [
  { scene: "mainMenu", emoji: "🗺️", name: "Avontuur", desc: "Ren door de werelden", tone: "adventure" },
  { scene: "count", emoji: "🐣", name: "Tel mee", desc: "Tel de diertjes", tone: "count" },
  { scene: "match", emoji: "🧩", name: "Zoek hetzelfde", desc: "Vind even veel", tone: "match" },
  { scene: "compare", emoji: "🦖", name: "Wat is meer?", desc: "Kies de grootste", tone: "compare" },
  { scene: "fill", emoji: "🔟", name: "Vul de tien", desc: "Maak het getal", tone: "fill" },
  { scene: "onemoreless", emoji: "➕", name: "Eentje erbij", desc: "Meer of minder", tone: "onemore" },
  { scene: "order", emoji: "🔢", name: "Op volgorde", desc: "Klein naar groot", tone: "order" },
  { scene: "memory", emoji: "🧠", name: "Memory", desc: "Zoek de paren", tone: "memory" }
];

export class HubScene extends BaseScene {
  constructor(game: Game) {
    super(game, "hub");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    this.game.save.syncUnlockedSkins(unlockedSkinIds(this.game.data().progress.stars));
    this.game.save.syncStickers();
    this.game.audio.startMusic("hub");
    this.render();
  }

  private render(): void {
    this.root.replaceChildren();
    this.root.classList.add("hub-scene", "centered");
    const data = this.game.data();

    const title = document.createElement("div");
    title.className = "hub-title";
    title.innerHTML = `<span class="menu-logo" aria-hidden="true">🦖</span><h1>Speeltuin</h1><p>Kies een spelletje en leer de getallen!</p>`;

    const badges = document.createElement("div");
    badges.className = "menu-badges";
    badges.append(
      this.badge("⭐", data.progress.stars, "sterren"),
      this.badge("🏆", `${Object.values(data.progress.worlds).filter((w) => w.completed).length}/6`, "werelden")
    );

    const grid = document.createElement("div");
    grid.className = "hub-grid";
    MODES.forEach((mode) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `hub-card ${mode.tone}`;
      card.dataset.mode = mode.scene;
      card.setAttribute("aria-label", mode.name);
      card.innerHTML = `
        <span class="hub-emoji" aria-hidden="true">${mode.emoji}</span>
        <strong>${mode.name}</strong>
        <small>${mode.desc}</small>
      `;
      card.addEventListener("click", () => this.enter(mode.scene));
      grid.appendChild(card);
    });

    const garage = this.buildGarage();
    const stickers = this.buildStickerBook();

    const tools = document.createElement("div");
    tools.className = "menu-tools";
    tools.append(
      this.button("Ouders", () => this.parentArea("parentDashboard"), "ghost"),
      this.button("Instellingen", () => this.parentArea("settings"), "ghost")
    );

    this.root.append(title, badges, grid, garage, stickers, tools);
  }

  private buildStickerBook(): HTMLElement {
    const owned = new Set(this.game.data().progress.stickers);
    const book = document.createElement("div");
    book.className = "sticker-book";
    book.dataset.stickerBook = "true";
    const heading = document.createElement("p");
    heading.className = "sticker-book-title";
    heading.textContent = `Stickerboek (${owned.size}/${STICKERS.length})`;
    book.appendChild(heading);
    const row = document.createElement("div");
    row.className = "sticker-row";
    STICKERS.forEach((sticker) => {
      const has = owned.has(sticker.id);
      const cell = document.createElement("div");
      cell.className = `sticker-cell${has ? " earned" : " locked"}`;
      cell.dataset.sticker = sticker.id;
      cell.setAttribute("aria-label", has ? sticker.name : `${sticker.name} op slot`);
      cell.innerHTML = `<span aria-hidden="true">${has ? sticker.emoji : "❓"}</span>`;
      row.appendChild(cell);
    });
    book.appendChild(row);
    return book;
  }

  private enter(scene: string): void {
    if (scene !== "mainMenu") this.game.requestFullscreenPlay();
    this.game.save.startNewSession();
    this.game.showScene(scene);
  }

  private parentArea(scene: string): void {
    openParentGate(() => this.game.showScene(scene));
  }

  private badge(icon: string, value: string | number, label: string): HTMLElement {
    const badge = document.createElement("div");
    badge.className = "menu-badge";
    badge.innerHTML = `<span aria-hidden="true">${icon}</span><strong>${value}</strong><small>${label}</small>`;
    return badge;
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
      card.addEventListener("click", () => {
        if (!isUnlocked) {
          card.classList.remove("shake");
          void card.offsetWidth;
          card.classList.add("shake");
          return;
        }
        this.game.save.setActiveSkin(skin.id);
        this.render();
      });
      row.appendChild(card);
    });
    garage.appendChild(row);
    return garage;
  }
}
