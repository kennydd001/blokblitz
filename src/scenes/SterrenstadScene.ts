import type { Challenge, ChallengeOption, DistrictProgress } from "../education/types";
import { childFocusAction, childFocusTitle } from "../education/focusLabels";
import { RepresentationFactory } from "../education/representations/RepresentationFactory";
import { restorationTaskLabels } from "../gameplay/city/restorationTasks";
import { adaptiveProgressRate } from "../gameplay/session/adaptivePressure";
import { cityMicroGoal } from "../gameplay/session/microGoals";
import type { Game } from "../game/Game";
import { adventureBridge, BaseScene, celebrationBurst, cityBuildField, microGoalChip, missionRibbon, movementPad, rewardStrip, scaffoldStrip, sceneHeader, type ActionFieldPhase, type RewardBadge } from "./SceneUtils";

export class SterrenstadScene extends BaseScene {
  private challenge?: Challenge;
  private district?: DistrictProgress;
  private startedAt = 0;
  private hintUsed = false;
  private feedback = "";
  private rewards: RewardBadge[] = [];
  private rewardMessage = "";
  private showScaffold = false;
  private selectedIndex = 1;
  private fieldProgress = 0;
  private resolving = false;

  constructor(game: Game) {
    super(game, "sterrenstad");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("city");
    this.onInput((action) => {
      if (action === "left") this.moveBuildChoice(-1);
      if (action === "right") this.moveBuildChoice(1);
      if (action === "up" || action === "confirm") this.pickSelected();
      if (action === "pause") this.game.showScene("mainMenu");
    });
    this.render();
  }

  update(dt: number): void {
    if (!this.challenge || this.resolving || this.showScaffold) return;
    const settingsSpeed = this.game.save.getMutableData().settings.speed;
    this.fieldProgress = Math.min(1, this.fieldProgress + dt * adaptiveProgressRate(0.48, this.challenge.displayTimeMs) * settingsSpeed);
    this.syncBuildProgress();
    if (this.fieldProgress >= 1) this.pickSelected();
  }

  private render(): void {
    if (this.challenge) this.game.renderCityBuildChoices3d(this.challenge, this.selectedIndex, this.fieldProgress, this.fieldPhase());
    this.root.classList.toggle("city-build-active", Boolean(this.challenge));
    this.root.replaceChildren();
    const data = this.game.data();
    const districts = Object.values(data.progress.cityDistricts);
    const recommendedDistrict = this.nextDistrict(districts);
    const shell = document.createElement("div");
    shell.className = "city-layout";
    const grid = document.createElement("div");
    grid.className = "district-grid city-map-world";
    grid.dataset.cityMap = "sterrenstad";
    grid.setAttribute("aria-label", "Sterrenstad wijkkaart");
    districts.forEach((district) => {
      const button = document.createElement("button");
      button.type = "button";
      const selected = this.district?.id === district.id;
      const recommended = recommendedDistrict?.id === district.id;
      button.className = `district-card ${district.restored ? "restored" : ""} ${selected ? "selected" : ""} ${recommended ? "recommended" : ""}`;
      button.dataset.restored = String(district.restored);
      button.dataset.targetQuantity = String(district.targetQuantity);
      button.dataset.recommended = String(recommended);
      button.setAttribute("aria-label", `${district.name}: ${district.restored ? `klaar op level ${district.level}` : `bouw ${district.targetQuantity}`}`);
      button.innerHTML = `
        <span class="city-plot-shell" aria-hidden="true"><i></i></span>
        <span class="city-plot-art">${RepresentationFactory.renderSvg(district.representation, district.targetQuantity, { compact: true })}</span>
        <strong>${district.name}</strong>
        <span class="district-status">${district.restored ? `Klaar level ${district.level}` : `Bouw ${district.targetQuantity}`}</span>
      `;
      button.addEventListener("click", () => this.openDistrict(district));
      grid.appendChild(button);
    });

    const side = document.createElement("aside");
    side.className = "city-side";
    const focus = this.game.adaptive.recommendFocus();
    if (recommendedDistrict) {
      const quickBuild = document.createElement("div");
      quickBuild.className = "city-quick-build";
      quickBuild.dataset.nextDistrict = recommendedDistrict.id;
      quickBuild.innerHTML = `
        <span class="city-quick-label">Volgende wijk</span>
        <div class="city-quick-target">
          <strong>${recommendedDistrict.targetQuantity}</strong>
          <span>${RepresentationFactory.renderSvg(recommendedDistrict.representation, recommendedDistrict.targetQuantity, { compact: true })}</span>
        </div>
      `;
      const buildNow = this.button("Bouw nu", () => this.openDistrict(recommendedDistrict), "primary city-build-now");
      buildNow.dataset.recommendedDistrict = recommendedDistrict.id;
      quickBuild.appendChild(buildNow);
      side.appendChild(quickBuild);
    }
    const coach = document.createElement("div");
    coach.className = "runner-coach city-coach";
    coach.dataset.focusSkill = this.challenge?.skill ?? focus.skill;
    coach.innerHTML = `
      <span>Dino Coach</span>
      <strong>${this.challenge && this.district ? `Bouw ${this.district.targetQuantity}` : childFocusTitle(focus.skill)}</strong>
      <em>${this.challenge ? `${childFocusAction(this.challenge.skill)} Kies het beeld dat de wijk herstelt.` : "Tik een wijk. Bouw met groepjes, niet door los te tellen."}</em>
    `;
    side.append(coach, this.stat("Sterren", data.progress.stars), this.stat("Blokken", data.progress.numberBlocks));
    if (this.rewards.length > 0) {
      side.appendChild(rewardStrip(this.rewards, this.rewardMessage || "Wijk hersteld met structuur."));
      side.appendChild(celebrationBurst("build"));
      side.appendChild(adventureBridge("city", "summary", "Missie klaar"));
      const nextActions = document.createElement("div");
      nextActions.className = "city-next-actions";
      nextActions.append(
        this.button(
          "Missie afronden",
          () => {
            this.game.showScene("summary");
          },
          "primary"
        ),
        this.button(
          "Nog een wijk",
          () => {
            this.rewards = [];
            this.rewardMessage = "";
            this.render();
          },
          "secondary"
        )
      );
      side.appendChild(nextActions);
    }
    const tasks = document.createElement("ul");
    tasks.className = "task-list";
    tasks.innerHTML = restorationTaskLabels.map((task) => `<li>${task}</li>`).join("");
    side.appendChild(tasks);

    const actions = document.createElement("div");
    actions.className = "scene-actions";
    actions.append(this.button("Menu", () => this.game.showScene("mainMenu"), "ghost"), this.button("Samenvatting", () => this.game.showScene("summary"), "secondary"));
    shell.append(grid, side);
    this.root.append(sceneHeader("Sterrenstad Bouwers", "Herstel de stad met precies passende getalstructuren."), missionRibbon(4), shell, actions);
    if (this.challenge && this.district) this.root.appendChild(this.cityBuildOverlay());
  }

  private openDistrict(district: DistrictProgress): void {
    this.district = district;
    const initial = this.game.challenges.createCityChallenge(district.id, {
      quantity: district.targetQuantity,
      representation: district.representation
    });
    const representation = this.game.adaptive.chooseRepresentation(initial.skill, initial.quantity);
    this.challenge = this.game.challenges.createCityChallenge(district.id, {
      quantity: district.targetQuantity,
      representation
    });
    this.challenge.displayTimeMs = this.game.adaptive.displayTimeFor(this.challenge.skill, this.challenge.quantity, this.challenge.promptRepresentation);
    this.startedAt = performance.now();
    this.hintUsed = false;
    this.feedback = "";
    this.rewards = [];
    this.rewardMessage = "";
    this.showScaffold = false;
    this.selectedIndex = Math.min(1, this.challenge.options.length - 1);
    this.fieldProgress = 0;
    this.resolving = false;
    this.render();
    this.scrollChallengeIntoView();
  }

  private nextDistrict(districts: DistrictProgress[]): DistrictProgress | undefined {
    return districts.find((district) => !district.restored) ?? districts[0];
  }

  private pick(option: ChallengeOption): void {
    if (!this.challenge || !this.district || this.resolving) return;
    const optionIndex = this.challenge.options.indexOf(option);
    if (optionIndex >= 0) this.selectedIndex = optionIndex;
    const correct = this.game.recordAttempt(this.challenge, option, this.startedAt, this.hintUsed);
    if (correct) {
      this.resolving = true;
      this.fieldProgress = 1;
      const restoredName = this.district.name;
      this.game.renderCityBuildChoices3d(this.challenge, this.selectedIndex, this.fieldProgress, "success");
      this.game.save.restoreDistrict(this.district.id);
      this.feedback = `${restoredName} groeit met ${this.challenge.successEffect}`;
      this.showScaffold = false;
      this.rewards = [
        { label: "Wijk", value: "Klaar", tone: "build" },
        { label: "Sterren", value: "+3", tone: "star" },
        { label: "Level", value: `${this.game.data().progress.currentLevel}`, tone: "rescue" }
      ];
      this.rewardMessage = `${restoredName} groeit in Sterrenstad.`;
      this.challenge = undefined;
      this.district = undefined;
      this.game.flashMessage("Gebouwd met structuur.", "good");
      this.render();
    } else {
      this.hintUsed = true;
      this.rewards = [];
      this.rewardMessage = "";
      this.showScaffold = true;
      this.selectedIndex = this.correctOptionIndex();
      this.fieldProgress = 0;
      this.resolving = false;
      this.feedback = `${this.challenge.safeErrorEffect} ${this.challenge.hint}`;
      this.render();
    }
  }

  private cityBuildOverlay(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "city-build-live";
    overlay.dataset.cityBuildLive = "true";
    if (!this.challenge || !this.district) return overlay;
    overlay.append(
      this.cityBuildHud(),
      cityBuildField(this.challenge, (option) => this.pick(option), this.district.name, this.selectedIndex, {
        progress: this.fieldProgress,
        phase: this.fieldPhase()
      })
    );
    const outcome = document.createElement("div");
    outcome.className = "play-outcome city-build-outcome";
    if (this.showScaffold) outcome.appendChild(scaffoldStrip(this.challenge, "Bijna!"));
    overlay.appendChild(outcome);
    const feedback = document.createElement("div");
    feedback.className = `feedback play-feedback ${this.feedback ? "show" : ""}`;
    feedback.textContent = this.feedback;
    overlay.appendChild(feedback);
    const controls = document.createElement("div");
    controls.className = "scene-actions gameplay-actions city-build-controls";
    controls.append(
      movementPad("object", () => this.moveBuildChoice(-1), () => this.moveBuildChoice(1), {
        label: "Bouw keuze",
        icon: "build",
        handler: () => this.pickSelected()
      }),
      this.iconButton(
        "Terug",
        "back",
        () => {
          this.challenge = undefined;
          this.district = undefined;
          this.showScaffold = false;
          this.feedback = "";
          this.fieldProgress = 0;
          this.resolving = false;
          this.render();
        },
        "ghost"
      )
    );
    overlay.appendChild(controls);
    return overlay;
  }

  private cityBuildHud(): HTMLElement {
    const hud = document.createElement("div");
    hud.className = "play-hud city-play-hud";
    hud.dataset.gameplayHud = "city";
    if (!this.challenge || !this.district) return hud;
    hud.dataset.adaptiveWindow = String(Math.round((this.challenge.displayTimeMs / 1000) * 10) / 10);
    hud.innerHTML = `
      <div class="play-target">
        <span>Bouw</span>
        <strong>${this.district.targetQuantity}</strong>
        <div class="play-target-art">${RepresentationFactory.renderSvg(this.challenge.promptRepresentation, this.challenge.quantity, { label: this.challenge.prompt })}</div>
      </div>
      <div class="play-status">
        <div class="play-title">
          <b>Bouw!</b>
          <span>${this.district.name} - ${this.challenge.prompt}</span>
        </div>
        <div class="play-progress" aria-label="Sterrenstad bouwfocus">
          <i style="width:${this.showScaffold ? 42 : 24}%"></i>
        </div>
      </div>
    `;
    const stats = document.createElement("div");
    stats.className = "city-build-stats play-stats micro-visible";
    stats.append(microGoalChip(cityMicroGoal(), this.selectedIndex + 1, this.challenge.options.length), this.stat("Sterren", this.game.data().progress.stars), this.stat("Blokken", this.game.data().progress.numberBlocks));
    hud.appendChild(stats);
    return hud;
  }

  private moveBuildChoice(delta: number): void {
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

  private fieldPhase(): ActionFieldPhase {
    if (this.showScaffold) return "scaffold";
    return "approach";
  }

  private correctOptionIndex(): number {
    if (!this.challenge) return this.selectedIndex;
    const index = this.challenge.options.findIndex((item) => item.isCorrect);
    return index >= 0 ? index : this.selectedIndex;
  }

  private syncBuildProgress(): void {
    if (!this.challenge) return;
    const progressPercent = Math.round(this.fieldProgress * 100);
    const field = this.root.querySelector<HTMLElement>(".city-build-field");
    if (field) {
      field.dataset.fieldProgress = String(progressPercent);
      field.style.setProperty("--field-progress", `${progressPercent}%`);
    }
    this.game.renderCityBuildChoices3d(this.challenge, this.selectedIndex, this.fieldProgress, this.fieldPhase());
  }

  private scrollChallengeIntoView(): void {
    window.setTimeout(() => {
      const scroller = this.root.parentElement;
      if (scroller) scroller.scrollTop = 0;
      const challenge = this.root.querySelector<HTMLElement>(".city-challenge");
      if (challenge && typeof challenge.scrollIntoView === "function") {
        challenge.scrollIntoView({ block: "start" });
      }
    }, 0);
  }
}
