import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { barHtml, classifyMeasureError, measureChallenge, measureRound, type MeasureRound } from "../../education/measurement/measure";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Meetwerf — length comparison + natural-unit measuring. Tap the longest/shortest
// beam, or count how many blocks long a beam is. Local HTML bars. Logs as
// math-measurement.
export class MeetwerfScene extends MiniGameScene {
  protected readonly emoji = "📐";
  protected readonly heading = "Meetwerf";
  private currentRound!: MeasureRound;

  constructor(game: Game) {
    super(game, "meetwerf");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = measureRound();
    this.instruction = this.currentRound.prompt;
    return measureChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play meet-play";

    if (this.currentRound.promptHtml) {
      const stage = document.createElement("div");
      stage.className = "meet-prompt";
      stage.innerHTML = this.currentRound.promptHtml;
      wrap.appendChild(stage);
    }

    const barChoices = this.currentRound.mode === "compare-length";
    const choices = document.createElement("div");
    choices.className = `mini-choices meet-choices ${barChoices ? "bars" : ""}`;
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mini-choice meet-choice ${barChoices ? "bar" : "num"}`;
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", barChoices ? `balk van ${option.label}` : option.label);
      button.innerHTML = barChoices ? barHtml(Number(option.value)) : `<span class="meet-num">${option.label}</span>`;
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
      rangeKey: "measure",
      stimulusKey: this.currentRound.mode,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyMeasureError(this.currentRound, String(option.value))
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.meet-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.flashMessage("Leg ze naast elkaar en vergelijk.", "warn");
  }
}
