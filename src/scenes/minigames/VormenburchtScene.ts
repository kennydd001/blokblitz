import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { classifyShapeError, shapeChallenge, shapeRound, shapeSvg, type ShapeRound } from "../../education/geometry/shapes";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Vormenburcht — shapes + spatial sense. Tap the named shape, count a shape's
// corners, or finish a shape pattern. Local SVG shapes, no reading required for
// the shape tiles. Logs as math-geometry.
export class VormenburchtScene extends MiniGameScene {
  protected readonly emoji = "🔷";
  protected readonly heading = "Vormenburcht";
  private currentRound!: ShapeRound;

  constructor(game: Game) {
    super(game, "vormenburcht");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = shapeRound();
    this.instruction = this.currentRound.prompt;
    return shapeChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play vormen-play";

    if (this.currentRound.promptHtml) {
      const stage = document.createElement("div");
      stage.className = "vormen-prompt";
      stage.innerHTML = this.currentRound.promptHtml;
      wrap.appendChild(stage);
    }

    const shapeChoices = this.currentRound.mode !== "count-corners";
    const choices = document.createElement("div");
    choices.className = "mini-choices vormen-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mini-choice vormen-choice ${shapeChoices ? "shape" : "num"}`;
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", option.label);
      button.innerHTML = shapeChoices ? shapeSvg(String(option.value), 72) : `<span class="vormen-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "math-geometry",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "shapes",
      stimulusKey: this.currentRound.mode,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyShapeError(this.currentRound.mode)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.vormen-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach("Kijk goed naar de vorm.");
  }

  // Signature moment: the castle pops up — another tower built!
  protected onCorrect(): void {
    const stage = this.root.querySelector<HTMLElement>(".vormen-prompt") ?? this.root.querySelector<HTMLElement>(".vormen-choices");
    if (!stage) return;
    stage.classList.add("built");
    const castle = document.createElement("span");
    castle.className = "vormen-castle";
    castle.setAttribute("aria-hidden", "true");
    castle.textContent = "🏰";
    stage.appendChild(castle);
  }
}
