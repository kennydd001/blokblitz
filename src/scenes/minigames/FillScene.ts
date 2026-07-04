import type { Challenge } from "../../education/types";
import type { Game } from "../../game/Game";
import { fillChallenge, pickedOption } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

export class FillScene extends MiniGameScene {
  protected readonly emoji = "🔟";
  protected readonly heading = "Vul de tien";
  protected readonly instruction = "Vul precies zoveel vakjes als het getal. Eerst de bovenste rij.";
  private built = 0;

  constructor(game: Game) {
    super(game, "fill");
  }

  protected makeChallenge(): Challenge {
    return fillChallenge(this.focusQuantity(3, 10));
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    this.built = 0;
    const target = challenge.quantity;
    const wrap = document.createElement("div");
    wrap.className = "mini-play fill-play";

    const goal = document.createElement("div");
    goal.className = "fill-goal";
    goal.innerHTML = `<small>Maak</small><strong>${target}</strong>`;

    const frame = document.createElement("div");
    frame.className = "ten-frame";
    const counter = document.createElement("div");
    counter.className = "fill-counter";
    const updateCounter = (): void => {
      counter.innerHTML = `<span>Nu:</span><strong>${this.built}</strong>`;
      counter.classList.toggle("match", this.built === target);
    };

    for (let i = 0; i < 10; i += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "ten-cell";
      cell.dataset.index = String(i);
      cell.setAttribute("aria-label", "vakje");
      cell.addEventListener("click", () => {
        const filled = cell.classList.toggle("filled");
        this.built += filled ? 1 : -1;
        this.game.audio.play(filled ? "build" : "soft-error");
        this.game.haptics.play("build");
        if (filled) this.game.voice.sayNumber(this.built, { interrupt: true });
        updateCounter();
      });
      frame.appendChild(cell);
    }
    updateCounter();

    const done = this.button("Klaar!", () => this.pick(pickedOption(this.built, target)));
    done.classList.add("play-now", "fill-done");

    wrap.append(goal, frame, counter, done);
    return wrap;
  }

  protected onWrong(): void {
    const target = this.current.quantity;
    const diff = target - this.built;
    const message = diff > 0 ? `Nog ${diff} erbij om ${target} te maken.` : `${Math.abs(diff)} te veel. Haal er ${Math.abs(diff)} weg.`;
    this.game.flashMessage(message, "warn");
  }

  // Signature moment: the filled frame does a wave, cell by cell.
  protected onCorrect(): void {
    const frame = this.root.querySelector<HTMLElement>(".ten-frame");
    if (!frame) return;
    frame.classList.add("filled-wave");
    frame.querySelectorAll<HTMLElement>(".ten-cell").forEach((cell, i) => {
      cell.style.animationDelay = `${i * 0.05}s`;
    });
  }
}
