import { RepresentationFactory } from "../education/representations/RepresentationFactory";
import type { Challenge, ChallengeOption } from "../education/types";
import type { MicroGoal } from "../gameplay/session/microGoals";
import type { Game } from "../game/Game";
import type { InputAction } from "../game/InputManager";
import type { GameScene } from "../game/SceneManager";

export interface RewardBadge {
  label: string;
  value: string;
  tone?: "star" | "build" | "rescue" | "snap";
}

export type CelebrationTone = "star" | "build" | "rescue";
export type MissionStepId = 1 | 2 | 3 | 4 | "done";
export type AdventureIcon = "number" | "sprint" | "web" | "city" | "summary";
export type ActionPadMode = "lane" | "anchor" | "object";
export type MovementActionIcon = MicroGoal["kind"] | "swing" | "grab";
export type ActionFieldPhase = "approach" | "success" | "scaffold";

export interface ActionFieldState {
  progress?: number;
  phase?: ActionFieldPhase;
}

export abstract class BaseScene implements GameScene {
  protected readonly root = document.createElement("section");
  private cleanups: Array<() => void> = [];

  protected constructor(protected readonly game: Game, readonly name: string) {
    this.root.className = `scene ${name}`;
  }

  mount(_params?: unknown): void {
    this.game.overlay.appendChild(this.root);
  }

  unmount(): void {
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
    this.root.remove();
  }

  update(_dt: number): void {}

  protected onInput(handler: (action: InputAction) => void): void {
    this.cleanups.push(this.game.input.subscribe((action) => handler(action)));
  }

  protected addCleanup(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  protected button(label: string, onClick: () => void, className = "primary"): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = `btn ${className}`;
    button.type = "button";
    button.dataset.action = label;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  protected iconButton(label: string, icon: "menu" | "back" | "refresh", onClick: () => void, className = "ghost"): HTMLButtonElement {
    const button = this.button(label, onClick, `${className} icon-btn ${icon}`);
    button.setAttribute("aria-label", label);
    button.innerHTML = `<span class="control-icon ${icon}" aria-hidden="true"></span><span class="sr-only">${label}</span>`;
    return button;
  }

  protected stat(label: string, value: string | number): HTMLElement {
    const pill = document.createElement("div");
    pill.className = "stat-pill";
    pill.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    return pill;
  }
}

export function sceneHeader(title: string, subtitle?: string): HTMLElement {
  const header = document.createElement("header");
  header.className = "scene-header";
  header.innerHTML = `<h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}`;
  return header;
}

export function playToken(kind: string, label: string, value: string | number): HTMLElement {
  const token = document.createElement("div");
  token.className = "play-token";
  token.dataset.token = kind;
  token.setAttribute("aria-label", `${label}: ${value}`);
  token.innerHTML = `
    <span class="play-token-icon ${kind}" aria-hidden="true"></span>
    <strong>${value}</strong>
  `;
  return token;
}

export function microGoalChip(goal: MicroGoal, step: number, total: number): HTMLElement {
  const chip = document.createElement("div");
  chip.className = `micro-goal-chip ${goal.kind}`;
  chip.dataset.microGoal = goal.kind;
  chip.setAttribute("aria-label", `${goal.label}: stap ${step} van ${total}`);
  chip.innerHTML = `
    <i aria-hidden="true"></i>
    <strong>${goal.verb}</strong>
    <small>${step}/${total}</small>
  `;
  return chip;
}

export function missionRibbon(activeStep: MissionStepId): HTMLElement {
  const ribbon = document.createElement("div");
  ribbon.className = "mission-ribbon";
  ribbon.dataset.activeStep = String(activeStep);
  ribbon.setAttribute("aria-label", "Missie voortgang");
  [
    { id: 1, label: "Getal", icon: "number" },
    { id: 2, label: "Sprint", icon: "sprint" },
    { id: 3, label: "WebWoud", icon: "web" },
    { id: 4, label: "Stad", icon: "city" }
  ].forEach((step) => {
    const node = document.createElement("div");
    const state = activeStep === "done" ? "done" : step.id < activeStep ? "done" : step.id === activeStep ? "active" : "todo";
    node.className = "mission-ribbon-step";
    node.dataset.state = state;
    node.innerHTML = `
      <span class="mission-icon ${step.icon}" aria-hidden="true"></span>
      <b>${step.id}</b>
      <small>${step.label}</small>
    `;
    ribbon.appendChild(node);
  });
  return ribbon;
}

const adventureLabels: Record<AdventureIcon, string> = {
  number: "Getal",
  sprint: "Sprint",
  web: "WebWoud",
  city: "Stad",
  summary: "Klaar"
};

export function adventureBridge(from: AdventureIcon, to: AdventureIcon, label: string): HTMLElement {
  const bridge = document.createElement("div");
  bridge.className = "adventure-bridge";
  bridge.dataset.adventureBridge = `${from}-${to}`;
  bridge.setAttribute("aria-label", label);
  bridge.innerHTML = `
    <span class="adventure-node ${from}">
      <i class="mission-icon ${from}" aria-hidden="true"></i>
      <small>${adventureLabels[from]}</small>
    </span>
    <span class="adventure-arrow" aria-hidden="true"></span>
    <strong>${label}</strong>
    <span class="adventure-arrow" aria-hidden="true"></span>
    <span class="adventure-node ${to}">
      <i class="mission-icon ${to}" aria-hidden="true"></i>
      <small>${adventureLabels[to]}</small>
    </span>
  `;
  return bridge;
}

export function challengeCard(challenge: Challenge, promptHidden = false): HTMLElement {
  const card = document.createElement("article");
  card.className = "challenge-card";
  const promptSvg = promptHidden
    ? `<div class="memory-cover">Onthoud het beeld</div>`
    : RepresentationFactory.renderSvg(challenge.promptRepresentation, challenge.quantity, { label: challenge.prompt });
  card.innerHTML = `
    <div class="challenge-copy">
      <p class="eyebrow">${challenge.title}</p>
      <h2>${challenge.prompt}</h2>
      <p>${challenge.mechanic}</p>
    </div>
    <div class="prompt-art">${promptSvg}</div>
  `;
  return card;
}

export function optionGrid(
  challenge: Challenge,
  onPick: (option: ChallengeOption) => void,
  selectedIndex = -1,
  mode: "lanes" | "anchors" | "grid" = "grid",
  fieldState: ActionFieldState = {}
): HTMLElement {
  const grid = document.createElement("div");
  grid.className = `option-grid ${mode}`;
  grid.dataset.mode = mode;
  const fieldProgress = Math.max(0, Math.min(1, fieldState.progress ?? 0));
  const fieldProgressPercent = Math.round(fieldProgress * 100);
  const fieldPhase = fieldState.phase ?? "approach";
  if (mode === "lanes" || mode === "anchors") {
    grid.classList.add("game-field");
    grid.dataset.fieldMode = mode === "lanes" ? "runner-road" : "web-canopy";
    grid.dataset.fieldPhase = fieldPhase;
    grid.dataset.fieldProgress = String(fieldProgressPercent);
    grid.style.setProperty("--field-progress", `${fieldProgressPercent}%`);
    grid.setAttribute("aria-label", mode === "lanes" ? "BlokBlitz banen" : "WebWoud ankers");
    const meter = document.createElement("div");
    meter.className = `field-action-meter ${mode === "lanes" ? "runner" : "web"}`;
    meter.setAttribute("aria-hidden", "true");
    meter.innerHTML = "<span></span>";
    grid.appendChild(meter);
  }
  const laneNames = ["Links", "Midden", "Rechts"];
  const anchorNames = ["Links", "Midden", "Rechts"];
  challenge.options.forEach((option, index) => {
    const positionName = mode === "lanes" ? laneNames[index] ?? `Baan ${index + 1}` : mode === "anchors" ? anchorNames[index] ?? `Anker ${index + 1}` : `Keuze ${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-card ${mode === "lanes" || mode === "anchors" ? "world-hit-zone" : ""} ${index === selectedIndex ? "selected" : ""}`;
    button.setAttribute("aria-label", `${positionName}: ${option.label}`);
    button.dataset.challengeType = challenge.challengeType;
    button.dataset.correct = String(option.isCorrect);
    button.dataset.optionIndex = String(index);
    button.dataset.representation = option.representation;
    button.dataset.actionTarget = index === selectedIndex ? "selected" : "idle";
    if (mode === "lanes" || mode === "anchors") button.dataset.worldHitZone = "true";
    if (option.quantity !== undefined) button.dataset.quantity = String(option.quantity);
    if (index === selectedIndex && (mode === "lanes" || mode === "anchors")) {
      const baseY = mode === "lanes" ? 34 : 28;
      const travel = mode === "lanes" ? 112 : 82;
      button.style.setProperty("--hero-y", `${baseY + Math.round(fieldProgress * travel)}px`);
    }
    const beacon =
      index === selectedIndex && (mode === "lanes" || mode === "anchors")
        ? `<span class="choice-beacon ${mode === "lanes" ? "runner" : "web"}" aria-hidden="true"></span>`
        : "";
    const hero =
      index === selectedIndex && (mode === "lanes" || mode === "anchors")
        ? `<span class="hero-marker ${mode === "lanes" ? "runner" : "web"}" data-hero-marker="true" aria-hidden="true"><i></i></span>`
        : "";
    const playfieldLayer =
      mode === "lanes"
        ? `<span class="lane-road" aria-hidden="true"></span><span class="gate-arch" aria-hidden="true"></span>`
        : mode === "anchors"
          ? `<span class="vine-line" aria-hidden="true"></span><span class="anchor-ring" aria-hidden="true"></span>`
          : "";
    button.innerHTML = `
      ${playfieldLayer}
      <span class="option-index">${index + 1}</span>
      ${mode === "lanes" ? `<span class="lane-name">${laneNames[index] ?? `Baan ${index + 1}`}</span>` : ""}
      ${mode === "anchors" ? `<span class="anchor-name">${anchorNames[index] ?? `Anker ${index + 1}`}</span>` : ""}
      ${beacon}
      ${hero}
      <div class="option-art">${option.svg}</div>
      <strong>${option.label}</strong>
    `;
    button.addEventListener("click", () => onPick(option));
    grid.appendChild(button);
  });
  return grid;
}

const minigameWorldMap: Record<string, { field: string; object: string; label: string }> = {
  "flash-gates": { field: "gate-run", object: "gate", label: "Poort" },
  "dice-hunt": { field: "cave-hunt", object: "cave", label: "Grot" },
  "bead-bridge": { field: "bridge-build", object: "bridge", label: "Brug" },
  "make-ten-shield": { field: "shield-ring", object: "shield", label: "Schild" },
  "split-chests": { field: "chest-split", object: "chest", label: "Kist" },
  "web-anchors": { field: "anchor-swing", object: "anchor", label: "Anker" },
  "train-of-ten": { field: "train-yard", object: "wagon", label: "Wagon" },
  "enemy-wave-compare": { field: "wave-field", object: "wave", label: "Golf" },
  "build-the-number": { field: "build-yard", object: "build", label: "Bouwplek" },
  "one-more-one-less": { field: "jump-path", object: "platform", label: "Sprong" },
  "double-track": { field: "double-track", object: "track", label: "Spoor" },
  "rescue-the-herd": { field: "herd-rescue", object: "rescue", label: "Hok" }
};

export function minigameField(challenge: Challenge, onPick: (option: ChallengeOption) => void, selectedIndex = -1, fieldState: ActionFieldState = {}): HTMLElement {
  const theme = minigameWorldMap[challenge.challengeType] ?? { field: "practice-field", object: "object", label: "Keuze" };
  const fieldProgress = Math.max(0, Math.min(1, fieldState.progress ?? 0));
  const fieldProgressPercent = Math.round(fieldProgress * 100);
  const fieldPhase = fieldState.phase ?? "approach";
  const field = document.createElement("div");
  field.className = `minigame-field ${theme.field}`;
  field.dataset.minigameField = theme.field;
  field.dataset.selectedIndex = String(selectedIndex);
  field.dataset.fieldPhase = fieldPhase;
  field.dataset.fieldProgress = String(fieldProgressPercent);
  field.style.setProperty("--field-progress", `${fieldProgressPercent}%`);
  if (selectedIndex >= 0) field.style.setProperty("--mini-hero-left", `${25 + selectedIndex * 30}%`);
  field.setAttribute("aria-label", `${challenge.title} speelveld`);
  field.innerHTML = `
    <div class="mini-sky" aria-hidden="true"></div>
    <div class="mini-ground" aria-hidden="true"></div>
    <div class="mini-hero" aria-hidden="true"><i></i></div>
    <div class="mini-dash-meter" aria-hidden="true"><span></span></div>
  `;

  const objects = document.createElement("div");
  objects.className = "mini-objects";
  challenge.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mini-object ${theme.object} ${index === selectedIndex ? "selected" : ""}`;
    button.dataset.challengeType = challenge.challengeType;
    button.dataset.correct = String(option.isCorrect);
    button.dataset.optionIndex = String(index);
    button.dataset.representation = option.representation;
    button.dataset.actionTarget = index === selectedIndex ? "selected" : "idle";
    button.dataset.worldHitZone = "true";
    if (option.quantity !== undefined) button.dataset.quantity = String(option.quantity);
    button.setAttribute("aria-label", `${theme.label} ${index + 1}: ${option.label}`);
    button.innerHTML = `
      ${index === selectedIndex ? `<span class="mini-choice-beacon" aria-hidden="true"></span>` : ""}
      <span class="mini-object-shell" aria-hidden="true"></span>
      <span class="mini-object-name">${theme.label} ${index + 1}</span>
      <span class="mini-object-art">${option.svg}</span>
      <strong>${option.label}</strong>
    `;
    button.addEventListener("click", () => onPick(option));
    objects.appendChild(button);
  });
  field.appendChild(objects);
  return field;
}

export function cityBuildField(challenge: Challenge, onPick: (option: ChallengeOption) => void, districtName: string, selectedIndex = -1, fieldState: ActionFieldState = {}): HTMLElement {
  const fieldProgress = Math.max(0, Math.min(1, fieldState.progress ?? 0));
  const fieldProgressPercent = Math.round(fieldProgress * 100);
  const fieldPhase = fieldState.phase ?? "approach";
  const field = document.createElement("div");
  field.className = "city-build-field";
  field.dataset.cityBuildField = "restoration-yard";
  field.dataset.selectedIndex = String(selectedIndex);
  field.dataset.fieldPhase = fieldPhase;
  field.dataset.fieldProgress = String(fieldProgressPercent);
  field.style.setProperty("--field-progress", `${fieldProgressPercent}%`);
  field.setAttribute("aria-label", `${districtName} bouwplaats`);
  field.innerHTML = `
    <div class="city-build-sky" aria-hidden="true"></div>
    <div class="city-build-road" aria-hidden="true"></div>
    <div class="city-build-crane" aria-hidden="true"><i></i></div>
    <div class="city-build-dash-meter" aria-hidden="true"><span></span></div>
  `;

  const choices = document.createElement("div");
  choices.className = "build-choices";
  challenge.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `build-choice ${index === selectedIndex ? "selected" : ""}`;
    button.dataset.challengeType = challenge.challengeType;
    button.dataset.correct = String(option.isCorrect);
    button.dataset.optionIndex = String(index);
    button.dataset.representation = option.representation;
    button.dataset.actionTarget = index === selectedIndex ? "selected" : "idle";
    button.dataset.worldHitZone = "true";
    if (option.quantity !== undefined) button.dataset.quantity = String(option.quantity);
    button.setAttribute("aria-label", `Bouwplek ${index + 1}: ${option.label}`);
    button.innerHTML = `
      <span class="build-pad" aria-hidden="true"></span>
      <span class="build-choice-art">${option.svg}</span>
      <strong>${option.label}</strong>
    `;
    button.addEventListener("click", () => onPick(option));
    choices.appendChild(button);
  });
  field.appendChild(choices);
  return field;
}

export function progressBar(value: number, label: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "progress-wrap";
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  wrap.innerHTML = `<div class="progress-label"><span>${label}</span><strong>${pct}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  return wrap;
}

export function rewardStrip(items: RewardBadge[], message = "Goed gedaan met structuur."): HTMLElement {
  const strip = document.createElement("div");
  strip.className = "reward-strip";
  strip.setAttribute("aria-live", "polite");
  strip.innerHTML = `<strong>${message}</strong>`;
  const row = document.createElement("div");
  row.className = "reward-badges";
  items.forEach((item) => {
    const badge = document.createElement("span");
    badge.className = `reward-badge ${item.tone ?? "star"}`;
    badge.dataset.rewardIcon = item.tone ?? "star";
    badge.innerHTML = `<i aria-hidden="true"></i><b>${item.value}</b><small>${item.label}</small>`;
    row.appendChild(badge);
  });
  strip.appendChild(row);
  return strip;
}

export function celebrationBurst(tone: CelebrationTone = "star", label = "TOP"): HTMLElement {
  const burst = document.createElement("div");
  burst.className = `celebration-burst ${tone}`;
  burst.dataset.celebration = "true";
  burst.setAttribute("aria-hidden", "true");
  burst.innerHTML = `
    <strong>${label}</strong>
    <i></i><i></i><i></i><i></i><i></i><i></i>
  `;
  return burst;
}

export function actionPad(mode: ActionPadMode, onLeft: () => void, onConfirm: () => void, onRight: () => void): HTMLElement {
  const pad = document.createElement("div");
  pad.className = "action-pad";
  pad.dataset.mode = mode;
  [
    { action: "left", label: mode === "lane" ? "Baan links" : mode === "anchor" ? "Anker links" : "Keuze links", icon: "left", handler: onLeft },
    { action: "confirm", label: mode === "lane" ? "Kies baan" : mode === "anchor" ? "Kies anker" : "Kies voorwerp", icon: "ok", handler: onConfirm },
    { action: "right", label: mode === "lane" ? "Baan rechts" : mode === "anchor" ? "Anker rechts" : "Keuze rechts", icon: "right", handler: onRight }
  ].forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action-pad-button ${item.action}`;
    button.dataset.padAction = item.action;
    button.setAttribute("aria-label", item.label);
    button.innerHTML = `<span class="pad-icon ${item.icon}" aria-hidden="true"></span>`;
    button.addEventListener("click", item.handler);
    pad.appendChild(button);
  });
  return pad;
}

export function movementPad(
  mode: ActionPadMode,
  onLeft: () => void,
  onRight: () => void,
  action?: { label: string; icon: MovementActionIcon; handler: () => void }
): HTMLElement {
  const pad = document.createElement("div");
  pad.className = `action-pad movement-pad ${action ? "has-action" : ""}`;
  pad.dataset.mode = mode;
  pad.dataset.padType = "movement";
  const items = [
    { action: "left", label: mode === "lane" ? "Baan links" : mode === "anchor" ? "Anker links" : "Keuze links", icon: "left", handler: onLeft },
    ...(action ? [{ action: "act", label: action.label, icon: action.icon, handler: action.handler }] : []),
    { action: "right", label: mode === "lane" ? "Baan rechts" : mode === "anchor" ? "Anker rechts" : "Keuze rechts", icon: "right", handler: onRight }
  ];
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action-pad-button ${item.action}`;
    button.dataset.padAction = item.action;
    button.setAttribute("aria-label", item.label);
    button.innerHTML = `<span class="pad-icon ${item.icon}" aria-hidden="true"></span>`;
    button.addEventListener("click", item.handler);
    pad.appendChild(button);
  });
  return pad;
}

export function scaffoldStrip(challenge: Challenge, message = "Rustig, je mag opnieuw."): HTMLElement {
  const strip = document.createElement("div");
  strip.className = "scaffold-strip";
  strip.dataset.scaffold = "true";
  strip.setAttribute("aria-live", "polite");
  strip.innerHTML = `
    <strong>${message}</strong>
    <p>${challenge.hint}</p>
    <div class="scaffold-cues">
      <span><b>1</b><small>Kijk</small></span>
      <span><b>5</b><small>Eerst 5</small></span>
      <span><b>OK</b><small>Nog eens</small></span>
    </div>
  `;
  return strip;
}
