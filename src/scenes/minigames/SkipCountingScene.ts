import { buildCurriculumAttempt } from "../../education/challengeLogger";
import {
  classifySkipCountError,
  skipCountChallenge,
  skipCountRound,
  type SkipCountRound
} from "../../education/math/skipCounting";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Sprongpad turns counting in jumps into a path: every stone is exactly 2, 5 or
// 10 farther. The missing stone is part of the path itself, so the number
// structure controls the action rather than appearing as a detached sum.
export class SkipCountingScene extends MiniGameScene {
  protected readonly emoji = "🦘";
  protected readonly heading = "Sprongpad";
  private currentRound!: SkipCountRound;

  constructor(game: Game) {
    super(game, "sprongpad");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = skipCountRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return skipCountChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play skip-play";

    const legend = document.createElement("div");
    legend.className = "skip-legend";
    legend.innerHTML = `<span aria-hidden="true">↗</span><strong>+${this.currentRound.step}</strong>`;
    wrap.appendChild(legend);

    const track = document.createElement("div");
    track.className = "skip-track";
    track.style.setProperty("--skip-count", String(this.currentRound.sequence.length));
    this.currentRound.sequence.forEach((value, index) => {
      if (index > 0) {
        const jump = document.createElement("span");
        jump.className = "skip-jump";
        jump.textContent = `+${this.currentRound.step}`;
        track.appendChild(jump);
      }
      const stone = document.createElement("div");
      stone.className = `skip-stone${index === this.currentRound.missingIndex ? " missing" : ""}`;
      stone.dataset.index = String(index);
      stone.textContent = index === this.currentRound.missingIndex ? "?" : String(value);
      track.appendChild(stone);
    });
    const jumper = document.createElement("span");
    jumper.className = "skip-jumper";
    jumper.setAttribute("aria-hidden", "true");
    jumper.textContent = "🦖";
    track.appendChild(jumper);
    wrap.appendChild(track);

    const choices = document.createElement("div");
    choices.className = "mini-choices skip-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice skip-choice";
      button.dataset.correct = String(option.isCorrect);
      button.dataset.value = String(option.value);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<strong>${option.label}</strong>`;
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
    const answer = Array.isArray(option.value) ? String(option.value) : option.value;
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "math-number",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: `skip-${this.currentRound.step}`,
      stimulusKey: this.currentRound.sequence.join("-"),
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifySkipCountError(this.currentRound, answer)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    const previous = this.root.querySelector<HTMLElement>(`.skip-stone[data-index="${Math.max(0, this.currentRound.missingIndex - 1)}"]`);
    previous?.classList.add("start-here");
    this.root.querySelectorAll<HTMLElement>(".skip-jump").forEach((jump) => jump.classList.add("show-step"));
    this.reteach(this.currentRound.hintText);
  }

  protected onCorrect(): void {
    const missing = this.root.querySelector<HTMLElement>(".skip-stone.missing");
    if (missing) missing.textContent = String(this.currentRound.answer);
    this.root.querySelector<HTMLElement>(".skip-track")?.classList.add("complete");
  }
}
