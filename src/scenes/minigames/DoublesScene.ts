import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { classifyDoublesError, doublesChallenge, doublesRound, type DoublesRound } from "../../education/math/doubles";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Dubbelspel — doubles (3 + 3) and even/oneven, the bridge from counting to
// adding. Doubles are shown as TWO mirrored groups ("twee keer evenveel"); even
// and odd are shown as paired dots so the child SEES the leftover. A wrong tap
// re-teaches the double or the pairing. Logs as math-operations.
export class DoublesScene extends MiniGameScene {
  protected readonly emoji = "✌️";
  protected readonly heading = "Dubbelspel";
  private currentRound!: DoublesRound;

  constructor(game: Game) {
    super(game, "dubbelspel");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = doublesRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return doublesChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play dubbel-play";

    const stage = document.createElement("div");
    stage.className = "dubbel-stage";
    if (this.currentRound.mode === "even-odd") {
      stage.appendChild(this.pairGrid(this.currentRound.n));
    } else {
      const right = this.currentRound.mode === "double" ? this.currentRound.a : this.currentRound.a + 1;
      stage.append(
        this.dotGroup(this.currentRound.a, "left"),
        this.opGlyph("+"),
        this.dotGroup(right, "right", this.currentRound.mode === "near-double"),
        this.opGlyph("="),
        this.mysteryTile()
      );
    }
    wrap.appendChild(stage);

    const choices = document.createElement("div");
    choices.className = "mini-choices dubbel-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice dubbel-choice";
      button.dataset.correct = String(option.isCorrect);
      button.dataset.value = String(option.value);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="dubbel-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  // A little group of dots — the visual anchor for "twee keer evenveel".
  private dotGroup(count: number, side: "left" | "right", markBonus = false): HTMLElement {
    const group = document.createElement("div");
    group.className = `dubbel-group ${side}`;
    group.setAttribute("aria-hidden", "true");
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement("span");
      dot.className = "dubbel-dot";
      if (markBonus && i === count - 1) {
        dot.classList.add("bonus");
        dot.dataset.bonus = "+1";
      }
      group.appendChild(dot);
    }
    return group;
  }

  private opGlyph(sign: string): HTMLElement {
    const op = document.createElement("span");
    op.className = "dubbel-op";
    op.setAttribute("aria-hidden", "true");
    op.textContent = sign;
    return op;
  }

  private mysteryTile(): HTMLElement {
    const tile = document.createElement("span");
    tile.className = "dubbel-mystery";
    tile.setAttribute("aria-hidden", "true");
    tile.textContent = "?";
    return tile;
  }

  // Even/odd made concrete: dots laid out two-per-row so a leftover dot at the
  // bottom is impossible to miss. The odd one out gets its own marker.
  private pairGrid(n: number): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "dubbel-pairs";
    wrap.setAttribute("aria-label", `${n} in tweetallen`);
    const pairs = Math.floor(n / 2);
    for (let pair = 0; pair < pairs; pair += 1) {
      const cell = document.createElement("span");
      cell.className = "dubbel-pair";
      cell.innerHTML = `<i class="dubbel-dot"></i><i class="dubbel-dot"></i>`;
      wrap.appendChild(cell);
    }
    if (n % 2 === 1) {
      const leftover = document.createElement("span");
      leftover.className = "dubbel-leftover";
      leftover.innerHTML = `<i class="dubbel-dot leftover"></i><small>alleen</small>`;
      wrap.appendChild(leftover);
    }
    return wrap;
  }

  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    // Our options are always scalar (a numeral or "even"/"oneven"); narrow away
    // the array arm of ChallengeOption.value for the classifier.
    const answer = Array.isArray(option.value) ? String(option.value) : option.value;
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "math-operations",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "doubles",
      stimulusKey: this.currentRound.mode === "even-odd" ? `evenodd-${this.currentRound.n}` : `${this.currentRound.a}+${this.currentRound.mode === "double" ? this.currentRound.a : this.currentRound.a + 1}`,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyDoublesError(this.currentRound, answer)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.dubbel-choice[data-correct="true"]')?.classList.add("reveal");
    this.showStrategy();
    this.reteach(this.currentRound.hintText);
  }

  // Signature moment: doubles snap together with a mirror-flash; even/odd pulses
  // the pairs (or wiggles the leftover for oneven) so the answer is felt.
  protected onCorrect(): void {
    const stage = this.root.querySelector<HTMLElement>(".dubbel-stage");
    if (!stage) return;
    if (this.currentRound.mode === "even-odd") {
      stage.classList.add(this.currentRound.answer === "even" ? "even-pop" : "oneven-pop");
    } else {
      stage.classList.add("double-snap");
      const mystery = stage.querySelector<HTMLElement>(".dubbel-mystery");
      if (mystery) mystery.textContent = String(this.currentRound.answer);
    }
    this.showStrategy();
  }

  private showStrategy(): void {
    this.root.querySelector(".dubbel-strategy")?.remove();
    const strategy = document.createElement("div");
    strategy.className = "dubbel-strategy";
    if (this.currentRound.mode === "double") {
      strategy.innerHTML = `<span>${this.currentRound.a}</span><b>+</b><span>${this.currentRound.a}</span><b>=</b><strong>${this.currentRound.answer}</strong>`;
    } else if (this.currentRound.mode === "near-double") {
      const doubled = this.currentRound.a * 2;
      strategy.innerHTML = `<span>${this.currentRound.a} + ${this.currentRound.a} = ${doubled}</span><b>dan +1</b><strong>${this.currentRound.answer}</strong>`;
    } else {
      const pairs = Math.floor(this.currentRound.n / 2);
      strategy.innerHTML = `<span>${pairs} tweetal${pairs === 1 ? "" : "len"}</span><b>${this.currentRound.n % 2 === 0 ? "niets over" : "1 over"}</b><strong>${this.currentRound.answer}</strong>`;
    }
    this.root.querySelector(".dubbel-stage")?.insertAdjacentElement("afterend", strategy);
  }
}
