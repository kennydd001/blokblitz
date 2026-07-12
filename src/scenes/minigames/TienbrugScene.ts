import { buildCurriculumAttempt } from "../../education/challengeLogger";
import {
  bridgeChallenge,
  bridgeRemediation,
  bridgeRound,
  classifyBridgeError,
  type BridgeRound
} from "../../education/math/addsub20";
import { RepresentationFactory } from "../../education/representations/RepresentationFactory";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Tienbrug — addition/subtraction to 20 over the ten-bridge. The sum sits above a
// ten-frame "bridge"; the child taps the answer. A wrong tap shows + says the
// bridge step ("8 en 2 is 10, en nog 3 is 13"). Logs as math-operations.
export class TienbrugScene extends MiniGameScene {
  protected readonly emoji = "🌉";
  protected readonly heading = "Tienbrug";
  private currentRound!: BridgeRound;

  constructor(game: Game) {
    super(game, "tienbrug");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = bridgeRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return bridgeChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play tienbrug-play";

    const sum = document.createElement("div");
    sum.className = "tienbrug-sum";
    sum.innerHTML = `<b>${this.currentRound.a}</b><span>${this.currentRound.op}</span><b>${this.currentRound.mode === "to-ten" ? "?" : this.currentRound.b}</b><span>=</span><b>${this.currentRound.mode === "to-ten" ? "10" : "?"}</b>`;
    wrap.appendChild(sum);

    const bridge = document.createElement("div");
    bridge.className = "tienbrug-bridge";
    bridge.innerHTML = `<span class="tienbrug-bridge-label">de tien</span>${RepresentationFactory.renderSvg("tenframe", 10, { label: "tien" })}`;
    wrap.appendChild(bridge);

    const choices = document.createElement("div");
    choices.className = "mini-choices tienbrug-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice tienbrug-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="tienbrug-num">${option.label}</span>`;
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
      domain: "math-operations",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "bridge20",
      stimulusKey: `${this.currentRound.a}${this.currentRound.op}${this.currentRound.b}`,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyBridgeError(this.currentRound, Number(option.value))
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(option: ChallengeOption): void {
    const error = classifyBridgeError(this.currentRound, Number(option.value));
    const plan = this.remediation(bridgeRemediation(this.currentRound, error));
    this.showBridgeStep(plan.level === "model");
    this.root.querySelector<HTMLElement>(".tienbrug-bridge")?.classList.add(`support-${plan.level}`);
    if (plan.revealAnswer) this.root.querySelector('.tienbrug-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach(plan.text);
  }

  private showBridgeStep(complete: boolean): void {
    this.root.querySelector(".tienbrug-step")?.remove();
    const step = document.createElement("div");
    step.className = `tienbrug-step${complete ? " complete" : ""}`;
    const sign = this.currentRound.op;
    if (this.currentRound.mode === "to-ten") {
      step.innerHTML = complete
        ? `<span>${this.currentRound.a} + ${this.currentRound.bridge.toTen} = 10</span><strong>? = ${this.currentRound.answer}</strong>`
        : `<span>${this.currentRound.a} + ? = 10</span><b>maak de tien vol</b>`;
      this.root.querySelector(".tienbrug-bridge")?.insertAdjacentElement("afterend", step);
      return;
    }
    const first = `${this.currentRound.a} ${sign} ${this.currentRound.bridge.toTen} = 10`;
    step.innerHTML = complete
      ? `<span>${first}</span><b>${sign} ${this.currentRound.bridge.rest}</b><strong>= ${this.currentRound.answer}</strong>`
      : `<span>${first}</span><b>dan de rest</b>`;
    this.root.querySelector(".tienbrug-bridge")?.insertAdjacentElement("afterend", step);
  }

  // Signature moment: a light-wave rolls across the ten-frame and a runner
  // dashes OVER the bridge — the child literally sees the sum cross the ten.
  protected onCorrect(): void {
    const bridge = this.root.querySelector<HTMLElement>(".tienbrug-bridge");
    if (!bridge) return;
    bridge.classList.add("crossed");
    const runner = document.createElement("span");
    runner.className = "tienbrug-runner";
    runner.setAttribute("aria-hidden", "true");
    runner.textContent = "🏃";
    bridge.appendChild(runner);
  }
}
