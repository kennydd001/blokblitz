import type { Game } from "../game/Game";
import { childFocusAction, childFocusTitle, childRepresentationName } from "../education/focusLabels";
import { BaseScene, sceneHeader } from "./SceneUtils";

export class ParentDashboardScene extends BaseScene {
  constructor(game: Game) {
    super(game, "parent-dashboard");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("summary");
    this.game.audio.stopMusic();
    this.render();
  }

  private render(): void {
    this.root.replaceChildren();
    const tracker = this.game.mastery;
    const data = this.game.data();
    const dashboard = document.createElement("div");
    dashboard.className = "dashboard-grid";
    const focus = this.game.adaptive.recommendFocus();
    const guide = document.createElement("section");
    guide.className = "dashboard-guide";
    guide.innerHTML = `
      <p class="eyebrow">Dino Coach</p>
      <h2>${childFocusTitle(focus.skill)}</h2>
      <p>${childFocusAction(focus.skill)}</p>
      <span>${childRepresentationName(focus.representation)} - ${focus.range} - ${this.game.adaptive.suggestedNextFocus()}</span>
    `;

    dashboard.append(
      this.panel("Mastery per skill", tracker.masteryBySkill().map((item) => this.bar(childFocusTitle(item.skill), item.accuracy, `${item.exposures}x ${item.mastery}`))),
      this.panel(
        "Mastery per representatie",
        tracker.masteryByRepresentation().map((item) => this.bar(childRepresentationName(item.representation), item.accuracy, `${item.exposures}x ${item.mastery}`))
      ),
      this.panel(
        "Zwakste hoeveelheden",
        tracker.weakestQuantities().map((item) => this.line(`${item.quantity}`, `${Math.round(item.accuracy * 100)}% uit ${item.exposures}`))
      ),
      this.panel(
        "Zwakste ranges",
        tracker.weakestRanges().map((item) => this.line(item.range, `${Math.round(item.accuracy * 100)}% uit ${item.exposures}`))
      ),
      this.panel("Misconcepties", tracker.misconceptionSummary().map((item) => this.line("Let op", item))),
      this.panel("Reactietijd trend", tracker.reactionTimeTrend().map((rt, index) => this.line(`#${index + 1}`, `${rt} ms`))),
      this.panel("Sessies", data.progress.sessions.slice(-6).map((session) => this.line(session.id.slice(0, 18), `${session.attempts} pogingen, ${session.starsEarned} sterren`))),
      this.panel(
        "Recente voortgang",
        tracker
          .recentProgress(6)
          .map((attempt) =>
            this.line(
              `${attempt.quantity} ${childRepresentationName(attempt.representation)}`,
              `${attempt.wasCorrect ? "goed" : "hulp"} - ${attempt.challengeType} - ${attempt.reactionTimeMs} ms`
            )
          )
      ),
      this.panel("Volgende focus", [this.line("Advies", childFocusAction(focus.skill)), this.line("Hint rate", `${Math.round(tracker.hintRate() * 100)}%`)])
    );

    const actions = document.createElement("div");
    actions.className = "scene-actions";
    actions.append(
      this.button("Export JSON", () => this.exportJson(), "secondary"),
      this.button("Reset voortgang", () => this.reset(), "danger"),
      this.button("Menu", () => this.game.showScene("mainMenu"), "ghost")
    );
    this.root.append(sceneHeader("Ouder dashboard", "Echte opgeslagen mastery data."), guide, dashboard, actions);
  }

  private panel(title: string, rows: HTMLElement[]): HTMLElement {
    const panel = document.createElement("section");
    panel.className = "dashboard-panel";
    panel.innerHTML = `<h2>${title}</h2>`;
    const body = document.createElement("div");
    body.className = "panel-list";
    if (rows.length === 0) body.appendChild(this.line("Nog geen data", "Speel een paar opdrachten."));
    else rows.forEach((row) => body.appendChild(row));
    panel.appendChild(body);
    return panel;
  }

  private bar(label: string, value: number, detail: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "dash-row";
    const pct = Math.round(value * 100);
    row.innerHTML = `<div><strong>${label}</strong><span>${detail}</span></div><div class="mini-track"><div style="width:${pct}%"></div></div><b>${pct}%</b>`;
    return row;
  }

  private line(label: string, detail: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "dash-line";
    row.innerHTML = `<strong>${label}</strong><span>${detail}</span>`;
    return row;
  }

  private exportJson(): void {
    const blob = new Blob([this.game.save.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blokblitz-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  private reset(): void {
    if (!window.confirm("Alle voortgang wissen?")) return;
    this.game.save.reset();
    this.game.mastery.setAttempts([]);
    this.render();
  }
}
