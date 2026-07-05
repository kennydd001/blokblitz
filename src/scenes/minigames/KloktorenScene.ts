import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { classifyClockError, clockChallenge, clockRound, clockSvg, type ClockRound } from "../../education/measurement/time";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Kloktoren — read the clock (whole + half hours, Flemish "3 uur" / "half 4").
// Read an analog clock -> tap the time, or hear a time -> tap the matching clock.
// Local SVG clocks. Logs as math-measurement.
export class KloktorenScene extends MiniGameScene {
  protected readonly emoji = "🕐";
  protected readonly heading = "Kloktoren";
  private currentRound!: ClockRound;

  constructor(game: Game) {
    super(game, "kloktoren");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = clockRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return clockChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play klok-play";

    if (this.currentRound.promptHtml) {
      const stage = document.createElement("div");
      stage.className = "klok-prompt";
      stage.innerHTML = this.currentRound.promptHtml;
      wrap.appendChild(stage);
    }

    const clockChoices = this.currentRound.mode === "which-clock";
    const choices = document.createElement("div");
    choices.className = "mini-choices klok-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mini-choice klok-choice ${clockChoices ? "clock" : "time"}`;
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", option.label);
      if (clockChoices) {
        const [h, m] = String(option.value).split(":").map(Number);
        button.innerHTML = clockSvg(h, m, 84);
      } else {
        button.innerHTML = `<span class="klok-time">${option.label}</span>`;
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
      rangeKey: "clock",
      stimulusKey: `${this.currentRound.hour}:${this.currentRound.minute}`,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyClockError(this.currentRound, String(option.value))
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.klok-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.flashMessage("Kijk naar de wijzers: kort = uur, lang = minuten.", "warn");
  }

  // Signature moment: the clock tower RINGS — the clock swings and a bell
  // pops up above it, like the hour striking.
  protected onCorrect(): void {
    const stage = this.root.querySelector<HTMLElement>(".klok-prompt") ?? this.root.querySelector<HTMLElement>(".klok-choices");
    if (!stage) return;
    stage.classList.add("ringing");
    const bell = document.createElement("span");
    bell.className = "klok-bell";
    bell.setAttribute("aria-hidden", "true");
    bell.textContent = "🔔";
    stage.appendChild(bell);
  }
}
