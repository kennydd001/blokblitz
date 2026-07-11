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
  private safeSteps: string[] = [];

  constructor(game: Game) {
    super(game, "verkeerspad");
  }

  mount(): void {
    this.usedCards = [];
    this.safeSteps = [];
    super.mount();
  }

  protected makeChallenge(): Challenge {
    // Draw without repeats from the child's current safety tier.
    const eligible = TRAFFIC_CARDS.filter((card) => card.stage <= this.tier());
    let remaining = eligible.filter((card) => !this.usedCards.includes(card.id));
    if (remaining.length === 0) {
      this.usedCards = [];
      remaining = eligible;
    }
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.usedCards.push(pick.id);
    this.currentRound = trafficRound(pick.id);
    this.instruction = this.currentRound.prompt;
    return trafficChallenge(this.currentRound);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play verkeer-play";

    const route = document.createElement("div");
    route.className = "verkeer-route";
    route.setAttribute("aria-label", `${this.safeSteps.length} van ${this.total} veilige stappen naar school`);
    const home = document.createElement("span");
    home.className = "verkeer-home";
    home.setAttribute("aria-hidden", "true");
    home.textContent = "🏠";
    const road = document.createElement("div");
    road.className = "verkeer-road";
    for (let index = 0; index < this.total; index += 1) {
      const step = document.createElement("i");
      step.dataset.step = String(index);
      if (index < this.safeSteps.length) step.classList.add("safe");
      road.appendChild(step);
    }
    const walker = document.createElement("span");
    walker.className = "verkeer-walker";
    walker.setAttribute("aria-hidden", "true");
    walker.textContent = "🦕";
    walker.style.left = `${6 + (this.safeSteps.length / this.total) * 88}%`;
    road.appendChild(walker);
    const school = document.createElement("span");
    school.className = "verkeer-school";
    school.setAttribute("aria-hidden", "true");
    school.textContent = "🏫";
    route.append(home, road, school);
    wrap.appendChild(route);

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
      button.addEventListener("click", () => this.pickAfterSpeaking(option, String(option.value)));
      choices.appendChild(button);
    });
    wrap.appendChild(choices);
    return wrap;
  }

  protected currentTargetKey(): string | undefined {
    return this.currentRound?.targetKey;
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
    this.root.querySelector(".verkeer-route")?.classList.add("caution");
    const correct = this.currentRound.options.find((option) => option.isCorrect);
    const rule = document.createElement("div");
    rule.className = "verkeer-rule";
    rule.setAttribute("aria-live", "polite");
    rule.innerHTML = `<span aria-hidden="true">${correct?.emoji ?? "✋"}</span><strong>${this.currentRound.card.lesson}</strong>`;
    this.root.querySelector(".verkeer-rule")?.remove();
    this.root.querySelector(".verkeer-play")?.appendChild(rule);
    this.reteach(this.currentRound.card.lesson);
  }

  // Signature moment: each safe answer moves the dino one road section closer.
  protected onCorrect(): void {
    const play = this.root.querySelector<HTMLElement>(".verkeer-play");
    if (!play) return;
    play.classList.add("safe");
    if (this.safeSteps.length < this.correctRounds) this.safeSteps.push(this.currentRound.card.id);
    const route = play.querySelector<HTMLElement>(".verkeer-route");
    route?.classList.remove("caution");
    play.querySelector(".verkeer-rule")?.classList.add("understood");
    const walker = route?.querySelector<HTMLElement>(".verkeer-walker");
    route?.querySelector<HTMLElement>(`[data-step="${this.correctRounds - 1}"]`)?.classList.add("safe", "fresh");
    route?.setAttribute("aria-label", `${this.correctRounds} van ${this.total} veilige stappen naar school`);
    if (route && walker) {
      walker.style.left = `${6 + (this.correctRounds / this.total) * 88}%`;
      walker.classList.add("walking");
      if (this.correctRounds >= this.total) route.classList.add("arrived");
    }
    const light = document.createElement("span");
    light.className = "verkeer-licht";
    light.setAttribute("aria-hidden", "true");
    light.textContent = "🚦";
    play.appendChild(light);
  }

  protected mountReplay(): void {
    this.usedCards = [];
    this.safeSteps = [];
    super.mountReplay();
  }
}
