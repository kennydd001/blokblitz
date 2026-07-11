import type { Challenge } from "../../education/types";
import type { Game } from "../../game/Game";
import { countChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

const ANIMALS = ["🐣", "🐢", "🐠", "🐸", "🐝", "🦋", "🐞", "🦕"];

export class CountScene extends MiniGameScene {
  protected total = 5;
  protected readonly emoji = "🐣";
  protected readonly heading = "Tel mee";
  protected readonly instruction = "Tik elk diertje aan en tel hardop. Kies dan het juiste getal.";
  private counted = 0;
  private currentAnimal = ANIMALS[0];
  private rescuedAnimals: string[] = [];

  constructor(game: Game) {
    super(game, "count");
  }

  mount(): void {
    this.rescuedAnimals = [];
    super.mount();
  }

  protected makeChallenge(): Challenge {
    const max = this.tier() === 1 ? 5 : this.tier() === 2 ? 8 : 10;
    return countChallenge(this.focusQuantity(2, max));
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    this.counted = 0;
    const wrap = document.createElement("div");
    wrap.className = "mini-play count-play";

    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    this.currentAnimal = animal;
    const rescueTrail = document.createElement("div");
    rescueTrail.className = "count-rescue-trail";
    rescueTrail.setAttribute("aria-label", `${this.rescuedAnimals.length} van ${this.total} dierengroepjes gered`);
    for (let index = 0; index < this.total; index += 1) {
      const slot = document.createElement("span");
      slot.className = index < this.rescuedAnimals.length ? "rescued" : "waiting";
      slot.textContent = this.rescuedAnimals[index] ?? "🥚";
      slot.setAttribute("aria-hidden", "true");
      rescueTrail.appendChild(slot);
    }
    const field = document.createElement("div");
    field.className = "count-field";
    const counter = document.createElement("div");
    counter.className = "count-counter";
    counter.setAttribute("aria-live", "polite");
    counter.innerHTML = `<span>Geteld:</span><strong>0</strong><em>/ ${challenge.quantity}</em>`;
    const countStrong = counter.querySelector("strong") as HTMLElement;
    let unlockChoices = (): void => {};

    for (let i = 0; i < challenge.quantity; i += 1) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "count-item";
      item.setAttribute("aria-label", "diertje tellen");
      item.setAttribute("aria-pressed", "false");
      item.textContent = animal;
      item.addEventListener("click", () => {
        if (item.classList.contains("counted")) return;
        item.classList.add("counted");
        this.counted += 1;
        item.setAttribute("aria-pressed", "true");
        item.setAttribute("aria-label", `diertje ${this.counted} geteld`);
        countStrong.textContent = String(this.counted);
        this.game.audio.play("coin");
        this.game.haptics.play("coin");
        const spokenCount = this.counted;
        this.game.voice.sayNumberThen(
          spokenCount,
          () => {
            if (this.root.isConnected && spokenCount === challenge.quantity) unlockChoices();
          },
          { interrupt: spokenCount === 1 }
        );
      });
      field.appendChild(item);
    }

    const choices = document.createElement("div");
    choices.className = "mini-choices numeral-choices count-choices locked";
    choices.setAttribute("aria-label", "Tel eerst alle dieren");
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice numeral-choice";
      button.dataset.correct = String(option.isCorrect);
      button.disabled = true;
      button.setAttribute("aria-label", `Getal ${option.label}`);
      button.innerHTML = `<span class="mini-choice-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    unlockChoices = (): void => {
      choices.classList.remove("locked");
      choices.classList.add("ready");
      choices.setAttribute("aria-label", "Kies het juiste getal");
      choices.querySelectorAll<HTMLButtonElement>("button").forEach((button) => (button.disabled = false));
      counter.classList.add("complete");
      this.game.audio.play("rescue");
      this.game.haptics.play("rescue");
    };

    wrap.append(rescueTrail, field, counter, choices);
    return wrap;
  }

  protected onWrong(): void {
    this.root.querySelector('.numeral-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach("Tel nog eens rustig mee.");
  }

  // Signature moment: the counted animals do a happy wave, one by one.
  protected onCorrect(): void {
    const field = this.root.querySelector<HTMLElement>(".count-field");
    if (!field) return;
    field.classList.add("celebrating");
    field.querySelectorAll<HTMLElement>(".count-item").forEach((item, i) => {
      item.style.animationDelay = `${i * 0.07}s`;
    });
    if (this.rescuedAnimals.length < this.correctRounds) this.rescuedAnimals.push(this.currentAnimal);
    const slot = this.root.querySelectorAll<HTMLElement>(".count-rescue-trail span")[this.correctRounds - 1];
    if (slot) {
      slot.textContent = this.currentAnimal;
      slot.classList.remove("waiting");
      slot.classList.add("rescued", "arriving");
    }
    this.root
      .querySelector(".count-rescue-trail")
      ?.setAttribute("aria-label", `${this.correctRounds} van ${this.total} dierengroepjes gered`);
  }

  protected mountReplay(): void {
    this.rescuedAnimals = [];
    super.mountReplay();
  }
}
