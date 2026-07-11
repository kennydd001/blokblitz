import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { rhymeChallenge, rhymeRound, type RhymeRound } from "../../education/literacy/rhymes";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Rijmrivier makes word endings audible and visible. The target picture sits on
// one bank; the child picks the picture whose ending sounds the same to build a
// bridge across. Whole words use the local Lily clips, never synthetic phonemes.
export class RhymeScene extends MiniGameScene {
  protected readonly emoji = "🌊";
  protected readonly heading = "Rijmrivier";
  private currentRound!: RhymeRound;

  constructor(game: Game) {
    super(game, "rijmspel");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = rhymeRound();
    this.instruction = this.currentRound.prompt;
    return rhymeChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play rhyme-play";

    const river = document.createElement("div");
    river.className = "rhyme-river";
    const target = document.createElement("button");
    target.type = "button";
    target.className = "rhyme-target";
    target.setAttribute("aria-label", `Hoor ${this.currentRound.targetWord.word} opnieuw`);
    target.innerHTML = `<span aria-hidden="true">${this.currentRound.targetWord.emoji}</span><strong>${this.currentRound.targetWord.word}</strong><small>🔊</small>`;
    target.addEventListener("click", () => this.speakTarget());
    const water = document.createElement("div");
    water.className = "rhyme-water";
    water.innerHTML = `<i></i><i></i><i></i>`;
    river.append(target, water);
    wrap.appendChild(river);

    const choices = document.createElement("div");
    choices.className = "mini-choices rhyme-choices";
    challenge.options.forEach((option) => {
      const word = this.currentRound.options.find((candidate) => candidate.word.word === String(option.value))!.word;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice rhyme-choice";
      button.dataset.correct = String(option.isCorrect);
      button.dataset.word = word.word;
      button.setAttribute("aria-label", word.word);
      button.innerHTML = `<span aria-hidden="true">${word.emoji}</span><strong>${word.word}</strong>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  private speakTarget(interrupt = true): void {
    this.game.readingAudio.playZoemWord(this.currentRound.targetWord.units, this.currentRound.targetWord.word, { interrupt, rate: 0.92 });
  }

  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "literacy-phonemic",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "rhyme",
      stimulusKey: this.currentRound.targetWord.word,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: "rhyme-ending-confusion"
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected onWrong(): void {
    this.root.querySelector('.rhyme-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.voice.speak(this.currentRound.hintText, { interrupt: true });
    this.speakTarget(false);
    this.game.readingAudio.playZoemWord(this.currentRound.rhymeWord.units, this.currentRound.rhymeWord.word, { interrupt: false, rate: 0.92 });
    this.game.flashMessage(this.currentRound.hintText, "warn");
  }

  protected onCorrect(): void {
    const river = this.root.querySelector<HTMLElement>(".rhyme-river");
    if (!river) return;
    river.classList.add("bridged");
    const bridge = document.createElement("span");
    bridge.className = "rhyme-bridge";
    bridge.setAttribute("aria-hidden", "true");
    bridge.textContent = "✨";
    river.appendChild(bridge);
  }
}
