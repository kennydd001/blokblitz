import { stickerById } from "../data/stickers";
import type { Game } from "../game/Game";
import type { RunSummary } from "../runner/RunnerCore";
import type { HeroSkin } from "../runner/skins";
import { getWorld, nextWorldId, type WorldDef } from "../runner/worlds";
import { BaseScene } from "./SceneUtils";

interface ResultsParams {
  summary: RunSummary;
  stars: number;
  world: WorldDef;
  newWorldUnlocked: boolean;
  totalStars: number;
  newBest: boolean;
  unlocked: HeroSkin[];
}

export class ResultsScene extends BaseScene {
  constructor(game: Game) {
    super(game, "results");
  }

  mount(params?: unknown): void {
    super.mount();
    this.game.resetWorld("summary");
    const data = this.game.data();
    const fallback: ResultsParams = {
      summary: { distanceMeters: 0, coins: 0, runStars: 0, bonusStars: 0, gatesCorrect: 0, gatesTotal: 0, bestCombo: 0, perfect: false },
      stars: 1,
      world: getWorld(undefined),
      newWorldUnlocked: false,
      totalStars: data.progress.stars,
      newBest: false,
      unlocked: []
    };
    const result = (params as ResultsParams | undefined) ?? fallback;
    const { summary, world } = result;
    const runStars = summary.runStars + summary.bonusStars;

    this.root.classList.add("results-scene", "centered");

    const burst = document.createElement("div");
    burst.className = "results-burst";
    burst.setAttribute("aria-hidden", "true");
    burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";

    const card = document.createElement("div");
    card.className = "results-card";

    const eyebrow = document.createElement("p");
    eyebrow.className = "results-eyebrow";
    eyebrow.textContent = `${world.emoji} ${world.name}`;

    const title = document.createElement("h1");
    title.className = "results-title";
    title.textContent = result.stars >= 3 ? "PERFECT!" : result.stars >= 2 ? "SUPER GEDAAN!" : "Goed geprobeerd!";

    // Big 1-3 star rating.
    const starRow = document.createElement("div");
    starRow.className = "results-star-rating";
    starRow.dataset.stars = String(result.stars);
    for (let i = 0; i < 3; i += 1) {
      const star = document.createElement("span");
      star.className = `rating-star${i < result.stars ? " earned" : ""}`;
      star.textContent = "★";
      star.style.setProperty("--i", String(i));
      starRow.appendChild(star);
    }

    const sub = document.createElement("p");
    sub.className = "results-sub";
    sub.textContent = `Je liep ${summary.gatesCorrect} van de ${summary.gatesTotal} poorten goed.`;

    const stats = document.createElement("div");
    stats.className = "results-stats";
    stats.append(
      this.bigStat("⭐", `+${runStars}`, "sterren"),
      this.bigStat("🟦", `+${summary.coins}`, "blokken"),
      this.bigStat("🏁", `${summary.distanceMeters} m`, result.newBest ? "NIEUW RECORD!" : `record ${data.progress.bestRunDistance} m`, result.newBest)
    );

    card.append(eyebrow, title, starRow, sub, stats);

    if (summary.bestCombo >= 3) {
      const combo = document.createElement("div");
      combo.className = "results-combo";
      combo.textContent = `🔥 Beste combo: x${summary.bestCombo}`;
      card.appendChild(combo);
    }

    if (result.newWorldUnlocked) {
      const nextId = nextWorldId(world.id);
      const next = nextId ? getWorld(nextId) : undefined;
      const unlock = document.createElement("div");
      unlock.className = "results-unlock world";
      unlock.innerHTML = `<strong>Nieuwe wereld open: ${next?.emoji ?? "🌟"} ${next?.name ?? ""}!</strong><span>${next?.blurb ?? ""}</span>`;
      card.appendChild(unlock);
    }

    for (const skin of result.unlocked) {
      const unlock = document.createElement("div");
      unlock.className = "results-unlock";
      unlock.innerHTML = `<strong>Nieuwe held: ${skin.name}!</strong><span>${skin.blurb}</span>`;
      card.appendChild(unlock);
    }

    const newStickers = this.game.save
      .syncStickers()
      .map((id) => stickerById(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    for (const sticker of newStickers) {
      const banner = document.createElement("div");
      banner.className = "results-unlock sticker";
      banner.innerHTML = `<span class="sticker-pop" aria-hidden="true">${sticker.emoji}</span><strong>Nieuwe sticker: ${sticker.name}!</strong>`;
      card.appendChild(banner);
    }

    this.game.voice.speak(
      result.newWorldUnlocked ? "Knap! Een nieuwe wereld is open!" : result.stars >= 3 ? "Perfect gelopen!" : "Goed gedaan!",
      { interrupt: true, pitch: 1.2 }
    );

    const actions = document.createElement("div");
    actions.className = "results-actions";
    const nextId = nextWorldId(world.id);
    if (result.newWorldUnlocked && nextId) {
      const next = this.button("Volgende! ▶", () => this.playWorld(nextId));
      next.classList.add("play-now");
      actions.appendChild(next);
      actions.append(this.button("Nog eens", () => this.playWorld(world.id), "secondary"), this.button("Kaart", () => this.game.showScene("mainMenu"), "ghost"));
    } else {
      const again = this.button("Nog eens!", () => this.playWorld(world.id));
      again.classList.add("play-now");
      actions.append(again, this.button("Kaart", () => this.game.showScene("mainMenu"), "secondary"));
    }
    card.appendChild(actions);

    this.root.append(burst, card);
  }

  private bigStat(icon: string, value: string, label: string, highlight = false): HTMLElement {
    const stat = document.createElement("div");
    stat.className = `results-stat${highlight ? " highlight" : ""}`;
    stat.innerHTML = `<span class="results-stat-icon" aria-hidden="true">${icon}</span><strong>${value}</strong><small>${label}</small>`;
    return stat;
  }

  private playWorld(worldId: string): void {
    this.game.requestFullscreenPlay();
    this.game.save.startNewSession();
    this.game.showScene("run", { worldId });
  }
}
