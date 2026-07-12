import { buildCurriculumAttempt } from "../../education/challengeLogger";
import {
  classifyLineError,
  lineChallenge,
  lineRemediation,
  lineRound,
  type LineRound
} from "../../education/math/numberline";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Getallenlijn Glijbaan — number line to 20. A 5-number window slides into view
// with one spot blank; the child finds the missing number (or before/after).
// Logs as a math-to-20 (curriculum) attempt.
export class GetallenlijnScene extends MiniGameScene {
  protected readonly emoji = "📏";
  protected readonly heading = "Getallenlijn";
  private currentRound!: LineRound;

  constructor(game: Game) {
    super(game, "getallenlijn");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = lineRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return lineChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play getallenlijn-play";

    const line = document.createElement("div");
    line.className = "getallenlijn-line";
    this.currentRound.window.forEach((n) => {
      const cell = document.createElement("div");
      const blank = n === this.currentRound.target;
      cell.className = `getallenlijn-cell${blank ? " blank" : ""}`;
      cell.innerHTML = `<b>${blank ? "?" : n}</b>`;
      line.appendChild(cell);
    });
    wrap.appendChild(line);

    const choices = document.createElement("div");
    choices.className = "mini-choices getallenlijn-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice getallenlijn-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="getallenlijn-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "math-number",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "line20",
      stimulusKey: String(this.currentRound.target),
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyLineError(this.currentRound.target, Number(option.value), this.currentRound.mode)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(option: ChallengeOption): void {
    const player = Number(option.value);
    const error = classifyLineError(this.currentRound.target, player, this.currentRound.mode);
    const plan = this.remediation(lineRemediation(this.currentRound, error, player));
    this.showDirection(plan.level);
    if (plan.revealAnswer) this.root.querySelector('.getallenlijn-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach(plan.text);
  }

  private showDirection(level: "nudge" | "guided" | "model"): void {
    this.root.querySelector(".getallenlijn-direction")?.remove();
    const cue = document.createElement("div");
    cue.className = `getallenlijn-direction ${level}`;
    if (this.currentRound.mode === "before") cue.innerHTML = `<strong aria-hidden="true">&#8592;</strong><span>voor</span>`;
    else if (this.currentRound.mode === "after") cue.innerHTML = `<span>na</span><strong aria-hidden="true">&#8594;</strong>`;
    else cue.innerHTML = `<strong aria-hidden="true">&#8596;</strong><span>tel langs de lijn</span>`;
    this.root.querySelector(".getallenlijn-line")?.insertAdjacentElement("afterend", cue);
    if (level === "model") {
      const blank = this.root.querySelector<HTMLElement>(".getallenlijn-cell.blank b");
      if (blank) blank.textContent = String(this.currentRound.target);
    }
  }

  // Signature moment: the answer lands in the gap and a star SLIDES down the
  // line across every cell — this is the "glijbaan" the mode is named after.
  protected onCorrect(): void {
    const blank = this.root.querySelector<HTMLElement>(".getallenlijn-cell.blank");
    if (blank) {
      blank.classList.add("landed");
      const label = blank.querySelector("b");
      if (label) label.textContent = String(this.currentRound.target);
    }
    const line = this.root.querySelector<HTMLElement>(".getallenlijn-line");
    if (line) {
      const slider = document.createElement("span");
      slider.className = "getallenlijn-slider";
      slider.setAttribute("aria-hidden", "true");
      slider.textContent = "⭐";
      line.appendChild(slider);
    }
  }
}
