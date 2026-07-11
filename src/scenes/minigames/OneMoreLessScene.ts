import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, Representation } from "../../education/types";
import type { Game } from "../../game/Game";
import { oneMoreLessChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

export class OneMoreLessScene extends MiniGameScene {
  protected readonly emoji = "➕";
  protected readonly heading = "Eentje erbij";
  private base = 3;
  private more = true;
  private target = 4;
  private representation: Representation = "dots";

  constructor(game: Game) {
    super(game, "onemoreless");
  }

  protected makeChallenge(): Challenge {
    this.more = Math.random() < 0.6;
    this.base = this.focusQuantity(2, 9);
    this.instruction = this.more ? `Wat is eentje MEER dan ${this.base}?` : `Wat is eentje MINDER dan ${this.base}?`;
    const challenge = oneMoreLessChallenge(this.base, this.more);
    this.target = Number(challenge.correctAnswer);
    const pool: Representation[] = this.target <= 5 ? ["dots", "fiveframe", "blocks"] : ["dots", "tenframe", "beads"];
    this.representation = pool[Math.floor(Math.random() * pool.length)];
    return challenge;
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play onemore-play";

    const base = document.createElement("div");
    base.className = `onemore-base ${this.more ? "more" : "less"}`;
    const before = document.createElement("div");
    before.className = "onemore-state before";
    before.innerHTML = `<small>NU</small><div class="onemore-art">${RepresentationFactory.renderSvg(this.representation, this.base, { label: `nu ${this.base}` })}</div><strong>${this.base}</strong>`;
    const sign = document.createElement("div");
    sign.className = "onemore-sign";
    sign.setAttribute("aria-hidden", "true");
    sign.textContent = this.more ? "➕1" : "➖1";
    const after = document.createElement("div");
    after.className = "onemore-state after";
    after.setAttribute("aria-live", "polite");
    after.innerHTML = `<small>DAARNA</small><span class="onemore-mystery" aria-hidden="true">?</span>`;
    base.append(before, sign, after);

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
    this.revealAfter(true);
    this.reteach(this.more ? "Tel eentje verder." : "Tel eentje terug.");
  }

  // Signature moment: the group bounces and an arrow shows the step taken.
  protected onCorrect(): void {
    const base = this.root.querySelector<HTMLElement>(".onemore-base");
    if (!base) return;
    this.revealAfter(false);
    base.classList.add("stepped");
    const arrow = document.createElement("span");
    arrow.className = "onemore-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = this.more ? "⬆️" : "⬇️";
    base.appendChild(arrow);
  }

  private revealAfter(teaching: boolean): void {
    const after = this.root.querySelector<HTMLElement>(".onemore-state.after");
    if (!after) return;
    if (after.classList.contains("revealed")) {
      if (!teaching) {
        after.classList.remove("teaching");
        after.classList.add("success");
      }
      return;
    }
    after.classList.add("revealed", teaching ? "teaching" : "success");
    after.innerHTML = `<small>DAARNA</small><div class="onemore-art">${RepresentationFactory.renderSvg(this.representation, this.target, { label: `daarna ${this.target}` })}</div><strong>${this.target}</strong>`;
  }
}
