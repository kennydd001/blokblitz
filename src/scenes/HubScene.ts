import { STICKERS } from "../data/stickers";
import { PLAY_CATEGORIES, PLAY_MODES, playModeByScene, type PlayCategoryId, type PlayMode } from "../data/playModes";
import type { Game } from "../game/Game";
import { HERO_SKINS, skinById, unlockedSkinIds } from "../runner/skins";
import { cssHex } from "../runner/worlds";
import { createBuddy } from "./buddy";
import { openParentGate } from "./parentGate";
import { maybeBuddyLevelUp, maybeDailyChest, spawnTreasureChest, treasureMeter } from "./treasure";
import { BaseScene } from "./SceneUtils";

export class HubScene extends BaseScene {
  private greeted = false;
  private selectedCategory: PlayCategoryId = "getallen";

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
    title.innerHTML = `<span class="menu-logo" aria-hidden="true">🦖</span><h1>Speeltuin</h1><p>Kies je missie of speel wat jij leuk vindt.</p>`;

    // The active child stays locked for the play session. A grown-up passes the
    // parent gate before another profile can be selected.
    const active = this.game.save.activeProfile();
    if (active) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "hub-profile";
      chip.setAttribute("aria-label", `${active.name || "Speler"}. Profiel vergrendeld. Ouder kan wisselen.`);
      const face = createBuddy(skinById(active.avatar), data.progress.stars);
      face.el.classList.add("hub-profile-avatar");
      chip.appendChild(face.el);
      const nm = document.createElement("strong");
      nm.textContent = active.name || "Speler";
      chip.append(nm);
      const lock = document.createElement("span");
      lock.className = "hub-profile-lock";
      lock.setAttribute("aria-hidden", "true");
      lock.textContent = "🔒";
      chip.appendChild(lock);
      chip.addEventListener("click", () => this.parentArea("profiles"));
      title.appendChild(chip);
    }

    const badges = document.createElement("div");
    badges.className = "menu-badges";
    badges.append(
      this.badge("⭐", data.progress.stars, "sterren"),
      this.badge("🏆", `${Object.values(data.progress.worlds).filter((w) => w.completed).length}/6`, "werelden"),
      treasureMeter(this.game)
    );

    const dailyPlan = this.buildDailyPlan();
    const adventure = this.buildAdventure();
    const modeBrowser = this.buildModeBrowser();

    const garage = this.buildGarage();
    const stickers = this.buildStickerBook();

    const tools = document.createElement("div");
    tools.className = "menu-tools";
    tools.append(
      this.button("Ouders", () => this.parentArea("parentDashboard"), "ghost"),
      this.button("Instellingen", () => this.parentArea("settings"), "ghost")
    );

    this.root.append(title, badges, dailyPlan, adventure, modeBrowser, garage, stickers, tools);

    // Your hero greets you here too, in its chosen colour — picking a new hero in
    // the garage updates the buddy instantly.
    const buddy = createBuddy(skinById(data.progress.cosmetics.activeSkin), data.progress.stars);
    buddy.el.classList.add("hub-buddy");
    this.root.appendChild(buddy.el);
    buddy.setMood("happy", 1500);
    const dailyGift = maybeDailyChest(this.game, this.root, buddy);
    if (dailyGift) {
      dailyGift.classList.add("hub-gift");
      badges.appendChild(dailyGift);
    }
    spawnTreasureChest(this.game, this.root, buddy);
    maybeBuddyLevelUp(this.game, this.root);
    if (!this.greeted) {
      this.greeted = true;
      this.game.voice.speak("Hoi! Wat gaan we spelen?", { interrupt: true });
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

  private buildDailyPlan(): HTMLElement {
    const plan = this.game.dailyPlan();
    const completed = new Set(plan.completedModeIds);
    const section = document.createElement("section");
    section.className = `hub-daily${plan.rewardClaimed ? " complete" : ""}`;
    section.setAttribute("aria-label", "Jouw missies voor vandaag");

    const heading = document.createElement("div");
    heading.className = "hub-section-heading";
    heading.innerHTML = `<span><small>VOOR JOU</small><strong>Jouw 3 missies</strong></span><b>${completed.size}/3</b>`;

    const row = document.createElement("div");
    row.className = "daily-mission-row";
    const labels = ["Rekenen", "Lezen", "Ontdekken"];
    plan.modeIds.forEach((scene, index) => {
      const mode = playModeByScene(scene);
      if (!mode) return;
      const done = completed.has(scene);
      const card = document.createElement("button");
      card.type = "button";
      card.className = `daily-mission ${mode.tone}${done ? " done" : ""}`;
      card.dataset.dailyMode = scene;
      card.setAttribute("aria-label", `${labels[index]}: ${mode.name}${done ? ", klaar" : ""}`);
      card.innerHTML = `
        <small>${labels[index]}</small>
        <span class="daily-mission-emoji" aria-hidden="true">${done ? "✅" : mode.emoji}</span>
        <strong>${mode.name}</strong>
      `;
      card.addEventListener("click", () => this.enter(scene));
      row.appendChild(card);
    });

    const reward = document.createElement("div");
    reward.className = "daily-reward";
    reward.innerHTML = plan.rewardClaimed
      ? `<span aria-hidden="true">🏆</span><strong>Alle missies klaar!</strong>`
      : `<span aria-hidden="true">🎁</span><strong>3 klaar = 10 bonussterren</strong><span class="daily-reward-dots" aria-hidden="true">${[0, 1, 2]
          .map((index) => `<i class="${index < completed.size ? "filled" : ""}"></i>`)
          .join("")}</span>`;

    section.append(heading, row, reward);
    return section;
  }

  private buildAdventure(): HTMLElement {
    const row = document.createElement("div");
    row.className = "hub-adventure-row";
    const adventure = document.createElement("button");
    adventure.type = "button";
    adventure.className = "hub-adventure";
    adventure.dataset.mode = "reis";
    adventure.setAttribute("aria-label", "Ga verder met de Sterrenreis");
    adventure.innerHTML = `<span aria-hidden="true">🗺️</span><span><small>AVONTUUR</small><strong>Ga verder met de Sterrenreis</strong><em>Breng de ster thuis</em></span><b aria-hidden="true">▶</b>`;
    adventure.addEventListener("click", () => this.enter("reis"));
    row.appendChild(adventure);

    if (this.game.save.journeyComplete()) {
      const arena = document.createElement("button");
      arena.type = "button";
      arena.className = "hub-arena";
      arena.dataset.mode = "bossRush";
      arena.setAttribute("aria-label", "Sterrenarena");
      arena.innerHTML = `<span aria-hidden="true">🏆</span><strong>Arena</strong>`;
      arena.addEventListener("click", () => this.enter("bossRush"));
      row.appendChild(arena);
    }
    return row;
  }

  private buildModeBrowser(): HTMLElement {
    const section = document.createElement("section");
    section.className = "hub-browser";
    const heading = document.createElement("div");
    heading.className = "hub-section-heading free";
    heading.innerHTML = `<span><small>VRIJ SPELEN</small><strong>Kies zelf</strong></span>`;

    const tabs = document.createElement("div");
    tabs.className = "hub-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Soort spelletje");
    const grid = document.createElement("div");
    grid.className = "hub-grid";
    grid.id = "hub-mode-panel";
    grid.setAttribute("role", "tabpanel");

    const renderModes = (): void => {
      grid.replaceChildren();
      PLAY_MODES.filter((mode) => mode.category === this.selectedCategory).forEach((mode) => grid.appendChild(this.buildModeCard(mode)));
      tabs.querySelectorAll<HTMLButtonElement>(".hub-tab").forEach((tab) => {
        const active = tab.dataset.category === this.selectedCategory;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      grid.setAttribute("aria-label", PLAY_CATEGORIES.find((category) => category.id === this.selectedCategory)?.label ?? "Spelletjes");
    };

    PLAY_CATEGORIES.forEach((category) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "hub-tab";
      tab.dataset.category = category.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", grid.id);
      tab.innerHTML = `<span aria-hidden="true">${category.emoji}</span><strong>${category.label}</strong>`;
      tab.addEventListener("click", () => {
        this.selectedCategory = category.id;
        renderModes();
      });
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const current = PLAY_CATEGORIES.findIndex((item) => item.id === this.selectedCategory);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? PLAY_CATEGORIES.length - 1
              : (current + (event.key === "ArrowRight" ? 1 : -1) + PLAY_CATEGORIES.length) % PLAY_CATEGORIES.length;
        this.selectedCategory = PLAY_CATEGORIES[next].id;
        renderModes();
        tabs.querySelector<HTMLButtonElement>(`.hub-tab[data-category="${this.selectedCategory}"]`)?.focus();
      });
      tabs.appendChild(tab);
    });

    renderModes();
    section.append(heading, tabs, grid);
    return section;
  }

  private buildModeCard(mode: PlayMode): HTMLButtonElement {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `hub-card ${mode.tone}`;
    card.dataset.mode = mode.scene;
    card.setAttribute("aria-label", mode.name);
    card.innerHTML = `<span class="hub-emoji" aria-hidden="true">${mode.emoji}</span><strong>${mode.name}</strong><small>${mode.desc}</small>`;
    card.addEventListener("click", () => this.enter(mode.scene));
    return card;
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
    openParentGate(() => this.game.showScene(scene), { holdToConfirm: scene === "profiles" });
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
