import { bondChallenge, bondRound, classifyBondError, type BondRound } from "../../education/math/bonds";
import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Vriendjes van 10 — the make-10 bonds (7 + 3), shown on the familiar ten-frame
// so the empty cells make "hoeveel nog tot tien?" visible. Find the partner, pick
// the friend, or judge whether two numbers fill the ten. A wrong tap re-teaches
// with the ten-frame. Logs as math-number / make10 so it joins the adaptive loop.
export class BondsScene extends MiniGameScene {
  protected readonly emoji = "🤝";
  protected readonly heading = "Vriendjes van 10";
  private currentRound!: BondRound;

  constructor(game: Game) {
    super(game, "vriendjes");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = bondRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return bondChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play bond-play";

    const stage = document.createElement("div");
    stage.className = "bond-stage";
    if (this.currentRound.mode === "is-ten") {
      stage.append(this.frame(this.currentRound.a), this.opGlyph("+"), this.frame(this.currentRound.b), this.opGlyph("= 10?"));
    } else {
      const frame = this.frame(this.currentRound.a);
      frame.classList.add("bond-frame-ask");
      stage.append(frame);
      const ask = document.createElement("div");
      ask.className = "bond-ask";
      ask.textContent = "hoeveel nog tot 10?";
      stage.appendChild(ask);
    }
    wrap.appendChild(stage);

    const choices = document.createElement("div");
    choices.className = "mini-choices bond-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice bond-choice";
      button.dataset.correct = String(option.isCorrect);
      button.dataset.value = String(option.value);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="bond-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  private frame(n: number): HTMLElement {
    const box = document.createElement("div");
    box.className = "bond-frame";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = RepresentationFactory.renderSvg("tenframe", n, { label: String(n) });
    return box;
  }

  private opGlyph(sign: string): HTMLElement {
    const op = document.createElement("span");
    op.className = "bond-op";
    op.setAttribute("aria-hidden", "true");
    op.textContent = sign;
    return op;
  }

  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const answer = Array.isArray(option.value) ? String(option.value) : option.value;
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "math-number",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "make10",
      stimulusKey: `${this.currentRound.a}+${this.currentRound.b}`,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyBondError(this.currentRound, answer)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.bond-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach(this.currentRound.hintText);
  }

  // Signature moment: the ten-frame fills up and glows — the child sees the ten
  // become whole.
  protected onCorrect(): void {
    this.root.querySelector<HTMLElement>(".bond-stage")?.classList.add("bond-vol");
  }
}
