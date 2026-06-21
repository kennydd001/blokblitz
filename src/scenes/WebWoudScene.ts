import type { Challenge, ChallengeOption } from "../education/types";
import { RepresentationFactory } from "../education/representations/RepresentationFactory";
import { anchorDecisionPlan } from "../gameplay/webwoud/anchorDecisions";
import { adaptiveProgressRate } from "../gameplay/session/adaptivePressure";
import { isRouteMilestone, webMicroGoal } from "../gameplay/session/microGoals";
import type { Game } from "../game/Game";
import {
  BaseScene,
  celebrationBurst,
  microGoalChip,
  movementPad,
  optionGrid,
  playToken,
  rewardStrip,
  scaffoldStrip,
  type ActionFieldPhase,
  type RewardBadge
} from "./SceneUtils";

export class WebWoudScene extends BaseScene {
  private index = 0;
  private selectedIndex = 1;
  private challenge?: Challenge;
  private startedAt = 0;
  private hintUsed = false;
  private feedback = "";
  private rewards: RewardBadge[] = [];
  private showScaffold = false;
  private swingProgress = 0;
  private resolving = false;

  constructor(game: Game) {
    super(game, "webwoud");
  }

  mount(): void {
    super.mount();
    this.game.overlay.classList.add("gameplay-layer");
    this.game.resetWorld("webwoud");
    this.onInput((action) => {
      if (action === "left") this.move(-1);
      if (action === "right") this.move(1);
      if (action === "up" || action === "confirm") this.pickSelected();
      if (action === "pause") this.game.showScene("mainMenu");
    });
    this.loadChallenge();
  }

  unmount(): void {
    this.game.overlay.classList.remove("gameplay-layer");
    super.unmount();
  }

  update(dt: number): void {
    if (!this.challenge || this.resolving) return;
    const settingsSpeed = this.game.save.getMutableData().settings.speed;
    this.swingProgress = Math.min(1, this.swingProgress + dt * adaptiveProgressRate(0.38, this.challenge.displayTimeMs) * settingsSpeed);
    this.syncFieldProgress();
    if (this.swingProgress >= 1) this.pickSelected();
  }

  private loadChallenge(): void {
    if (this.index >= anchorDecisionPlan.length) {
      this.game.showScene("city");
      this.game.adventureToast("web", "city", "Bouw!");
      return;
    }
    const decision = anchorDecisionPlan[this.index];
    const quantity = ((this.index + this.game.save.getMutableData().progress.numberOfDay) % 10) + 1;
    const initial = this.game.challenges.createMinigame(decision.minigameType, {
      quantity,
      representation: decision.promptRepresentation,
      scene: "webwoud",
      levelId: `webwoud-${decision.decision}`
    });
    const representation = this.game.adaptive.chooseRepresentation(initial.skill, initial.quantity);
    const challenge = this.game.challenges.createMinigame(decision.minigameType, {
      quantity,
      representation,
      scene: "webwoud",
      levelId: `webwoud-${decision.decision}`
    });
    challenge.displayTimeMs = this.game.adaptive.displayTimeFor(challenge.skill, challenge.quantity, challenge.promptRepresentation);
    this.challenge = {
      ...challenge,
      title: `WebWoud: ${decision.routeLabel}`,
      mechanic: `Zwaai naar het anker voor ${decision.decision}.`,
      successEffect: `${challenge.successEffect} De kooi opent via ${decision.routeLabel}.`,
      safeErrorEffect: `${challenge.safeErrorEffect} De route toont ${decision.routeLabel} stap voor stap.`
    };
    this.startedAt = performance.now();
    this.hintUsed = false;
    this.selectedIndex = Math.min(1, this.challenge.options.length - 1);
    this.feedback = "";
    this.rewards = [];
    this.showScaffold = false;
    this.swingProgress = 0;
    this.resolving = false;
    this.render();
  }

  private render(): void {
    if (!this.challenge) return;
    this.game.renderWebChoices3d(this.challenge.options, this.selectedIndex, this.swingProgress, this.fieldPhase());
    this.root.replaceChildren();
    const decision = anchorDecisionPlan[this.index];
    const canopy = document.createElement("div");
    canopy.className = "play-field-layer web";
    canopy.append(
      optionGrid(this.challenge, (option) => this.pick(option), this.selectedIndex, "anchors", {
        progress: this.swingProgress,
        phase: this.fieldPhase()
      })
    );

    const outcome = document.createElement("div");
    outcome.className = "play-outcome";
    if (this.rewards.length > 0) outcome.appendChild(rewardStrip(this.rewards, "Redding gelukt."));
    if (this.showScaffold) outcome.appendChild(scaffoldStrip(this.challenge, "Bijna!"));
    if (this.rewards.length > 0) outcome.appendChild(celebrationBurst("rescue"));

    const feedback = document.createElement("div");
    feedback.className = `feedback play-feedback ${this.feedback ? "show" : ""}`;
    feedback.textContent = this.feedback;
    const actions = document.createElement("div");
    actions.className = "scene-actions gameplay-actions";
    actions.append(
      movementPad("anchor", () => this.move(-1), () => this.move(1), {
        label: "Zwaai naar anker",
        icon: "swing",
        handler: () => this.pickSelected()
      }),
      this.iconButton("Menu", "menu", () => this.game.showScene("mainMenu"))
    );
    this.root.append(this.playHud(decision?.decision ?? "anker"), canopy, outcome, feedback, actions);
  }

  private playHud(decision: string): HTMLElement {
    if (!this.challenge) return document.createElement("div");
    const hud = document.createElement("div");
    hud.className = "play-hud web-play-hud";
    hud.dataset.gameplayHud = "webwoud";
    hud.dataset.adaptiveWindow = String(Math.round((this.challenge.displayTimeMs / 1000) * 10) / 10);
    const progress = Math.max(0, Math.min(100, Math.round((this.index / anchorDecisionPlan.length) * 100)));
    hud.innerHTML = `
      <div class="play-target">
        <span>Zoek</span>
        <strong>${this.targetLabel()}</strong>
        <div class="play-target-art">${RepresentationFactory.renderSvg(this.challenge.promptRepresentation, this.challenge.quantity, { label: this.challenge.prompt })}</div>
      </div>
      <div class="play-status">
        <div class="play-title">
          <b>Zwaai!</b>
          <span>WebWoud Redders - ${decision}</span>
        </div>
        <div class="play-progress" aria-label="WebWoud voortgang">
          <i style="width:${progress}%"></i>
        </div>
      </div>
    `;

    const stats = document.createElement("div");
    stats.className = "web-hud play-tokens micro-visible";
    stats.dataset.hudStyle = "tokens";
    const activeDecision = anchorDecisionPlan[this.index]?.decision ?? "quantity matching";
    stats.append(
      microGoalChip(webMicroGoal(activeDecision), Math.min(this.index + 1, anchorDecisionPlan.length), anchorDecisionPlan.length),
      playToken("anchor", "Anker", this.selectedIndex + 1),
      playToken("rescue", "Redding", `${this.index + 1}/${anchorDecisionPlan.length}`),
      playToken("stars", "Sterren", this.game.data().progress.stars)
    );
    hud.appendChild(stats);
    return hud;
  }

  private targetLabel(): string {
    if (!this.challenge) return "";
    if (this.challenge.challengeType === "make-ten-shield" || this.challenge.challengeType === "train-of-ten") return "Maak 10";
    if (this.challenge.challengeType === "enemy-wave-compare") return "Grootste";
    if (this.challenge.challengeType === "split-chests") return "Splits";
    if (this.challenge.challengeType === "one-more-one-less") return "+1";
    return String(this.challenge.quantity);
  }

  private move(delta: number): void {
    if (!this.challenge || this.resolving) return;
    this.selectedIndex = Math.max(0, Math.min(this.challenge.options.length - 1, this.selectedIndex + delta));
    this.render();
  }

  private pickSelected(): void {
    if (!this.challenge || this.resolving) return;
    this.pick(this.challenge.options[this.selectedIndex]);
  }

  private pick(option: ChallengeOption): void {
    if (!this.challenge || this.resolving) return;
    const optionIndex = this.challenge.options.indexOf(option);
    if (optionIndex >= 0) this.selectedIndex = optionIndex;
    const correct = this.game.recordAttempt(this.challenge, option, this.startedAt, this.hintUsed);
    if (correct) {
      this.resolving = true;
      this.swingProgress = 1;
      this.feedback = this.challenge.successEffect;
      this.showScaffold = false;
      this.rewards = [
        { label: "Numeriaan", value: "+1", tone: "rescue" },
        { label: "Ster", value: "+1", tone: "star" },
        { label: "Blok", value: "+1", tone: "build" }
      ];
      this.index += 1;
      if (isRouteMilestone(this.index, anchorDecisionPlan.length)) {
        this.game.save.award({ numerianen: 1 });
        this.rewards.push({ label: "Redding", value: "+1", tone: "rescue" });
      }
      this.render();
      window.setTimeout(() => this.loadChallenge(), 620);
    } else {
      this.hintUsed = true;
      this.selectedIndex = this.correctOptionIndex();
      this.swingProgress = 0.16;
      this.resolving = false;
      this.rewards = [];
      this.showScaffold = true;
      this.feedback = `${this.challenge.safeErrorEffect} ${this.challenge.hint}`;
      this.render();
    }
  }

  private fieldPhase(): ActionFieldPhase {
    if (this.rewards.length > 0) return "success";
    if (this.showScaffold) return "scaffold";
    return "approach";
  }

  private correctOptionIndex(): number {
    if (!this.challenge) return this.selectedIndex;
    const index = this.challenge.options.findIndex((item) => item.isCorrect);
    return index >= 0 ? index : this.selectedIndex;
  }

  private syncFieldProgress(): void {
    const progressPercent = Math.round(this.swingProgress * 100);
    const field = this.root.querySelector<HTMLElement>(".option-grid.anchors.game-field");
    if (field) {
      field.dataset.fieldProgress = String(progressPercent);
      field.style.setProperty("--field-progress", `${progressPercent}%`);
    }
    const selected = this.root.querySelector<HTMLElement>(".option-card.selected");
    if (selected) selected.style.setProperty("--hero-y", `${28 + Math.round(this.swingProgress * 82)}px`);
    if (this.challenge) this.game.renderWebChoices3d(this.challenge.options, this.selectedIndex, this.swingProgress, this.fieldPhase());
  }
}
