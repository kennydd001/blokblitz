import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, Representation } from "../../education/types";
import type { Game } from "../../game/Game";
import { compareChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

const REPS: Representation[] = ["dots", "eggs", "pawprints", "blocks", "fingers"];

export class CompareScene extends MiniGameScene {
  protected readonly emoji = "🦖";
  protected readonly heading = "Wat is meer?";
  protected readonly instruction = "De dino heeft honger! Tik de groep met de MEESTE.";

  constructor(game: Game) {
    super(game, "compare");
  }

  protected makeChallenge(): Challenge {
    return compareChallenge(this.focusQuantity(2, 9));
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play compare-play";

    const dino = document.createElement("div");
    dino.className = "compare-dino";
    dino.innerHTML = `<span class="compare-dino-face" aria-hidden="true">🦖</span><span class="compare-feed-meter" aria-label="${this.correctRounds} van ${this.total} hapjes">${Array.from(
      { length: this.total },
      (_, index) => `<i class="${index < this.correctRounds ? "filled" : ""}"></i>`
    ).join("")}</span>`;

    // Same getalbeeld on both sides so the choice is purely about amount.
    const rep = REPS[Math.floor(Math.random() * REPS.length)];
    const choices = document.createElement("div");
    choices.className = "mini-choices compare-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice compare-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", option.isCorrect ? "meer" : "minder");
      button.innerHTML = `<div class="compare-art">${RepresentationFactory.renderSvg(rep, option.quantity ?? 1, { label: "groep" })}</div>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.append(dino, choices);
    return wrap;
  }

  protected onWrong(): void {
    this.root.querySelector('.compare-choice[data-correct="true"]')?.classList.add("reveal");
    this.root.querySelector(".compare-dino")?.classList.add("still-hungry");
    this.reteach("Tel beide groepjes en kijk goed.");
  }

  // Signature moment: the winning group gets the crown.
  protected onCorrect(): void {
    const winner = this.root.querySelector<HTMLElement>('.compare-choice[data-correct="true"]');
    if (!winner) return;
    winner.classList.add("winner");
    const crown = document.createElement("span");
    crown.className = "compare-crown";
    crown.setAttribute("aria-hidden", "true");
    crown.textContent = "👑";
    winner.appendChild(crown);

    const dino = this.root.querySelector<HTMLElement>(".compare-dino");
    const art = winner.querySelector<HTMLElement>(".compare-art");
    if (!dino || !art) return;
    dino.classList.add("eating");
    dino.querySelectorAll<HTMLElement>(".compare-feed-meter i")[this.correctRounds - 1]?.classList.add("filled", "fresh");
    dino.querySelector(".compare-feed-meter")?.setAttribute("aria-label", `${this.correctRounds} van ${this.total} hapjes`);
    const food = document.createElement("div");
    food.className = "compare-food-fly";
    food.innerHTML = art.innerHTML;
    const from = art.getBoundingClientRect();
    const to = dino.getBoundingClientRect();
    food.style.left = `${from.left + from.width / 2}px`;
    food.style.top = `${from.top + from.height / 2}px`;
    food.style.setProperty("--feed-x", `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
    food.style.setProperty("--feed-y", `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
    this.root.appendChild(food);
    this.later(() => food.remove(), 900);
  }
}
