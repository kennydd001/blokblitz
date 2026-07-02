import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { classifyMoneyError, coinRow, moneyChallenge, moneyRound, type MoneyRound } from "../../education/measurement/money";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Geldmarkt — money to 10 euro. Count the coins, or pick the purse that holds the
// target amount. Local euro-like coins. Logs as math-measurement.
export class GeldmarktScene extends MiniGameScene {
  protected readonly emoji = "🪙";
  protected readonly heading = "Geldmarkt";
  private currentRound!: MoneyRound;

  constructor(game: Game) {
    super(game, "geldmarkt");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = moneyRound();
    this.instruction = this.currentRound.prompt;
    return moneyChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play geld-play";

    if (this.currentRound.promptHtml) {
      const stage = document.createElement("div");
      stage.className = "geld-prompt";
      stage.innerHTML = this.currentRound.promptHtml;
      wrap.appendChild(stage);
    }

    const purseChoices = this.currentRound.mode === "make-amount";
    const choices = document.createElement("div");
    choices.className = "mini-choices geld-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mini-choice geld-choice ${purseChoices ? "purse" : "amount"}`;
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", option.label);
      if (purseChoices) {
        const coins = String(option.value).split("-").map(Number);
        button.innerHTML = `<span class="geld-purse">${coinRow(coins)}</span>`;
      } else {
        button.innerHTML = `<span class="geld-amount">${option.label}</span>`;
      }
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "math-measurement",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "money",
      stimulusKey: String(this.currentRound.total),
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyMoneyError(this.currentRound, String(option.value))
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.geld-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.flashMessage("Tel de muntjes samen: 5, dan 2, dan 1.", "warn");
  }
}
