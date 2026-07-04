import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { storyChallenge, storySession, type StoryRound } from "../../education/literacy/stories";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Luisterbos — listening comprehension. A tiny story is read aloud (tap the book
// to hear it again), then two picture questions about it. No reading required;
// tapping an option speaks it. Logs as listening-comprehension.
export class LuisterbosScene extends MiniGameScene {
  protected readonly emoji = "🌳";
  protected readonly heading = "Luisterbos";
  private rounds: StoryRound[] = [];
  private currentRound!: StoryRound;

  constructor(game: Game) {
    super(game, "luisterbos");
  }

  mount(): void {
    this.rounds = storySession(3);
    this.total = this.rounds.length;
    super.mount();
  }

  protected makeChallenge(): Challenge {
    // Rounds follow the session plan; replay rebuilds a fresh plan.
    if (this.round - 1 >= this.rounds.length) {
      this.rounds = storySession(3);
    }
    this.currentRound = this.rounds[(this.round - 1) % this.rounds.length];
    this.instruction = this.currentRound.question.prompt;
    return storyChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play luister-play";

    // The story card: title + a big book button that (re)reads the story.
    const card = document.createElement("button");
    card.type = "button";
    card.className = "luister-story";
    card.setAttribute("aria-label", `Luister naar ${this.currentRound.story.title}`);
    card.innerHTML = `<span class="luister-pic" aria-hidden="true">${this.currentRound.story.emoji}</span><span class="luister-copy"><strong>${this.currentRound.story.title}</strong><small>📖 tik om te luisteren</small></span>`;
    card.addEventListener("click", () => this.tellStory());
    wrap.appendChild(card);

    const choices = document.createElement("div");
    choices.className = "mini-choices luister-choices";
    challenge.options.forEach((option) => {
      const round = this.currentRound.question.options.find((o) => o.label === option.value);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice luister-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="luister-option-pic" aria-hidden="true">${round?.emoji ?? option.label}</span><small class="luister-option-text">${option.value}</small>`;
      button.addEventListener("click", () => {
        this.game.voice.speak(String(option.value), { interrupt: true });
        this.pick(option);
      });
      choices.appendChild(button);
    });
    wrap.appendChild(choices);

    // A NEW story opens with the story itself, then the question.
    if (this.currentRound.storyStart) {
      this.later(() => this.tellStory(true), 250);
    }
    return wrap;
  }

  /** Read the story aloud (slightly slower); optionally chain the question after. */
  private tellStory(thenQuestion = false): void {
    this.game.voice.speak(this.currentRound.story.text, { interrupt: true, rate: 0.92 });
    if (thenQuestion) {
      // Rough duration estimate; the question repeats after the story lands.
      this.later(() => this.game.voice.speak(this.currentRound.question.prompt, { interrupt: false }), this.currentRound.story.text.length * 68 + 800);
    }
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "listening-comprehension",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "stories",
      stimulusKey: this.currentRound.story.id,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: "listening-weak"
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected showScaffold(): void {}

  protected onWrong(): void {
    this.root.querySelector('.luister-choice[data-correct="true"]')?.classList.add("reveal");
    // The re-teach IS re-listening: read the story again.
    this.tellStory();
    this.game.flashMessage("Luister nog eens naar het verhaaltje.", "warn");
  }

  // Signature moment: the story card blooms and leaves drift down.
  protected onCorrect(): void {
    const story = this.root.querySelector<HTMLElement>(".luister-story");
    if (!story) return;
    story.classList.add("bloom");
    for (let i = 0; i < 4; i += 1) {
      const leaf = document.createElement("span");
      leaf.className = "luister-leaf";
      leaf.setAttribute("aria-hidden", "true");
      leaf.textContent = "🍃";
      leaf.style.left = `${18 + i * 22}%`;
      leaf.style.animationDelay = `${i * 0.12}s`;
      story.appendChild(leaf);
    }
  }
}
