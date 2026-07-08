import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge } from "../../education/types";
import type { Game } from "../../game/Game";
import { oneMoreLessChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

export class OneMoreLessScene extends MiniGameScene {
  protected readonly emoji = "➕";
  protected readonly heading = "Eentje erbij";
  private base = 3;
  private more = true;

  constructor(game: Game) {
    super(game, "onemoreless");
  }

  protected makeChallenge(): Challenge {
    this.more = Math.random() < 0.6;
    this.base = this.focusQuantity(2, 9);
    this.instruction = this.more ? `Wat is eentje MEER dan ${this.base}?` : `Wat is eentje MINDER dan ${this.base}?`;
    return oneMoreLessChallenge(this.base, this.more);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play onemore-play";

    const base = document.createElement("div");
    base.className = `onemore-base ${this.more ? "more" : "less"}`;
    base.innerHTML = `
      <div class="onemore-art">${RepresentationFactory.renderSvg("dots", this.base, { label: "nu" })}</div>
      <div class="onemore-sign" aria-hidden="true">${this.more ? "➕1" : "➖1"}</div>
    `;

    const choices = document.createElement("div");
    choices.className = "mini-choices numeral-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice numeral-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", `Getal ${option.label}`);
      button.innerHTML = `<span class="mini-choice-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.append(base, choices);
    return wrap;
  }

  protected onWrong(): void {
    this.root.querySelector('.numeral-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach(this.more ? "Tel eentje verder." : "Tel eentje terug.");
  }

  // Signature moment: the group bounces and an arrow shows the step taken.
  protected onCorrect(): void {
    const base = this.root.querySelector<HTMLElement>(".onemore-base");
    if (!base) return;
    base.classList.add("stepped");
    const arrow = document.createElement("span");
    arrow.className = "onemore-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = this.more ? "⬆️" : "⬇️";
    base.appendChild(arrow);
  }
}
