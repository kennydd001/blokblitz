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
  private builtShapes: string[] = [];

  constructor(game: Game) {
    super(game, "vormenburcht");
  }

  mount(): void {
    this.builtShapes = [];
    super.mount();
  }

  protected makeChallenge(): Challenge {
    this.currentRound = shapeRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return shapeChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play vormen-play";

    const progress = document.createElement("div");
    progress.className = "vormen-build-progress";
    progress.setAttribute("aria-label", `${this.builtShapes.length} van ${this.total} vormstenen gebouwd`);
    const castle = document.createElement("span");
    castle.className = "vormen-build-castle";
    castle.setAttribute("aria-hidden", "true");
    castle.textContent = "🏰";
    const stones = document.createElement("div");
    stones.className = "vormen-build-stones";
    for (let index = 0; index < this.total; index += 1) {
      const stone = document.createElement("span");
      stone.dataset.slot = String(index);
      if (this.builtShapes[index]) {
        stone.className = "built";
        stone.innerHTML = shapeSvg(this.builtShapes[index], 30);
      } else {
        stone.className = "waiting";
        stone.innerHTML = "<i></i>";
      }
      stone.setAttribute("aria-hidden", "true");
      stones.appendChild(stone);
    }
    progress.append(castle, stones);
    wrap.appendChild(progress);

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

  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
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
    this.revealStructure(true);
    this.reteach("Kijk goed naar de vorm.");
  }

  // Signature moment: the solved shape becomes a real stone in the castle.
  protected onCorrect(): void {
    this.revealStructure(false);
    const shape = this.rewardShape();
    if (this.builtShapes.length < this.correctRounds) this.builtShapes.push(shape);
    const progress = this.root.querySelector<HTMLElement>(".vormen-build-progress");
    const stone = progress?.querySelector<HTMLElement>(`[data-slot="${this.correctRounds - 1}"]`);
    if (!progress || !stone) return;
    stone.className = "built arriving";
    stone.innerHTML = shapeSvg(shape, 30);
    progress.setAttribute("aria-label", `${this.correctRounds} van ${this.total} vormstenen gebouwd`);
    progress.classList.add("building");
    if (this.correctRounds >= this.total) progress.classList.add("complete");
  }

  protected mountReplay(): void {
    this.builtShapes = [];
    super.mountReplay();
  }

  private rewardShape(): string {
    if (this.currentRound.mode === "count-corners") return this.currentRound.targetKey.replace("corners-", "");
    return this.currentRound.options.find((option) => option.isCorrect)?.value ?? "square";
  }

  private revealStructure(teaching: boolean): void {
    const correct = this.currentRound.options.find((option) => option.isCorrect);
    if (!correct) return;

    if (this.currentRound.mode === "continue-pattern") {
      const next = this.root.querySelector<HTMLElement>(".vormen-next");
      if (!next) return;
      next.innerHTML = shapeSvg(correct.value, 52);
      next.classList.add("revealed", teaching ? "teaching" : "success");
      if (!teaching) next.classList.remove("teaching");
      return;
    }

    if (this.currentRound.mode === "count-corners") {
      const stage = this.root.querySelector<HTMLElement>(".vormen-stage");
      if (!stage) return;
      let answer = stage.querySelector<HTMLElement>(".vormen-corner-answer");
      if (!answer) {
        answer = document.createElement("span");
        answer.className = "vormen-corner-answer";
        stage.appendChild(answer);
      }
      answer.textContent = `${correct.value} hoeken`;
      answer.classList.toggle("teaching", teaching);
      answer.classList.toggle("success", !teaching);
      return;
    }

    const choice = this.root.querySelector<HTMLElement>('.vormen-choice[data-correct="true"]');
    if (!choice) return;
    const existing = choice.querySelector<HTMLElement>(".vormen-name");
    if (existing) {
      existing.classList.toggle("teaching", teaching);
      existing.classList.toggle("success", !teaching);
      return;
    }
    const name = document.createElement("small");
    name.className = `vormen-name ${teaching ? "teaching" : "success"}`;
    name.textContent = correct.label;
    choice.appendChild(name);
  }
}
