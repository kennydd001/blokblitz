import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { TRAFFIC_CARDS, trafficChallenge, trafficRound, type TrafficRound } from "../../education/world/traffic";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

// Verkeerspad — traffic safety (optional WO layer). Picture cards: crossing
// safely, lights, being visible, the belt, the blind spot. Tapping an option
// speaks its text; a wrong tap speaks the safety rule. No reading required.
// Logs as domain "world-traffic" / skill trafficSafety.
export class VerkeerspadScene extends MiniGameScene {
  protected readonly emoji = "🚦";
  protected readonly heading = "Verkeerspad";
  private currentRound!: TrafficRound;
  private usedCards: string[] = [];

  constructor(game: Game) {
    super(game, "verkeerspad");
  }

  mount(): void {
    this.usedCards = [];
    super.mount();
  }

  protected makeChallenge(): Challenge {
    // Draw without repeats until the deck runs out, then reshuffle.
    if (this.usedCards.length >= TRAFFIC_CARDS.length) this.usedCards = [];
    const remaining = TRAFFIC_CARDS.filter((card) => !this.usedCards.includes(card.id));
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.usedCards.push(pick.id);
    this.currentRound = trafficRound(pick.id);
    this.instruction = this.currentRound.prompt;
    return trafficChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play verkeer-play";

    const choices = document.createElement("div");
    choices.className = "mini-choices verkeer-choices";
    challenge.options.forEach((option) => {
      const round = this.currentRound.options.find((o) => o.value === option.value);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice verkeer-choice";
      button.dataset.correct = String(option.isCorrect);
      button.setAttribute("aria-label", String(option.value));
      button.innerHTML = `<span class="verkeer-pic" aria-hidden="true">${option.label}</span><small class="verkeer-text">${round?.text ?? ""}</small>`;
      button.addEventListener("click", () => {
        // Speak the option so a pre-reader hears what they chose.
        this.game.voice.speak(String(option.value), { interrupt: true });
        this.pick(option);
      });
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "world-traffic",
      skill: this.currentRound.skill,
      targetKey: this.currentRound.targetKey,
      rangeKey: "traffic",
      stimulusKey: this.currentRound.card.id,
      responseKey: String(option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: "traffic-rule-weak"
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected showScaffold(): void {}

  protected onWrong(): void {
    this.root.querySelector('.verkeer-choice[data-correct="true"]')?.classList.add("reveal");
    this.game.voice.speak(this.currentRound.card.lesson, { interrupt: true });
    this.game.flashMessage(this.currentRound.card.lesson, "warn");
  }

  // Signature moment: the light jumps to green — safe to go!
  protected onCorrect(): void {
    const play = this.root.querySelector<HTMLElement>(".verkeer-play");
    if (!play) return;
    play.classList.add("safe");
    const light = document.createElement("span");
    light.className = "verkeer-licht";
    light.setAttribute("aria-hidden", "true");
    light.textContent = "🚦";
    play.appendChild(light);
  }
}
