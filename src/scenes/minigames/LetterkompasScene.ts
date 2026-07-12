import { buildCurriculumAttempt } from "../../education/challengeLogger";
import {
  LETTERS,
  STARTER_LETTERS,
  classifyLetterError,
  letterkompasChallenge,
  letterkompasRound,
  letterPracticeTarget,
  letterProgress,
  type LetterRound
} from "../../education/literacy/letters";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Letterkompas — letter <-> sound mapping. Hear a sound and tap the matching
// letter rune, or see a letter and tap the picture that begins with it. Voice
// carries the sound; the compass replays it. Logs as a literacy-reading attempt.
export class LetterkompasScene extends MiniGameScene {
  protected readonly emoji = "🧭";
  protected readonly heading = "Letterkompas";
  private currentRound!: LetterRound;
  private unlockedLetters = [...STARTER_LETTERS];

  constructor(game: Game) {
    super(game, "letterkompas");
  }

  protected makeChallenge(): Challenge {
    const attempts = this.game.mastery.getAttempts();
    const progress = letterProgress(attempts);
    this.unlockedLetters = progress.unlockedLetters;
    const preferred = letterPracticeTarget(attempts, this.unlockedLetters, this.adaptiveTargetKey());
    this.currentRound = letterkompasRound(undefined, this.tier(), this.unlockedLetters, preferred);
    this.instruction = this.currentRound.prompt;
    return letterkompasChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play letterkompas-play";

    const book = document.createElement("div");
    book.className = "letterkompas-book";
    book.setAttribute("aria-label", `${this.unlockedLetters.length} van ${LETTERS.length} klanken vrij`);
    const visible = this.unlockedLetters.slice(-6);
    book.innerHTML = `<span class="letterkompas-book-icon" aria-hidden="true">&#128214;</span><span class="letterkompas-book-letters">${visible
      .map((letter) => `<i>${letter.toUpperCase()}</i>`)
      .join("")}${this.unlockedLetters.length < LETTERS.length ? `<i class="locked" aria-hidden="true">?</i>` : ""}</span><strong>${this.unlockedLetters.length}/${LETTERS.length}</strong>`;
    wrap.appendChild(book);

    const compass = document.createElement("button");
    compass.type = "button";
    compass.className = "letterkompas-compass";
    compass.setAttribute("aria-label", "Hoor de klank opnieuw");
    // Show the target letter for letter->word rounds; a compass for sound->letter.
    compass.innerHTML =
      this.currentRound.mode === "letter-to-word"
        ? `<span class="letterkompas-letter" aria-hidden="true">${this.currentRound.letter.toUpperCase()}</span>`
        : `<span aria-hidden="true">🧭</span>`;
    compass.addEventListener("click", () => this.speakSound());
    wrap.appendChild(compass);

    const choices = document.createElement("div");
    choices.className = "mini-choices letterkompas-choices";
    const letterChoices = this.currentRound.mode === "sound-to-letter";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mini-choice letterkompas-choice ${letterChoices ? "rune" : "pic"}`;
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="${letterChoices ? "letterkompas-rune" : "klankgrot-pic"}" aria-hidden="true">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.appendChild(choices);
    return wrap;
  }

  protected replayPrompt(): void {
    this.speakSound(0.85);
  }

  private speakSound(rate = 0.85): void {
    this.game.readingAudio.playPhoneme(this.currentRound.say, { interrupt: true, rate });
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
      rangeKey: "letters",
      stimulusKey: this.currentRound.letter,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyLetterError(this.currentRound.letter, String(option.value))
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected showScaffold(): void {}

  protected onWrong(): void {
    this.root.querySelector('.letterkompas-choice[data-correct="true"]')?.classList.add("reveal");
    this.speakSound(0.6);
    this.game.flashMessage("Luister naar de klank.", "warn");
  }

  // Signature moment: the compass spins a full turn — letter found!
  protected onCorrect(): void {
    this.root.querySelector(".letterkompas-compass")?.classList.add("found");
    const progress = letterProgress(this.game.mastery.getAttempts());
    if (progress.unlockedLetters.length <= this.unlockedLetters.length) return;
    const letter = progress.unlockedLetters[this.unlockedLetters.length];
    const reveal = document.createElement("div");
    reveal.className = "letterkompas-unlock";
    reveal.setAttribute("role", "status");
    reveal.innerHTML = `<small>Nieuwe klank!</small><strong>${letter.toUpperCase()}</strong>`;
    this.root.appendChild(reveal);
    this.game.audio.play("golden");
    this.later(() => reveal.remove(), 950);
  }
}
