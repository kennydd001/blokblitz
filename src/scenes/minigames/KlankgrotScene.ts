import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { classifyPhonicsError, phonicsChallenge, phonicsRound, type PhonicsRound } from "../../education/literacy/phonics";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Klankgrot — phonemic awareness BEFORE letters. Sound crystals pulse; the child
// rescues the picture that begins/ends with a sound, or that the stretched sounds
// blend into. Voice-first: no reading required, a tap on the crystal replays the
// sound, a wrong tap re-stretches it slower (no game over). Logs as a literacy
// (curriculum) attempt so it never pollutes the number stats.
export class KlankgrotScene extends MiniGameScene {
  protected readonly emoji = "🔊";
  protected readonly heading = "Klankgrot";
  private currentRound!: PhonicsRound;

  constructor(game: Game) {
    super(game, "klankgrot");
  }

  protected makeChallenge(): Challenge {
    this.currentRound = phonicsRound(undefined, this.tier());
    this.instruction = this.currentRound.prompt;
    return phonicsChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play klankgrot-play";

    // A glowing crystal: tap to hear the sound again.
    const crystal = document.createElement("button");
    crystal.type = "button";
    crystal.className = "klankgrot-crystal";
    crystal.setAttribute("aria-label", "Hoor de klank opnieuw");
    crystal.innerHTML = `<span aria-hidden="true">🔊</span>`;
    crystal.addEventListener("click", () => this.speakSound());
    wrap.appendChild(crystal);

    const choices = document.createElement("div");
    choices.className = "mini-choices klankgrot-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice klankgrot-choice";
      button.dataset.correct = String(option.isCorrect);
      button.dataset.word = String(option.value);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="klankgrot-pic" aria-hidden="true">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.appendChild(choices);
    return wrap;
  }

  // Speak the target sound(s): a single sound for begin/end, the stretched units
  // for a blend ("mmm... aaa... nnn").
  protected replayPrompt(): void {
    this.speakSound(0.85);
  }

  private speakSound(rate = 0.85): void {
    this.game.readingAudio.playPhonemeSequence(this.currentRound.sayUnits, { interrupt: true, rate });
  }

  // Literacy log path (overrides the number pipeline): a curriculum attempt.
  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "literacy-phonemic",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "phonics",
      stimulusKey: this.currentRound.mode === "blend" ? this.currentRound.targetWord!.word : this.currentRound.targetSound,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyPhonicsError(this.currentRound.mode)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  // No number ten-frame here; the re-teach is auditory.
  protected showScaffold(): void {}

  protected onWrong(): void {
    this.root.querySelector('.klankgrot-choice[data-correct="true"]')?.classList.add("reveal");
    this.speakSound(0.6); // re-stretch slower
    this.game.flashMessage("Luister nog eens goed.", "warn");
  }

  // Signature moment: the sound crystal BURSTS into sparkles.
  protected onCorrect(): void {
    const crystal = this.root.querySelector<HTMLElement>(".klankgrot-crystal");
    if (!crystal) return;
    crystal.classList.add("burst");
    for (let i = 0; i < 6; i += 1) {
      const shard = document.createElement("span");
      shard.className = "klankgrot-shard";
      shard.setAttribute("aria-hidden", "true");
      shard.textContent = "✨";
      shard.style.setProperty("--shard-x", `${Math.round(Math.cos((i / 6) * Math.PI * 2) * 72)}px`);
      shard.style.setProperty("--shard-y", `${Math.round(Math.sin((i / 6) * Math.PI * 2) * 72)}px`);
      crystal.appendChild(shard);
    }
  }
}
