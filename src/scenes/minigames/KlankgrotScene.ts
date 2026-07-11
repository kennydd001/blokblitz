import { buildCurriculumAttempt } from "../../education/challengeLogger";
import {
  minimalPairChallenge,
  minimalPairRound,
  recommendedMinimalPairRemediation,
  type MinimalPairRound
} from "../../education/literacy/minimalPairRounds";
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
  private currentRound?: PhonicsRound;
  private currentPair?: MinimalPairRound;

  constructor(game: Game) {
    super(game, "klankgrot");
  }

  protected makeChallenge(): Challenge {
    const recommended = recommendedMinimalPairRemediation(this.game.mastery.getAttempts());
    const serveRemediation = Boolean(recommended) && (this.round === 1 || this.round % 2 === 0);
    const serveDiscoveryPair = !recommended && this.tier() >= 2 && this.round % 4 === 0;
    if (serveRemediation || serveDiscoveryPair) {
      this.currentRound = undefined;
      this.currentPair = minimalPairRound(recommended?.contrast);
      this.instruction = this.currentPair.prompt;
      return minimalPairChallenge(this.currentPair);
    }

    this.currentPair = undefined;
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
      const wordLabel = this.currentPair ? `<small>${String(option.value)}</small>` : "";
      button.classList.toggle("minimal-pair", Boolean(this.currentPair));
      button.innerHTML = `<span class="klankgrot-pic" aria-hidden="true">${option.label}</span>${wordLabel}`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.appendChild(choices);
    return wrap;
  }

  // Speak one isolated sound for begin/end, or the natural slowed word for a blend.
  protected announceRound(): void {
    if (this.currentPair) {
      this.speakSound(0.85);
      return;
    }
    super.announceRound();
  }

  protected replayPrompt(): void {
    this.speakSound(0.85);
  }

  private speakSound(rate = 0.85): void {
    if (this.currentPair) {
      this.game.voice.speak(this.currentPair.prompt, { interrupt: true });
      this.game.readingAudio.playZoemWord(this.currentPair.targetWord.units, this.currentPair.targetWord.word, { interrupt: false, rate });
      return;
    }
    if (this.currentRound) this.game.readingAudio.playPhonemeSequence(this.currentRound.sayUnits, { interrupt: true, rate });
  }

  // Literacy log path (overrides the number pipeline): a curriculum attempt.
  protected currentTargetKey(): string | undefined {
    return this.currentPair?.targetKey ?? this.currentRound?.targetKey;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    if (this.currentPair) {
      const attempt = buildCurriculumAttempt({
        sessionId: this.game.save.getMutableData().progress.sessionId,
        domain: "literacy-phonemic",
        skill: this.currentPair.skill,
        targetKey: this.currentPair.targetKey,
        rangeKey: "minimal-pair",
        stimulusKey: this.currentPair.targetWord.word,
        responseKey: String(option.value),
        wasCorrect: option.isCorrect,
        reactionTimeMs: performance.now() - this.startedAt,
        hintUsed: this.hintUsed,
        errorType: `minimal-pair-${this.currentPair.contrast.key}`
      });
      return this.game.recordCurriculumAttempt(attempt);
    }

    const round = this.currentRound!;
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "literacy-phonemic",
      skill: round.skill,
      targetKey: round.targetKey,
      rangeKey: "phonics",
      stimulusKey: round.mode === "blend" ? round.targetWord!.word : round.targetSound,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: classifyPhonicsError(round.mode)
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  // No number ten-frame here; the re-teach is auditory.
  protected showScaffold(): void {}

  protected onWrong(): void {
    this.root.querySelector('.klankgrot-choice[data-correct="true"]')?.classList.add("reveal");
    if (this.currentPair) {
      this.game.voice.speak(this.currentPair.hintText, { interrupt: true });
      this.game.readingAudio.playZoemWord(this.currentPair.targetWord.units, this.currentPair.targetWord.word, { interrupt: false, rate: 0.78 });
      this.game.flashMessage(this.currentPair.hintText, "warn");
      return;
    }
    this.speakSound(0.6);
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
