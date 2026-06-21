import type { Challenge, ChallengeOption } from "../education/types";
import { RepresentationFactory } from "../education/representations/RepresentationFactory";
import { runnerMechanicLabels, runnerMechanics, type RunnerMechanic } from "../gameplay/runner/runnerMechanics";
import { adaptiveProgressRate } from "../gameplay/session/adaptivePressure";
import { isRouteMilestone, runnerMicroGoals } from "../gameplay/session/microGoals";
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

export class BlokBlitzScene extends BaseScene {
  private index = 0;
  private selectedIndex = 1;
  private challenge?: Challenge;
  private startedAt = 0;
  private hintUsed = false;
  private feedback = "";
  private rewards: RewardBadge[] = [];
  private showScaffold = false;
  private speed = 1;
  private distance = 0;
  private snapActive = false;
  private fieldProgress = 0;
  private resolving = false;

  constructor(game: Game) {
    super(game, "blokblitz");
  }

  mount(): void {
    super.mount();
    this.game.overlay.classList.add("gameplay-layer");
    this.game.resetWorld("runner");
    this.onInput((action) => {
      if (action === "left") this.moveLane(-1);
      if (action === "right") this.moveLane(1);
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
    if (!this.challenge) return;
    const settingsSpeed = this.game.save.getMutableData().settings.speed;
    this.distance += dt * this.speed * settingsSpeed;
    const meter = this.root.querySelector<HTMLElement>("[data-distance]");
    if (meter) meter.textContent = `${Math.floor(this.distance * 10)} m`;
    if (this.resolving) return;
    this.fieldProgress = Math.min(1, this.fieldProgress + dt * adaptiveProgressRate(0.32 + this.speed * 0.12, this.challenge.displayTimeMs) * settingsSpeed);
    this.syncFieldProgress();
    if (this.fieldProgress >= 1) this.pickSelected();
  }

  private loadChallenge(): void {
    if (this.index >= runnerMechanics.length) {
      this.game.showScene("webwoud");
      this.game.adventureToast("sprint", "web", "Zwaai!");
      return;
    }
    const mechanic = runnerMechanics[this.index];
    const base = this.game.save.getMutableData().progress.numberOfDay;
    const quantity = mechanic === "make-ten-shield" ? 6 + (this.index % 4) : ((base + this.index * 2) % 10) + 1;
    const initial = this.game.challenges.createRunnerChallenge(mechanic, { quantity });
    const representation = this.game.adaptive.chooseRepresentation(initial.skill, initial.quantity);
    this.challenge = this.game.challenges.createRunnerChallenge(mechanic, { quantity, representation });
    this.challenge.displayTimeMs = this.game.adaptive.displayTimeFor(this.challenge.skill, this.challenge.quantity, this.challenge.promptRepresentation);
    this.startedAt = performance.now();
    this.hintUsed = false;
    this.snapActive = false;
    this.feedback = "";
    this.rewards = [];
    this.showScaffold = false;
    this.selectedIndex = Math.min(1, this.challenge.options.length - 1);
    this.fieldProgress = 0;
    this.resolving = false;
    this.render();
  }

  private render(): void {
    if (!this.challenge) return;
    this.game.renderRunnerChoices3d(this.challenge, this.selectedIndex, this.fieldProgress, this.fieldPhase());
    this.root.replaceChildren();
    const mechanic = runnerMechanics[Math.min(this.index, runnerMechanics.length - 1)] as RunnerMechanic;
    const playField = document.createElement("div");
    playField.className = `play-field-layer runner ${this.snapActive ? "snap-active" : ""}`;
    playField.append(
      optionGrid(this.challenge, (option) => this.pick(option), this.selectedIndex, "lanes", {
        progress: this.fieldProgress,
        phase: this.fieldPhase()
      })
    );

    const outcome = document.createElement("div");
    outcome.className = "play-outcome";
    if (this.rewards.length > 0) outcome.appendChild(rewardStrip(this.rewards, this.snapActive ? "Subitize Snap!" : "Baan open."));
    if (this.showScaffold) outcome.appendChild(scaffoldStrip(this.challenge, "Bijna!"));
    if (this.rewards.length > 0 && !this.snapActive) outcome.appendChild(celebrationBurst("star"));
    if (this.snapActive) outcome.appendChild(this.snapBurst());

    const controls = document.createElement("div");
    controls.className = "scene-actions gameplay-actions";
    const actionGoal = runnerMicroGoals[mechanic];
    controls.append(
      movementPad("lane", () => this.moveLane(-1), () => this.moveLane(1), {
        label: actionGoal.label,
        icon: actionGoal.kind,
        handler: () => this.pickSelected()
      }),
      this.iconButton("Menu", "menu", () => this.game.showScene("mainMenu"))
    );

    const feedback = document.createElement("div");
    feedback.className = `feedback play-feedback ${this.feedback ? "show" : ""}`;
    feedback.textContent = this.feedback;

    this.root.append(this.playHud(mechanic), playField, outcome, feedback, controls);
  }

  private playHud(mechanic: RunnerMechanic): HTMLElement {
    if (!this.challenge) return document.createElement("div");
    const hud = document.createElement("div");
    hud.className = "play-hud runner-play-hud";
    hud.dataset.gameplayHud = "runner";
    hud.dataset.adaptiveWindow = String(Math.round((this.challenge.displayTimeMs / 1000) * 10) / 10);
    const progress = Math.max(0, Math.min(100, Math.round((this.index / runnerMechanics.length) * 100)));
    const targetArt = RepresentationFactory.renderSvg(this.challenge.promptRepresentation, this.challenge.quantity, { label: this.challenge.prompt });
    hud.innerHTML = `
      <div class="play-target" data-target-visible="true">
        <span>Zoek</span>
        <strong>${this.targetLabel()}</strong>
        <div class="play-target-art">${targetArt}</div>
      </div>
      <div class="play-status">
        <div class="play-title">
          <b>Rennen!</b>
          <span>BlokBlitz Sprint - ${runnerMechanicLabels[mechanic]}</span>
        </div>
        <div class="play-progress" aria-label="Sprint voortgang">
          <i style="width:${progress}%"></i>
        </div>
      </div>
    `;

    const data = this.game.data();
    const stats = document.createElement("div");
    stats.className = "runner-hud play-tokens micro-visible";
    stats.dataset.hudStyle = "tokens";
    const distanceToken = playToken("distance", "Afstand", "0 m");
    distanceToken.querySelector("strong")?.setAttribute("data-distance", "");
    stats.append(
      microGoalChip(runnerMicroGoals[mechanic], Math.min(this.index + 1, runnerMechanics.length), runnerMechanics.length),
      playToken("speed", "Boost", `${this.speed.toFixed(1)}x`),
      distanceToken,
      playToken("streak", "Streak", data.progress.dinoStreak)
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

  private moveLane(delta: number): void {
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
      this.fieldProgress = 1;
      const snap = this.challenge.challengeType === "flash-gates" && performance.now() - this.startedAt <= this.challenge.displayTimeMs + 80;
      this.snapActive = snap;
      this.speed = Math.min(3.2, this.speed + (snap ? 0.45 : 0.2));
      this.feedback = snap ? "Subitize Snap! Snelle boost." : this.challenge.successEffect;
      this.showScaffold = false;
      this.rewards = [
        { label: "Sterren", value: snap ? "+3" : "+1", tone: snap ? "snap" : "star" },
        { label: "Blok", value: "+1", tone: "build" },
        { label: "Streak", value: `x${this.game.data().progress.dinoStreak}`, tone: "rescue" }
      ];
      this.index += 1;
      if (isRouteMilestone(this.index, runnerMechanics.length)) {
        this.game.save.award({ stars: 1 });
        this.rewards.push({ label: "Route", value: "+1", tone: "star" });
      }
      this.render();
      window.setTimeout(() => this.loadChallenge(), 620);
    } else {
      this.speed = Math.max(0.75, this.speed - 0.15);
      this.hintUsed = true;
      this.snapActive = false;
      this.selectedIndex = this.correctOptionIndex();
      this.fieldProgress = 0.14;
      this.resolving = false;
      this.rewards = [];
      this.showScaffold = true;
      this.feedback = `${this.challenge.safeErrorEffect} ${this.challenge.hint}`;
      this.render();
    }
  }

  private fieldPhase(): ActionFieldPhase {
    if (this.snapActive || this.rewards.length > 0) return "success";
    if (this.showScaffold) return "scaffold";
    return "approach";
  }

  private correctOptionIndex(): number {
    if (!this.challenge) return this.selectedIndex;
    const index = this.challenge.options.findIndex((item) => item.isCorrect);
    return index >= 0 ? index : this.selectedIndex;
  }

  private syncFieldProgress(): void {
    const progressPercent = Math.round(this.fieldProgress * 100);
    const field = this.root.querySelector<HTMLElement>(".option-grid.lanes.game-field");
    if (field) {
      field.dataset.fieldProgress = String(progressPercent);
      field.style.setProperty("--field-progress", `${progressPercent}%`);
    }
    const selected = this.root.querySelector<HTMLElement>(".option-card.selected");
    if (selected) selected.style.setProperty("--hero-y", `${34 + Math.round(this.fieldProgress * 112)}px`);
    if (this.challenge) this.game.renderRunnerChoices3d(this.challenge, this.selectedIndex, this.fieldProgress, this.fieldPhase());
  }

  private snapBurst(): HTMLElement {
    const burst = document.createElement("div");
    burst.className = "snap-burst";
    burst.dataset.snap = "true";
    burst.setAttribute("aria-label", "Subitize Snap");
    burst.innerHTML = `
      <strong>SNAP</strong>
      <span></span><span></span><span></span><span></span><span></span><span></span>
    `;
    return burst;
  }
}
