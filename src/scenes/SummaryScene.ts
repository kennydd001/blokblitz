import { childFocusAction, childFocusTitle } from "../education/focusLabels";
import type { Game } from "../game/Game";
import { adventureBridge, BaseScene, missionRibbon, sceneHeader } from "./SceneUtils";

export class SummaryScene extends BaseScene {
  constructor(game: Game) {
    super(game, "summary");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("summary");
    this.game.save.endSession();
    const data = this.game.data();
    const session = data.progress.sessions.at(-1);
    const earnedStars = session?.starsEarned ?? 0;
    const rescued = session?.rescued ?? 0;
    const finale = document.createElement("div");
    finale.className = "summary-finale";
    finale.dataset.summaryWorld = "finish";
    finale.innerHTML = `
      <div class="finish-city" aria-hidden="true">
        <span class="finish-tower tower-one"></span>
        <span class="finish-tower tower-two"></span>
        <span class="finish-tower tower-three"></span>
      </div>
      <div class="finish-route" aria-hidden="true"></div>
      <div class="finish-gate" aria-hidden="true">
        <span class="finish-gate-ring"></span>
        <span class="finish-gate-star">${earnedStars}</span>
      </div>
      <div class="finish-dino" aria-hidden="true">
        <span class="finish-dino-back"></span>
      </div>
      <div class="finish-rescue-count" aria-label="${rescued} reddingen">${rescued}</div>
    `;
    const panel = document.createElement("div");
    panel.className = "summary-grid summary-scoreboard";
    panel.append(
      this.stat("Sterren", earnedStars),
      this.stat("Reddingen", rescued),
      this.stat("Pogingen", session?.attempts ?? 0),
      this.stat("Streak", data.progress.dinoStreak)
    );
    const parentDetails = document.createElement("details");
    parentDetails.className = "summary-parent-details";
    parentDetails.innerHTML = `<summary>Voor ouders</summary>`;
    parentDetails.appendChild(panel);
    const restored = Object.values(data.progress.cityDistricts).filter((district) => district.restored).length;
    const treasure = document.createElement("div");
    treasure.className = "summary-treasure-trail";
    treasure.dataset.summaryProgress = "treasure-trail";
    treasure.setAttribute("aria-label", "Sessie buit en stadsgroei");
    [
      { label: "Sterren gepakt", value: `+${earnedStars}`, tone: "star" },
      { label: "Reddingen", value: rescued, tone: "rescue" },
      { label: "Blokken over", value: data.progress.numberBlocks, tone: "block" },
      { label: "Stad groeit", value: `${restored}/14`, tone: "city" }
    ].forEach((item, index) => {
      const node = document.createElement("span");
      node.className = `summary-treasure ${item.tone}`;
      node.dataset.treasureStep = String(index + 1);
      node.innerHTML = `<i aria-hidden="true"></i><strong>${item.value}</strong><small>${item.label}</small>`;
      treasure.appendChild(node);
    });
    const cityMeter = document.createElement("div");
    cityMeter.className = "summary-city-meter";
    cityMeter.dataset.cityRestored = String(restored);
    cityMeter.innerHTML = `<span aria-hidden="true"><i style="width:${Math.round((restored / 14) * 100)}%"></i></span><strong>Sterrenstad ${restored}/14</strong>`;
    treasure.appendChild(cityMeter);

    const actions = document.createElement("div");
    actions.className = "summary-replay-actions";
    actions.dataset.summaryActions = "replay";
    actions.append(
      this.button("Nog een missie", () => {
        this.game.requestFullscreenPlay();
        this.game.save.startNewSession();
        this.game.showScene("numberOfDay");
      }),
      this.button("Bouw verder", () => this.game.showScene("city"), "secondary")
    );

    const focus = this.game.adaptive.recommendFocus();
    const next = document.createElement("div");
    next.className = "next-focus summary-coach";
    next.innerHTML = `
      <p class="eyebrow">Dino Coach</p>
      <h2>${childFocusTitle(focus.skill)}</h2>
      <p>${childFocusAction(focus.skill)}</p>
      <span>Gebruik je sterren in Sterrenstad en probeer daarna deze focus opnieuw.</span>
    `;
    this.root.append(sceneHeader("Missie klaar"), missionRibbon("done"), adventureBridge("city", "summary", "Stad groeit"), actions, finale, treasure, parentDetails, next);
  }
}
