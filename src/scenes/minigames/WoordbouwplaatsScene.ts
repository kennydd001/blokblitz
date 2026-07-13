import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { LETTERS, letterProgress } from "../../education/literacy/letters";
import { bouwChallenge, bouwRound, classifyBouwError, type BouwRound } from "../../education/literacy/words";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Woordbouwplaats — sound segmentation / spelling foundation. The word's picture
// + its sound boxes are shown with one box empty; the child taps the sound tile
// that belongs there. Voice-first (a button re-says the word slowly). Logs as
// literacy-reading / wordBuild.
export class WoordbouwplaatsScene extends MiniGameScene {
  protected readonly emoji = "🔤";
  protected readonly heading = "Woordbouw";
  private currentRound!: BouwRound;

  constructor(game: Game) {
    super(game, "woordbouwplaats");
  }

  protected makeChallenge(): Challenge {
    const unlocked = letterProgress(this.game.mastery.getAttempts()).unlockedLetters;
    this.currentRound = bouwRound(
      this.tier(),
      unlocked.length < LETTERS.length ? unlocked : undefined,
      this.adaptiveTargetKey()
    );
    this.instruction = this.currentRound.prompt;
    return bouwChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play woordbouw-play";

    const board = document.createElement("div");
    board.className = "woordbouw-board";
    const pic = document.createElement("button");
    pic.type = "button";
    pic.className = "woordbouw-pic";
    pic.setAttribute("aria-label", "Hoor het woord");
    pic.innerHTML = `<span aria-hidden="true">${this.currentRound.word.emoji}</span>`;
    pic.addEventListener("click", () => this.sayWord());
    board.appendChild(pic);

    const boxes = document.createElement("div");
    boxes.className = "woordbouw-boxes";
    this.currentRound.units.forEach((unit, i) => {
      const box = document.createElement("div");
      const blank = i === this.currentRound.blankIndex;
      box.className = `woordbouw-box${blank ? " blank" : ""}`;
      box.innerHTML = `<b>${blank ? "?" : unit}</b>`;
      boxes.appendChild(box);
    });
    board.appendChild(boxes);
    wrap.appendChild(board);

    const choices = document.createElement("div");
    choices.className = "mini-choices woordbouw-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice woordbouw-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", `klank ${option.value}`);
      button.innerHTML = `<span class="woordbouw-tile">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  protected replayPrompt(): void {
    this.sayWord(0.7);
  }

  private sayWord(rate = 0.7): void {
    this.game.readingAudio.playZoemWord(this.currentRound.units, this.currentRound.word.word, { interrupt: true, rate });
  }

  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "literacy-reading",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "wordbuild",
      stimulusKey: this.currentRound.word.word,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyBouwError(this.currentRound.blankIndex, this.currentRound.units.length, this.currentRound.correct)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected showScaffold(): void {}

  protected onWrong(): void {
    this.root.querySelector('.woordbouw-choice[data-correct="true"]')?.classList.add("reveal");
    this.sayWord(0.55);
    this.game.flashMessage("Zeg het woord traag en luister.", "warn");
  }

  // Signature moment: the missing sound SNAPS into its box.
  protected onCorrect(option: ChallengeOption): void {
    const blank = this.root.querySelector<HTMLElement>(".woordbouw-box.blank");
    if (!blank) return;
    blank.classList.add("snapped");
    const label = blank.querySelector("b");
    if (label) label.textContent = String(option.label ?? option.value);
  }
}
