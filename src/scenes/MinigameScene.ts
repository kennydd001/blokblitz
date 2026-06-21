import type { Challenge, ChallengeOption, MinigameType } from "../education/types";
import { RepresentationFactory } from "../education/representations/RepresentationFactory";
import { minigameTemplates } from "../gameplay/minigames/templates";
import { adaptiveProgressRate } from "../gameplay/session/adaptivePressure";
import { minigameMicroGoal } from "../gameplay/session/microGoals";
import type { Game } from "../game/Game";
import { BaseScene, celebrationBurst, microGoalChip, minigameField, movementPad, rewardStrip, scaffoldStrip, type ActionFieldPhase, type RewardBadge } from "./SceneUtils";

export class MinigameScene extends BaseScene {
  private selectedType: MinigameType = "flash-gates";
  private challenge?: Challenge;
  private startedAt = 0;
  private hintUsed = false;
  private feedback = "";
  private rewards: RewardBadge[] = [];
  private showScaffold = false;
  private selectedIndex = 1;
  private fieldProgress = 0;
  private resolving = false;

  constructor(game: Game) {
    super(game, "minigames");
  }

  mount(params?: unknown): void {
    super.mount(params);
    this.game.overlay.classList.add("gameplay-layer");
    this.game.resetWorld("minigame");
    this.onInput((action) => {
      if (action === "left") this.move(-1);
      if (action === "right") this.move(1);
      if (action === "up" || action === "confirm") this.pickSelected();
      if (action === "pause") this.game.showScene("mainMenu");
    });
    this.selectedType = typeof params === "string" ? (params as MinigameType) : this.game.adaptive.pickNextMinigame(this.game.save.getMutableData().progress.lastChallengeIds);
    this.newChallenge();
  }

  update(dt: number): void {
    if (!this.challenge || this.resolving || this.showScaffold || this.rewards.length > 0) return;
    const settingsSpeed = this.game.save.getMutableData().settings.speed;
    this.fieldProgress = Math.min(1, this.fieldProgress + dt * adaptiveProgressRate(0.52, this.challenge.displayTimeMs) * settingsSpeed);
    this.syncFieldProgress();
    if (this.fieldProgress >= 1) this.pickSelected();
  }

  unmount(): void {
    this.game.overlay.classList.remove("gameplay-layer");
    super.unmount();
  }

  private newChallenge(): void {
    const quantity = this.game.adaptive.nextFocusQuantity();
    const initial = this.game.challenges.createMinigame(this.selectedType, { quantity, scene: "minigame" });
    const representation = this.game.adaptive.chooseRepresentation(initial.skill, initial.quantity);
    this.challenge = this.game.challenges.createMinigame(this.selectedType, { quantity, representation, scene: "minigame" });
    this.challenge.displayTimeMs = this.game.adaptive.displayTimeFor(this.challenge.skill, this.challenge.quantity, this.challenge.promptRepresentation);
    this.startedAt = performance.now();
    this.hintUsed = false;
    this.feedback = "";
    this.rewards = [];
    this.showScaffold = false;
    this.selectedIndex = Math.min(1, this.challenge.options.length - 1);
    this.fieldProgress = 0;
    this.resolving = false;
    this.render();
  }

  private render(): void {
    if (this.challenge) this.game.renderMinigameChoices3d(this.challenge, this.selectedIndex, this.fieldProgress, this.fieldPhase());
    this.root.replaceChildren();
    const tabs = document.createElement("div");
    tabs.className = "minigame-tabs mini-mode-strip";
    tabs.setAttribute("aria-label", "Oefenwereld opdrachten");
    minigameTemplates.forEach((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tab ${template.type === this.selectedType ? "active" : ""}`;
      button.textContent = template.label;
      button.addEventListener("click", () => {
        this.selectedType = template.type;
        this.newChallenge();
      });
      tabs.appendChild(button);
    });

    const play = document.createElement("div");
    play.className = "play-field-layer mini";
    if (this.challenge) {
      play.append(
        minigameField(this.challenge, (option) => this.pick(option), this.selectedIndex, {
          progress: this.fieldProgress,
          phase: this.fieldPhase()
        })
      );
    }

    const outcome = document.createElement("div");
    outcome.className = "play-outcome";
    if (this.challenge && this.rewards.length > 0) outcome.appendChild(rewardStrip(this.rewards, "Opdracht klaar."));
    if (this.challenge && this.showScaffold) outcome.appendChild(scaffoldStrip(this.challenge, "Bijna!"));
    if (this.rewards.length > 0) outcome.appendChild(celebrationBurst("star"));

    const feedback = document.createElement("div");
    feedback.className = `feedback play-feedback ${this.feedback ? "show" : ""}`;
    feedback.textContent = this.feedback;
    const actions = document.createElement("div");
    actions.className = "scene-actions gameplay-actions minigame-actions";
    actions.append(
      movementPad("object", () => this.move(-1), () => this.move(1), {
        label: "Pak voorwerp",
        icon: "grab",
        handler: () => this.pickSelected()
      }),
      this.iconButton("Nieuw", "refresh", () => this.newChallenge(), "secondary")
    );
    const utilityActions = document.createElement("div");
    utilityActions.className = "scene-actions minigame-utility-actions";
    utilityActions.append(this.iconButton("Menu", "menu", () => this.game.showScene("mainMenu")));
    this.root.append(this.playHud(), tabs, play, outcome, feedback, actions, utilityActions);
  }

  private playHud(): HTMLElement {
    const hud = document.createElement("div");
    hud.className = "play-hud mini-play-hud";
    hud.dataset.gameplayHud = "minigame";
    if (!this.challenge) return hud;
    hud.dataset.adaptiveWindow = String(Math.round((this.challenge.displayTimeMs / 1000) * 10) / 10);
    const label = minigameTemplates.find((template) => template.type === this.selectedType)?.label ?? "Oefenen";
    hud.innerHTML = `
      <div class="play-target">
        <span>Zoek</span>
        <strong>${this.targetLabel()}</strong>
        <div class="play-target-art">${RepresentationFactory.renderSvg(this.challenge.promptRepresentation, this.challenge.quantity, { label: this.challenge.prompt })}</div>
      </div>
      <div class="play-status">
        <div class="play-title">
          <b>Pak!</b>
          <span>Oefenwereld - ${label}</span>
        </div>
        <div class="play-progress" aria-label="Oefenwereld focus">
          <i style="width:${this.showScaffold ? 42 : this.rewards.length > 0 ? 100 : 18}%"></i>
        </div>
      </div>
    `;
    const stats = document.createElement("div");
    stats.className = "mini-hud play-stats micro-visible";
    stats.append(microGoalChip(minigameMicroGoal(this.selectedType), this.selectedIndex + 1, this.challenge.options.length), this.stat("Sterren", this.game.data().progress.stars), this.stat("Blokken", this.game.data().progress.numberBlocks));
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
    this.fieldProgress = 0;
    this.showScaffold = false;
    this.feedback = "";
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
      this.feedback = this.challenge.successEffect;
      this.showScaffold = false;
      this.rewards = [
        { label: "Ster", value: "+1", tone: "star" },
        { label: "Blok", value: "+1", tone: "build" }
      ];
      if (this.challenge.challengeType === "rescue-the-herd") this.rewards.unshift({ label: "Dino", value: "+1", tone: "rescue" });
      this.render();
    } else {
      this.hintUsed = true;
      this.selectedIndex = this.correctOptionIndex();
      this.fieldProgress = 0;
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
    if (!this.challenge) return;
    const progressPercent = Math.round(this.fieldProgress * 100);
    const field = this.root.querySelector<HTMLElement>(".minigame-field");
    if (field) {
      field.dataset.fieldProgress = String(progressPercent);
      field.style.setProperty("--field-progress", `${progressPercent}%`);
    }
    if (this.challenge) this.game.renderMinigameChoices3d(this.challenge, this.selectedIndex, this.fieldProgress, this.fieldPhase());
  }
}
