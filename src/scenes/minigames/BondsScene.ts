import { bondChallenge, bondRemediation, bondRound, classifyBondError, type BondRound } from "../../education/math/bonds";
import { buildCurriculumAttempt } from "../../education/challengeLogger";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Vriendjes van 10 — the make-10 bonds (7 + 3), shown on the familiar ten-frame
// so the empty cells make "hoeveel nog tot tien?" visible. Find the partner, pick
// the friend, or judge whether two numbers fill the ten. A wrong tap re-teaches
// with the ten-frame. Logs as math-number / make10 so it joins the adaptive loop.
export class BondsScene extends MiniGameScene {
  protected readonly emoji = "🤝";
  protected readonly heading = "Vriendjes 10";
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
      stage.append(this.frame(this.currentRound.a, this.currentRound.b));
      const sum = document.createElement("div");
      sum.className = "bond-sum";
      sum.innerHTML = `<strong>${this.currentRound.a}</strong><span>+</span><strong>${this.currentRound.b}</strong><span>= 10?</span>`;
      stage.appendChild(sum);
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

  private frame(first: number, second?: number): HTMLElement {
    const box = document.createElement("div");
    box.className = "bond-frame";
    const total = first + (second ?? 0);
    if (second !== undefined) box.classList.add(total === 10 ? "exact" : total < 10 ? "short" : "over");
    box.setAttribute("aria-label", second === undefined ? `${first} gevuld, ${10 - first} leeg` : `${first} en ${second}, samen ${total}`);
    for (let index = 0; index < 10; index += 1) {
      const cell = document.createElement("span");
      cell.className = "bond-cell";
      if (index < first) cell.classList.add("first");
      else if (second !== undefined && index < total) cell.classList.add("second");
      else cell.classList.add(second === undefined ? "missing" : "empty");
      cell.style.setProperty("--cell-index", String(index));
      box.appendChild(cell);
    }
    if (second !== undefined && total > 10) {
      const overflow = document.createElement("span");
      overflow.className = "bond-overflow";
      overflow.setAttribute("aria-label", `${total - 10} te veel`);
      for (let index = 0; index < total - 10; index += 1) overflow.appendChild(document.createElement("i"));
      box.appendChild(overflow);
    }
    return box;
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

  protected onWrong(option: ChallengeOption): void {
    const answer = Array.isArray(option.value) ? String(option.value) : option.value;
    const error = classifyBondError(this.currentRound, answer);
    const plan = this.remediation(bondRemediation(this.currentRound, error));
    const stage = this.root.querySelector<HTMLElement>(".bond-stage");
    stage?.classList.add(`support-${plan.level}`);
    if (plan.level !== "nudge") {
      if (this.currentRound.mode === "is-ten") {
        stage?.classList.add(this.currentRound.makesTen ? "bond-vol" : "bond-not-ten");
      } else {
        this.root.querySelectorAll<HTMLElement>(".bond-cell.missing").forEach((cell) => cell.classList.add("preview"));
      }
    }
    if (plan.revealAnswer) this.root.querySelector('.bond-choice[data-correct="true"]')?.classList.add("reveal");
    this.reteach(plan.text);
  }

  // Signature moment: the ten-frame fills up and glows — the child sees the ten
  // become whole.
  protected onCorrect(): void {
    const stage = this.root.querySelector<HTMLElement>(".bond-stage");
    if (!stage) return;
    if (this.currentRound.mode === "is-ten") {
      stage.classList.add(this.currentRound.makesTen ? "bond-vol" : "bond-not-ten");
      return;
    }
    this.root.querySelectorAll<HTMLElement>(".bond-cell.missing").forEach((cell) => {
      cell.classList.remove("missing");
      cell.classList.add("second", "filled-now");
    });
    stage.classList.add("bond-vol");
  }
}
