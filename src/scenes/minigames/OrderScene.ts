import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge } from "../../education/types";
import type { Game } from "../../game/Game";
import { orderChallenge, resultOption } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

export class OrderScene extends MiniGameScene {
  protected readonly emoji = "🔢";
  protected readonly heading = "Op volgorde";
  private order: number[] = [];
  private expected = 0;

  constructor(game: Game) {
    super(game, "order");
  }

  protected makeChallenge(): Challenge {
    const challenge = orderChallenge(this.focusQuantity(3, 4));
    this.order = challenge.options.map((option) => option.quantity ?? 1).sort((a, b) => a - b);
    this.expected = 0;
    this.instruction = "Tik de getallen van klein naar groot.";
    return challenge;
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play order-play";

    const row = document.createElement("div");
    row.className = "order-row";
    challenge.options.forEach((option) => {
      const quantity = option.quantity ?? 1;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "order-card";
      card.dataset.quantity = String(quantity);
      card.setAttribute("aria-label", `Getal ${quantity}`);
      card.innerHTML = `
        <span class="order-rank" aria-hidden="true"></span>
        <div class="order-art">${RepresentationFactory.renderSvg("dots", quantity, { label: String(quantity) })}</div>
        <strong>${quantity}</strong>
      `;
      card.addEventListener("click", () => this.tap(card, quantity));
      row.appendChild(card);
    });

    wrap.append(row);
    return wrap;
  }

  private tap(card: HTMLElement, quantity: number): void {
    if (this.resolving || card.classList.contains("placed")) return;
    if (quantity === this.order[this.expected]) {
      card.classList.add("placed");
      const rank = card.querySelector(".order-rank");
      if (rank) rank.textContent = String(this.expected + 1);
      this.expected += 1;
      this.game.audio.play("coin");
      this.game.haptics.play("coin");
      this.game.voice.sayNumber(quantity, { interrupt: true });
      if (this.expected >= this.order.length) this.pick(resultOption(true));
    } else {
      this.hintUsed = true;
      this.game.audio.play("soft-error");
      const next = this.root.querySelector<HTMLElement>(`.order-card[data-quantity="${this.order[this.expected]}"]:not(.placed)`);
      next?.classList.remove("hintnext");
      void next?.offsetWidth;
      next?.classList.add("hintnext");
      this.reteach("Zoek het kleinste getal dat nog over is.");
    }
  }

  // Signature moment: the finished row dances in order, small to big.
  protected onCorrect(): void {
    const row = this.root.querySelector<HTMLElement>(".order-row");
    if (!row) return;
    row.classList.add("wave");
    row.querySelectorAll<HTMLElement>(".order-card").forEach((card, i) => {
      card.style.animationDelay = `${i * 0.09}s`;
    });
  }
}
