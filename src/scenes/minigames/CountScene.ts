import type { Challenge } from "../../education/types";
import type { Game } from "../../game/Game";
import { countChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

const ANIMALS = ["🐣", "🐢", "🐠", "🐸", "🐝", "🦋", "🐞", "🦕"];

export class CountScene extends MiniGameScene {
  protected readonly emoji = "🐣";
  protected readonly heading = "Tel mee";
  protected readonly instruction = "Tik elk diertje aan en tel hardop. Kies dan het juiste getal.";
  private counted = 0;

  constructor(game: Game) {
    super(game, "count");
  }

  protected makeChallenge(): Challenge {
    return countChallenge(this.focusQuantity(2, 6));
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    this.counted = 0;
    const wrap = document.createElement("div");
    wrap.className = "mini-play count-play";

    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const field = document.createElement("div");
    field.className = "count-field";
    const counter = document.createElement("div");
    counter.className = "count-counter";
    counter.innerHTML = `<span>Geteld:</span><strong>0</strong>`;
    const countStrong = counter.querySelector("strong") as HTMLElement;

    for (let i = 0; i < challenge.quantity; i += 1) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "count-item";
      item.setAttribute("aria-label", "diertje tellen");
      item.textContent = animal;
      item.addEventListener("click", () => {
        if (item.classList.contains("counted")) return;
        item.classList.add("counted");
        this.counted += 1;
        countStrong.textContent = String(this.counted);
        this.game.audio.play("coin");
        this.game.haptics.play("coin");
        this.game.voice.sayNumber(this.counted, { interrupt: true });
      });
      field.appendChild(item);
    }

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

    wrap.append(field, counter, choices);
    return wrap;
  }

  protected onWrong(): void {
    this.root.querySelector('.numeral-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.flashMessage("Tel nog eens rustig mee.", "warn");
  }
}
