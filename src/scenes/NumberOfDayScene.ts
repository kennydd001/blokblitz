import { dutchQuantityName } from "../education/quantityNames";
import { stableQuantityFromDate } from "../education/quantityLayouts";
import { RepresentationFactory } from "../education/representations/RepresentationFactory";
import type { Challenge } from "../education/types";
import type { Game } from "../game/Game";
import { adventureBridge, BaseScene, missionRibbon, rewardStrip, sceneHeader, type RewardBadge } from "./SceneUtils";

export class NumberOfDayScene extends BaseScene {
  private namingLogged = false;
  private startedAt = 0;

  constructor(game: Game) {
    super(game, "number-of-day");
  }

  mount(): void {
    super.mount();
    this.startedAt = performance.now();
    this.namingLogged = false;
    this.render();
  }

  private render(): void {
    this.game.resetWorld("summary");
    this.root.replaceChildren();
    const number = stableQuantityFromDate();
    this.game.save.updateProgress((progress) => {
      progress.numberOfDay = number;
    });
    const panel = document.createElement("div");
    panel.className = "number-day-panel";
    panel.dataset.numberWorld = "portal";
    panel.innerHTML = `
      <div class="number-portal ${this.namingLogged ? "awake" : ""}" data-number-portal="true">
        <div class="portal-ring" aria-hidden="true"></div>
        <div class="number-stone" aria-label="Getal van de dag ${number}">${number}</div>
        <div class="portal-ground" aria-hidden="true"></div>
      </div>
      <h2>Getalpoort</h2>
    `;
    const reps = document.createElement("div");
    reps.className = "representation-row";
    [
      { label: "Eieren", representation: "eggs" as const },
      { label: "Tienveld", representation: "tenframe" as const },
      { label: "Kralen", representation: "beads" as const },
      { label: "Cijfer", representation: "numeral" as const }
    ].forEach((item) => {
      const node = document.createElement("div");
      node.className = "number-rune";
      node.innerHTML = `
        <span>${item.label}</span>
        ${RepresentationFactory.renderSvg(item.representation, number)}
      `;
      reps.appendChild(node);
    });

    const name = dutchQuantityName(number);
    const naming = document.createElement("div");
    naming.className = "naming-practice";
    naming.innerHTML = `
      <p class="eyebrow">Maak de poort wakker</p>
      <strong>Zeg hardop: ${name}</strong>
      <span>${number} is ${name}</span>
    `;
    if (!this.namingLogged) {
      const nameButton = this.button(`Wek ${name}`, () => this.recordNaming(number), "secondary");
      nameButton.classList.add("wake-button");
      naming.appendChild(nameButton);
    } else {
      const rewards: RewardBadge[] = [
        { label: "Ster", value: "+1", tone: "star" },
        { label: "Blok", value: "+1", tone: "build" }
      ];
      naming.appendChild(rewardStrip(rewards, "Getalnaam wakker."));
      const sprintButton = this.button(
        "Naar Sprint",
        () => {
          this.game.showScene("runner");
          this.game.adventureToast("number", "sprint", "Rennen!");
        },
        "primary"
      );
      sprintButton.classList.add("portal-run-button");
      naming.appendChild(sprintButton);
    }

    panel.append(
      reps,
      naming,
      adventureBridge("number", "sprint", this.namingLogged ? "Poort open" : "Wek eerst")
    );
    this.root.append(sceneHeader("Vandaag bouwen we met structuur"), missionRibbon(1), panel);
  }

  private recordNaming(quantity: number): void {
    if (this.namingLogged) return;
    const name = dutchQuantityName(quantity);
    const challenge: Challenge = {
      id: `number-name-${quantity}`,
      levelId: "number-of-day-name",
      challengeType: "number-name",
      title: "Getalnaam",
      prompt: `Zeg ${name}`,
      scene: "minigame",
      skill: "quantityToNumeral",
      representation: "mixed",
      promptRepresentation: "mixed",
      answerRepresentation: "numeral",
      quantity,
      correctAnswer: name,
      displayTimeMs: 1600,
      options: [
        {
          id: `said-${quantity}`,
          label: name,
          value: name,
          quantity,
          representation: "numeral",
          svg: RepresentationFactory.renderSvg("numeral", quantity, { label: `${quantity} ${name}` }),
          isCorrect: true
        }
      ],
      mechanic: "Zeg de getalnaam die bij het structuurbeeld hoort.",
      successEffect: "De getalnaam licht op voor de sprint.",
      safeErrorEffect: "Het getal wacht en toont concreet, schema en cijfer samen.",
      hint: "Kijk naar de structuur en zeg dan de getalnaam."
    };
    this.namingLogged = this.game.recordAttempt(challenge, challenge.options[0], this.startedAt, false);
    this.render();
  }
}
