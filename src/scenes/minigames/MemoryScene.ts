import { stickerById } from "../../data/stickers";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Representation } from "../../education/types";
import type { Game } from "../../game/Game";
import { BaseScene } from "../SceneUtils";
import { memoryMatchChallenge, shuffle } from "./miniChallenges";
import { buildDoneScreen } from "./miniUi";

interface MemoryCard {
  quantity: number;
  contentHtml: string;
  el: HTMLButtonElement;
  matched: boolean;
  flipped: boolean;
}

const ART_REPS: Representation[] = ["dots", "dice", "tenframe", "fingers", "domino", "eggs", "blocks", "fiveframe", "beads"];
const BACK = '<span class="memory-back" aria-hidden="true">★</span>';

export class MemoryScene extends BaseScene {
  private cards: MemoryCard[] = [];
  private first?: MemoryCard;
  private lock = false;
  private flips = 0;
  private matchedCount = 0;
  private pairCount = 4;
  private attemptStart = 0;
  private timers: number[] = [];

  constructor(game: Game) {
    super(game, "memory");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    this.root.classList.add("mini-scene", "centered");
    this.startBoard();
  }

  unmount(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    this.game.voice.cancel();
    super.unmount();
  }

  private startBoard(): void {
    this.cards = [];
    this.first = undefined;
    this.lock = false;
    this.flips = 0;
    this.matchedCount = 0;

    const tier = this.game.difficultyTier();
    this.pairCount = tier === 1 ? 3 : tier === 2 ? 4 : 5;
    const maxQuantity = tier === 1 ? 5 : tier === 2 ? 8 : 10;
    // Each amount appears once as a numeral and once as a getalbeeld.
    const quantities = shuffle(Array.from({ length: maxQuantity }, (_, index) => index + 1)).slice(0, this.pairCount);
    const deck: { quantity: number; contentHtml: string }[] = [];
    quantities.forEach((q) => {
      const rep = ART_REPS[Math.floor(Math.random() * ART_REPS.length)];
      deck.push({ quantity: q, contentHtml: `<span class="memory-num">${q}</span>` });
      deck.push({ quantity: q, contentHtml: `<div class="memory-art">${RepresentationFactory.renderSvg(rep, q, { label: String(q) })}</div>` });
    });

    const header = document.createElement("div");
    header.className = "mini-header";
    const home = this.iconButton("Terug", "back", () => this.game.showScene(this.returnScene()));
    home.classList.add("mini-home");
    const title = document.createElement("div");
    title.className = "mini-title";
    title.innerHTML = `<span aria-hidden="true">🧠</span><strong>Memory</strong>`;
    header.append(home, title);

    const instruction = document.createElement("div");
    instruction.className = "mini-instruction";
    instruction.textContent = "Zoek de paren: het getal en het groepje met even veel.";

    const board = document.createElement("div");
    board.className = "memory-board";
    board.dataset.tier = String(tier);
    board.style.setProperty("--memory-columns", String(this.pairCount));
    board.style.setProperty("--memory-board-width", `${this.pairCount * 100 + 40}px`);
    shuffle(deck).forEach((entry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-card";
      button.dataset.quantity = String(entry.quantity);
      button.setAttribute("aria-label", "gesloten geheugenkaart");
      button.innerHTML = BACK;
      const card: MemoryCard = { quantity: entry.quantity, contentHtml: entry.contentHtml, el: button, matched: false, flipped: false };
      button.addEventListener("click", () => this.flip(card));
      board.appendChild(button);
      this.cards.push(card);
    });

    this.root.replaceChildren(header, instruction, board);
    this.game.voice.speak("Zoek de paren: het getal en het groepje met even veel.", { interrupt: true });
  }

  private flip(card: MemoryCard): void {
    if (this.lock || card.matched || card.flipped) return;
    card.flipped = true;
    card.el.classList.add("flipped");
    card.el.innerHTML = card.contentHtml;
    card.el.setAttribute("aria-label", `kaart met ${card.quantity}`);

    if (!this.first) {
      this.first = card;
      this.attemptStart = performance.now();
      this.game.voice.sayNumber(card.quantity, { interrupt: true });
      return;
    }

    const first = this.first;
    this.first = undefined;
    this.lock = true;
    this.flips += 1;
    const matched = first.quantity === card.quantity;
    const { challenge, option } = memoryMatchChallenge(first.quantity, matched);
    this.game.recordAttempt(challenge, option, this.attemptStart, false);
    this.game.voice.sayNumberThen(
      card.quantity,
      () => {
        if (this.root.isConnected) this.resolvePair(first, card, matched);
      },
      { interrupt: false }
    );
  }

  private resolvePair(first: MemoryCard, card: MemoryCard, matched: boolean): void {
    if (matched) {
      first.matched = true;
      card.matched = true;
      first.el.classList.add("matched");
      card.el.classList.add("matched");
      first.el.setAttribute("aria-disabled", "true");
      card.el.setAttribute("aria-disabled", "true");
      first.el.setAttribute("aria-label", `paar ${first.quantity} gevonden`);
      card.el.setAttribute("aria-label", `paar ${card.quantity} gevonden`);
      // Signature moment: both twins of the pair get a spark.
      for (const el of [first.el, card.el]) {
        const spark = document.createElement("span");
        spark.className = "memory-spark";
        spark.setAttribute("aria-hidden", "true");
        spark.textContent = "💫";
        el.appendChild(spark);
      }
      this.game.voice.praise();
      this.matchedCount += 1;
      if (this.matchedCount >= this.pairCount) {
        this.lock = true;
        this.timers.push(window.setTimeout(() => this.finish(), 700));
      } else this.lock = false;
    } else {
      this.timers.push(
        window.setTimeout(() => {
          for (const c of [first, card]) {
            c.flipped = false;
            c.el.classList.remove("flipped");
            c.el.innerHTML = BACK;
            c.el.setAttribute("aria-label", "gesloten geheugenkaart");
          }
          this.lock = false;
        }, 850)
      );
    }
  }

  private finish(): void {
    this.game.audio.play("win");
    this.game.haptics.play("win");
    const extra = this.flips - this.pairCount;
    const stars = extra <= 1 ? 3 : extra <= 4 ? 2 : 1;
    if (this.game.lastJourneyNode) this.game.save.advanceJourney(this.game.lastJourneyNode);
    const daily = this.game.completeActivity(this.name);
    this.game.save.bumpTreasure();
    if (daily.rewardEarned) this.game.voice.speak("Alle drie missies klaar! Tien bonussterren!", { interrupt: false, pitch: 1.2 });
    else if (daily.newlyCompleted) this.game.voice.speak("Dagmissie klaar!", { interrupt: false, pitch: 1.18 });
    else this.game.voice.speak(stars >= 3 ? "Perfect geheugen!" : "Goed gedaan!", { interrupt: false, pitch: 1.25 });
    const newStickers = this.game.save
      .syncStickers()
      .map((id) => stickerById(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ emoji: s.emoji, name: s.name }));
    this.root.replaceChildren(
      buildDoneScreen({
        emoji: "🧠",
        heading: "Memory",
        stars,
        sub: `Alle paren gevonden in ${this.flips} beurten!`,
        newStickers,
        dailyMission: daily.newlyCompleted
          ? { completedCount: daily.completedCount, total: daily.total, rewardEarned: daily.rewardEarned }
          : undefined,
        onReplay: () => this.startBoard(),
        homeLabel: this.game.lastJourneyNode ? "Verder" : "Speeltuin",
        onHome: () => this.game.showScene(this.returnScene())
      })
    );
  }

  private returnScene(): string {
    return this.game.lastJourneyNode ? "reis" : "hub";
  }
}
