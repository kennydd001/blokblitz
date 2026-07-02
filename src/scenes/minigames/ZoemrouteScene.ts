import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { zoemChallenge, zoemRound, type ZoemRound } from "../../education/literacy/words";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Zoemroute — connected blending for early word reading. The word's sound stones
// glow in order and stretch into one word ("mmm-aaa-nnn" -> "maan"); the child
// taps the matching picture. Voice-first; a stone replays its sound, the zoem
// button replays the whole connected blend. Logs as literacy-reading / wordRead.
export class ZoemrouteScene extends MiniGameScene {
  protected readonly emoji = "🐝";
  protected readonly heading = "Zoemroute";
  private currentRound!: ZoemRound;

  constructor(game: Game) {
    super(game, "zoemroute");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = zoemRound();
    this.instruction = this.currentRound.prompt;
    return zoemChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play zoemroute-play";

    // The sound-stone route: tap a stone to hear that sound.
    const route = document.createElement("div");
    route.className = "zoemroute-stones";
    this.currentRound.units.forEach((unit, i) => {
      if (i > 0) {
        const link = document.createElement("span");
        link.className = "zoemroute-link";
        link.setAttribute("aria-hidden", "true");
        route.appendChild(link);
      }
      const stone = document.createElement("button");
      stone.type = "button";
      stone.className = "zoemroute-stone";
      stone.textContent = unit;
      stone.setAttribute("aria-label", `klank ${unit}`);
      stone.addEventListener("click", () => this.game.readingAudio.playPhoneme(unit, { interrupt: true, rate: 0.7 }));
      route.appendChild(stone);
    });

    const zoem = document.createElement("button");
    zoem.type = "button";
    zoem.className = "zoemroute-zoem";
    zoem.innerHTML = `<span aria-hidden="true">🐝</span> zoem`;
    zoem.addEventListener("click", () => this.zoem());
    route.appendChild(zoem);
    wrap.appendChild(route);

    const choices = document.createElement("div");
    choices.className = "mini-choices zoemroute-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice zoemroute-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="klankgrot-pic" aria-hidden="true">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  // Speak the stretched, connected blend, then the whole word.
  private zoem(rate = 0.7): void {
    this.game.readingAudio.playZoemWord(this.currentRound.units, this.currentRound.word.word, { interrupt: true, rate });
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "literacy-reading",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "words",
      stimulusKey: this.currentRound.word.word,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: "word-read-weak"
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected showScaffold(): void {}

  protected onWrong(): void {
    this.root.querySelector('.zoemroute-choice[data-correct="true"]')?.classList.add("reveal");
    this.zoem(0.55);
    this.game.flashMessage("Zoem rustig: rek de klanken aan elkaar.", "warn");
  }
}
