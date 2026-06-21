import { childFocusAction, childFocusSummary, childFocusTitle } from "../education/focusLabels";
import type { Game } from "../game/Game";
import { BaseScene, sceneHeader } from "./SceneUtils";

export class MainMenuScene extends BaseScene {
  constructor(game: Game) {
    super(game, "main-menu");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    const data = this.game.data();
    const layout = document.createElement("div");
    layout.className = "menu-layout";
    const actions = document.createElement("div");
    actions.className = "menu-actions";
    const mission = document.createElement("div");
    mission.className = "mission-map mission-world";
    mission.dataset.missionWorld = "sterrenroute";
    mission.setAttribute("aria-label", "Speelroute door Sterrenstad");
    [
      { label: "Getal", icon: "number" },
      { label: "Sprint", icon: "sprint" },
      { label: "WebWoud", icon: "web" },
      { label: "Stad", icon: "city" }
    ].forEach((step, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mission-step";
      button.dataset.missionStep = String(index + 1);
      button.dataset.routeMarker = "true";
      button.setAttribute("aria-label", `Route stap ${index + 1}: ${step.label}`);
      button.innerHTML = `
        <span class="mission-node-world ${step.icon}" aria-hidden="true">
          <span class="mission-icon ${step.icon}"></span>
        </span>
        <strong>${index + 1}</strong>
        <small>${step.label}</small>
      `;
      button.addEventListener("click", () => this.startSession());
      mission.appendChild(button);
    });
    const playButton = this.button("Start avontuur", () => this.startSession());
    playButton.classList.add("play-now");
    playButton.innerHTML = `
      <span class="play-gem" aria-hidden="true"></span>
      <span>Start avontuur</span>
    `;

    const tools = document.createElement("div");
    tools.className = "menu-tools";
    tools.append(
      this.button("Oefenen", () => this.game.showScene("minigame"), "secondary"),
      this.button("Ouders", () => this.game.showScene("parentDashboard"), "ghost"),
      this.button("Instellingen", () => this.game.showScene("settings"), "ghost")
    );

    actions.append(playButton, mission, tools);

    const restored = Object.values(data.progress.cityDistricts).filter((district) => district.restored).length;
    const progressStrip = document.createElement("div");
    progressStrip.className = "kid-progress-strip";
    progressStrip.dataset.kidProgress = "menu";
    progressStrip.setAttribute("aria-label", "BlokBlitz voortgang");
    [
      { label: "Sterren", value: data.progress.stars, tone: "star" },
      { label: "Blokken", value: data.progress.numberBlocks, tone: "block" },
      { label: "Redders", value: data.progress.rescuedDinos + data.progress.rescuedNumerianen, tone: "rescue" },
      { label: "Stad", value: `${restored}/14`, tone: "city" }
    ].forEach((item) => {
      const token = document.createElement("span");
      token.className = `kid-progress-token ${item.tone}`;
      token.dataset.progressToken = item.tone;
      token.innerHTML = `<i aria-hidden="true"></i><strong>${item.value}</strong><small>${item.label}</small>`;
      progressStrip.appendChild(token);
    });
    actions.appendChild(progressStrip);

    const focus = this.game.adaptive.recommendFocus();
    const coach = document.createElement("aside");
    coach.className = "coach-card";
    coach.dataset.focusSkill = focus.skill;
    coach.innerHTML = `
      <p class="eyebrow">Dino Coach</p>
      <h2>${childFocusTitle(focus.skill)}</h2>
      <p>${childFocusAction(focus.skill)}</p>
      <span>${childFocusSummary(focus.skill, focus.representation, focus.range)}</span>
    `;

    const side = document.createElement("div");
    side.className = "menu-side";
    side.append(coach);

    layout.append(actions, side);
    this.root.append(sceneHeader("BlokBlitz", "Dino Redders van Sterrenstad"), layout);
  }

  private startSession(): void {
    this.game.requestFullscreenPlay();
    this.game.save.startNewSession();
    this.game.showScene("numberOfDay");
  }
}
