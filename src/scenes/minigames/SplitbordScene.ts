import type { Challenge, ChallengeOption } from "../../education/types";
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
    const [, mode, totalD = "?", leftD = "?", rightD = "?"] = challenge.mechanic.split("|");
    const wrap = document.createElement("div");
    wrap.className = "mini-play splitbord-play";

    const board = document.createElement("div");
    board.className = "splitbord-board";
    board.innerHTML = `
      <div class="splitbord-total ${totalD === "?" ? "empty" : ""}"><span class="splitbord-box-label">samen</span><b>${totalD}</b></div>
      <div class="splitbord-stem" aria-hidden="true"></div>
      <div class="splitbord-parts">
        <div class="splitbord-part ${leftD === "?" ? "empty" : ""}"><b>${leftD}</b><span class="splitbord-nest" aria-hidden="true"></span></div>
        <span class="splitbord-plus" aria-hidden="true">+</span>
        <div class="splitbord-part ${rightD === "?" ? "empty" : ""}"><b>${rightD}</b><span class="splitbord-nest" aria-hidden="true"></span></div>
      </div>
    `;

    const choices = document.createElement("div");
    choices.className = "mini-choices splitbord-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice splitbord-choice";
      button.dataset.correct = String(option.isCorrect);
      button.dataset.value = String(option.value ?? option.label);
      button.setAttribute("aria-label", option.label);
      button.innerHTML = `<span class="splitbord-choice-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.appendChild(board);
    // Hands-on rekenbordje: for the "which part is missing?" rounds the child
    // gets a tray with ALL the eggs (the total) and taps them INTO the empty
    // box — seeing and feeling how many still fit. When the built amount
    // matches an answer, that numeral lights up; the tap on it stays the
    // confirmation (same challenge + logging as before).
    if (mode === "pick-missing" && totalD !== "?") {
      wrap.appendChild(this.buildEggTray(Number(totalD), board, choices));
    }
    wrap.appendChild(choices);
    return wrap;
  }

  private buildEggTray(total: number, board: HTMLElement, choices: HTMLElement): HTMLElement {
    const tray = document.createElement("div");
    tray.className = "splitbord-tray";
    tray.setAttribute("aria-label", "Tik eieren in het lege vak");
    const nest = board.querySelector<HTMLElement>(".splitbord-part.empty .splitbord-nest");
    const sync = (): void => {
      const built = nest?.childElementCount ?? 0;
      choices.querySelectorAll<HTMLElement>(".splitbord-choice").forEach((button) => {
        button.classList.toggle("suggest", Number(button.dataset.value) === built && built > 0);
      });
    };
    for (let i = 0; i < total; i += 1) {
      const egg = document.createElement("button");
      egg.type = "button";
      egg.className = "splitbord-egg";
      egg.setAttribute("aria-label", "ei");
      egg.textContent = "🥚";
      egg.addEventListener("click", () => {
        if (this.resolving || !nest) return;
        if (egg.parentElement === tray) {
          nest.appendChild(egg);
          this.game.audio.play("coin");
        } else {
          tray.appendChild(egg);
          this.game.audio.play("snap");
        }
        egg.classList.remove("hop");
        void egg.offsetWidth;
        egg.classList.add("hop");
        sync();
      });
      tray.appendChild(egg);
    }
    return tray;
  }

  protected onWrong(): void {
    this.root.querySelector('.splitbord-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.flashMessage(this.current.hint || "Samen is het nog niet zoveel. Kijk naar het lege vak.", "warn");
  }

  // Signature moment: the split CLICKS together and the missing numbers LAND
  // in their dashed boxes. The mechanic packs the DISPLAY state
  // ("split|mode|total|left|right" with "?" for hidden), so real values are
  // derived: the missing one from the other two, or from the chosen pair.
  protected onCorrect(option: ChallengeOption): void {
    const board = this.root.querySelector<HTMLElement>(".splitbord-board");
    if (!board) return;
    board.classList.add("snapped");
    const [, , totalD, leftD, rightD] = (this.current.mechanic || "").split("|");
    const num = (s?: string) => (s && s !== "?" ? Number(s) : undefined);
    let total = num(totalD);
    let left = num(leftD);
    let right = num(rightD);
    if (left === undefined && right === undefined) {
      const pair = String(option.label ?? "").match(/\d+/g);
      if (pair && pair.length >= 2) {
        left = Number(pair[0]);
        right = Number(pair[1]);
      }
    }
    if (total === undefined && left !== undefined && right !== undefined) total = left + right;
    if (left === undefined && total !== undefined && right !== undefined) left = total - right;
    if (right === undefined && total !== undefined && left !== undefined) right = total - left;
    const land = (box: HTMLElement, value: number | undefined) => {
      if (value === undefined) return;
      box.classList.add("landed");
      const b = box.querySelector("b");
      if (b) b.textContent = String(value);
    };
    const totalBox = board.querySelector<HTMLElement>(".splitbord-total.empty");
    if (totalBox) land(totalBox, total);
    board.querySelectorAll<HTMLElement>(".splitbord-part").forEach((box, i) => {
      if (box.classList.contains("empty")) land(box, i === 0 ? left : right);
    });
  }
}
