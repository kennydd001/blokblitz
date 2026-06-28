import type { Challenge } from "../../education/types";
import type { Game } from "../../game/Game";
import { splitbordChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

// The rekenbordje met 3 vakjes: one "samen" (total) box on top and two part
// boxes below. Depending on the round the child picks the two parts, the missing
// part, or the total. The board layout itself carries the structure; the tap row
// is the answer. Logs as the existing `partwhole` skill.
export class SplitbordScene extends MiniGameScene {
  protected readonly emoji = "⚖️";
  protected readonly heading = "Splitsbord";

  constructor(game: Game) {
    super(game, "splitbord");
  }

  protected makeChallenge(): Challenge {
    const challenge = splitbordChallenge(this.focusQuantity(3, 10));
    this.instruction = challenge.prompt;
    return challenge;
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    // mechanic = "split|<mode>|<totalDisplay>|<leftDisplay>|<rightDisplay>"
    const [, , totalD = "?", leftD = "?", rightD = "?"] = challenge.mechanic.split("|");
    const wrap = document.createElement("div");
    wrap.className = "mini-play splitbord-play";

    const board = document.createElement("div");
    board.className = "splitbord-board";
    board.innerHTML = `
      <div class="splitbord-total ${totalD === "?" ? "empty" : ""}"><span class="splitbord-box-label">samen</span><b>${totalD}</b></div>
      <div class="splitbord-stem" aria-hidden="true"></div>
      <div class="splitbord-parts">
        <div class="splitbord-part ${leftD === "?" ? "empty" : ""}"><b>${leftD}</b></div>
        <span class="splitbord-plus" aria-hidden="true">+</span>
        <div class="splitbord-part ${rightD === "?" ? "empty" : ""}"><b>${rightD}</b></div>
      </div>
    `;

    const choices = document.createElement("div");
    choices.className = "mini-choices splitbord-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice splitbord-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", option.label);
      button.innerHTML = `<span class="splitbord-choice-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.append(board, choices);
    return wrap;
  }

  protected onWrong(): void {
    this.root.querySelector('.splitbord-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.flashMessage(this.current.hint || "Samen is het nog niet zoveel. Kijk naar het lege vak.", "warn");
  }
}
