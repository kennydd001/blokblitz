import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { classifyTeenError, teenChallenge, teenRound, type TeenRound } from "../../education/math/teens";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Tientalhuis — teen-number structure (10 + n). A house with a full "ten room"
// and loose ones. The child reads the teen number, or finds the loose-ones part.
// Logs as a math-to-20 (curriculum) attempt with its own dashboard panel.
export class TientalhuisScene extends MiniGameScene {
  protected readonly emoji = "🏠";
  protected readonly heading = "Tientalhuis";
  private currentRound!: TeenRound;

  constructor(game: Game) {
    super(game, "tientalhuis");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = teenRound();
    this.instruction = this.currentRound.prompt;
    return teenChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play tientalhuis-play";

    const board = document.createElement("div");
    board.className = "tientalhuis-board";
    const ten = `<div class="tientalhuis-room"><small>tien</small><div class="tientalhuis-art">${RepresentationFactory.renderSvg("tenframe", 10, { label: "tien" })}</div></div>`;
    if (this.currentRound.mode === "read-teen") {
      const ones = `<div class="tientalhuis-loose"><small>los</small><div class="tientalhuis-art">${RepresentationFactory.renderSvg("dots", this.currentRound.ones, { label: "los" })}</div></div>`;
      board.innerHTML = `${ten}<span class="tientalhuis-plus" aria-hidden="true">+</span>${ones}`;
    } else {
      const target = `<div class="tientalhuis-target"><b>${this.currentRound.total}</b></div>`;
      board.innerHTML = `${target}<span class="tientalhuis-plus" aria-hidden="true">=</span>${ten}<span class="tientalhuis-plus" aria-hidden="true">+</span><div class="tientalhuis-room empty"><b>?</b></div>`;
    }

    const choices = document.createElement("div");
    choices.className = "mini-choices tientalhuis-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice tientalhuis-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="tientalhuis-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.append(board, choices);
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
      rangeKey: "teens",
      stimulusKey: String(this.currentRound.total),
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyTeenError(this.currentRound, Number(option.value))
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.tientalhuis-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach("Eerst de volle tien, dan de losse.");
  }

  // Signature moment: the whole house lights up with a star on the roof.
  protected onCorrect(): void {
    const board = this.root.querySelector<HTMLElement>(".tientalhuis-board");
    if (!board) return;
    board.classList.add("lit");
    const star = document.createElement("span");
    star.className = "tientalhuis-roofstar";
    star.setAttribute("aria-hidden", "true");
    star.textContent = "🌟";
    board.appendChild(star);
  }
}
