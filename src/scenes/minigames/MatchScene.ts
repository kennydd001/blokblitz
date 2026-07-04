import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, Representation } from "../../education/types";
import type { Game } from "../../game/Game";
import { matchChallenge, shuffle } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

const REP_POOL: Representation[] = ["dots", "dice", "tenframe", "fingers", "beads", "domino", "eggs", "blocks"];

export class MatchScene extends MiniGameScene {
  protected readonly emoji = "🧩";
  protected readonly heading = "Zoek hetzelfde";
  protected readonly instruction = "Welke groep heeft even veel als deze?";

  constructor(game: Game) {
    super(game, "match");
  }

  protected makeChallenge(): Challenge {
    return matchChallenge(this.focusQuantity(2, 8));
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play match-play";

    // Give the target and every option a different getalbeeld so the child learns
    // to recognise the same amount across patterns.
    const reps = shuffle(REP_POOL);
    const targetRep = reps[0];
    const optionReps = reps.slice(1);

    const target = document.createElement("div");
    target.className = "match-target";
    target.innerHTML = `<small>Zoek even veel als:</small><div class="match-art">${RepresentationFactory.renderSvg(targetRep, challenge.quantity, { label: "doel" })}</div>`;

    const choices = document.createElement("div");
    choices.className = "mini-choices match-choices";
    challenge.options.forEach((option, index) => {
      const rep = optionReps[index % optionReps.length];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice match-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", option.isCorrect ? "even veel" : "niet even veel");
      button.innerHTML = `<div class="match-art">${RepresentationFactory.renderSvg(rep, option.quantity ?? 1, { label: "keuze" })}</div>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.append(target, choices);
    return wrap;
  }

  protected onWrong(): void {
    this.root.querySelector('.match-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.flashMessage("Tel beide groepjes en kijk goed.", "warn");
  }

  // Signature moment: the target and its twin light up together — "same!".
  protected onCorrect(): void {
    this.root.querySelector(".match-target")?.classList.add("twin-glow");
    this.root.querySelector('.match-choice[data-correct="true"]')?.classList.add("twin-glow");
  }
}
