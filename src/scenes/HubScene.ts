import { STICKERS } from "../data/stickers";
import type { Game } from "../game/Game";
import { HERO_SKINS, skinById, unlockedSkinIds } from "../runner/skins";
import { cssHex } from "../runner/worlds";
import { createBuddy } from "./buddy";
import { openParentGate } from "./parentGate";
import { maybeBuddyLevelUp, maybeDailyChest, spawnTreasureChest, treasureMeter } from "./treasure";
import { BaseScene } from "./SceneUtils";

interface ModeCard {
  scene: string;
  emoji: string;
  name: string;
  desc: string;
  tone: string;
}

const MODES: ModeCard[] = [
  // Avontuur
  { scene: "reis", emoji: "🗺️", name: "Sterrenreis", desc: "Breng de ster thuis", tone: "adventure" },
  // Getallen 1-10
  { scene: "count", emoji: "🐣", name: "Tel mee", desc: "Tel de diertjes", tone: "count" },
  { scene: "match", emoji: "🧩", name: "Zoek hetzelfde", desc: "Vind even veel", tone: "match" },
  { scene: "compare", emoji: "🦖", name: "Wat is meer?", desc: "Kies de grootste", tone: "compare" },
  { scene: "onemoreless", emoji: "➕", name: "Eentje erbij", desc: "Meer of minder", tone: "onemore" },
  { scene: "order", emoji: "🔢", name: "Op volgorde", desc: "Klein naar groot", tone: "order" },
  { scene: "memory", emoji: "🧠", name: "Memory", desc: "Zoek de paren", tone: "memory" },
  // Splitsen en de tien
  { scene: "fill", emoji: "🔟", name: "Vul de tien", desc: "Maak het getal", tone: "fill" },
  { scene: "splitbord", emoji: "⚖️", name: "Splitsbord", desc: "Maak het getal samen", tone: "splitbord" },
  // Lezen
  { scene: "klankgrot", emoji: "🔊", name: "Klankgrot", desc: "Luister naar klanken", tone: "klankgrot" },
  { scene: "letterkompas", emoji: "🧭", name: "Letterkompas", desc: "Letter en klank", tone: "letterkompas" },
  { scene: "zoemroute", emoji: "🐝", name: "Zoemroute", desc: "Zoem tot een woord", tone: "zoemroute" },
  { scene: "woordbouwplaats", emoji: "🔤", name: "Woordbouw", desc: "Bouw het woord", tone: "woordbouw" },
  // Rekenen tot 20
  { scene: "tientalhuis", emoji: "🏠", name: "Tientalhuis", desc: "Tien en nog wat", tone: "tientalhuis" },
  { scene: "getallenlijn", emoji: "📏", name: "Getallenlijn", desc: "De lijn tot 20", tone: "getallenlijn" },
  { scene: "tienbrug", emoji: "🌉", name: "Tienbrug", desc: "Plus en min tot 20", tone: "tienbrug" },
  // Vormen & meten
  { scene: "vormenburcht", emoji: "🔷", name: "Vormenburcht", desc: "Vormen en patronen", tone: "vormen" },
  { scene: "meetwerf", emoji: "📐", name: "Meetwerf", desc: "Langer of korter", tone: "meet" },
  { scene: "geldmarkt", emoji: "🪙", name: "Geldmarkt", desc: "Tel het geld", tone: "geld" },
  { scene: "kloktoren", emoji: "🕐", name: "Kloktoren", desc: "Lees de klok", tone: "klok" },
  // Verkeer
  { scene: "verkeerspad", emoji: "🚦", name: "Verkeerspad", desc: "Veilig op straat", tone: "verkeer" },
  { scene: "luisterbos", emoji: "🌳", name: "Luisterbos", desc: "Luister het verhaaltje", tone: "luister" }
];

export class HubScene extends BaseScene {
  private greeted = false;

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
      this.badge("🏆", `${Object.values(data.progress.worlds).filter((w) => w.completed).length}/6`, "werelden"),
      treasureMeter(this.game)
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

    // Your hero greets you here too, in its chosen colour — picking a new hero in
    // the garage updates the buddy instantly.
    const buddy = createBuddy(skinById(data.progress.cosmetics.activeSkin), data.progress.stars);
    this.root.appendChild(buddy.el);
    buddy.setMood("happy", 1500);
    maybeDailyChest(this.game, this.root, buddy);
    spawnTreasureChest(this.game, this.root, buddy);
    maybeBuddyLevelUp(this.game, this.root);
    if (!this.greeted) {
      this.greeted = true;
      buddy.say(`Hoi! Ik ben ${buddy.name}. Wat spelen we?`);
      this.game.voice.speak("Hoi! Wat gaan we spelen?", { interrupt: true });
    } else {
      buddy.say("Leuke keuze!");
    }
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
    if (scene === "reis" || scene === "mainMenu") {
      this.game.lastJourneyNode = undefined;
      this.game.showScene(scene);
      return;
    }
    this.game.lastJourneyNode = undefined;
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
