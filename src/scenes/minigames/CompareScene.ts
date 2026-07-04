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
    dino.textContent = "🦖";

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
    this.game.flashMessage("Tel de stippen: welke heeft er meer?", "warn");
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
  }
}
