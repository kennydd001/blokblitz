// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildAttemptLog } from "../src/education/challengeLogger";
import { MINIGAME_TYPES } from "../src/education/types";
import { runnerMechanics } from "../src/gameplay/runner/runnerMechanics";
import { runnerMicroGoals } from "../src/gameplay/session/microGoals";
import { anchorDecisionPlan } from "../src/gameplay/webwoud/anchorDecisions";

vi.mock("three", () => {
  class MockObject3D {
    position = {
      x: 0,
      y: 0,
      z: 0,
      set: (x: number, y: number, z: number) => {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
      }
    };
    rotation = { y: 0 };
    scale = {
      x: 1,
      y: 1,
      z: 1,
      set: (x: number, y: number, z: number) => {
        this.scale.x = x;
        this.scale.y = y;
        this.scale.z = z;
      }
    };
    castShadow = false;
    receiveShadow = false;
  }

  class Scene extends MockObject3D {
    background: unknown;
    children: unknown[] = [];
    add(object: unknown) {
      this.children.push(object);
    }
    clear() {
      this.children = [];
    }
  }

  class PerspectiveCamera extends MockObject3D {
    aspect = 1;
    constructor(
      readonly fov: number,
      aspect: number,
      readonly near: number,
      readonly far: number
    ) {
      super();
      this.aspect = aspect;
    }
    lookAt() {}
    updateProjectionMatrix() {}
  }

  class WebGLRenderer {
    domElement = document.createElement("canvas");
    shadowMap = { enabled: false, type: undefined as unknown };
    outputColorSpace: unknown;
    toneMapping: unknown;
    toneMappingExposure = 1;
    constructor(_options: unknown) {}
    setPixelRatio() {}
    setSize() {}
    render() {}
  }

  class Mesh extends MockObject3D {
    constructor(
      readonly geometry: unknown,
      readonly material: unknown
    ) {
      super();
    }
  }

  class Line extends MockObject3D {
    constructor(
      readonly geometry: unknown,
      readonly material: unknown
    ) {
      super();
    }
  }

  class DirectionalLight extends MockObject3D {
    constructor(
      readonly color: unknown,
      readonly intensity?: number
    ) {
      super();
    }
  }

  class HemisphereLight extends DirectionalLight {}
  class Color {
    constructor(readonly value: unknown) {}
  }
  class BoxGeometry {
    constructor(...readonlyArgs: unknown[]) {
      this.args = readonlyArgs;
    }
    args: unknown[];
  }
  class CylinderGeometry extends BoxGeometry {}
  class IcosahedronGeometry extends BoxGeometry {}
  class OctahedronGeometry extends BoxGeometry {}
  class DodecahedronGeometry extends BoxGeometry {}
  class TetrahedronGeometry extends BoxGeometry {}
  class TorusGeometry extends BoxGeometry {}
  class ConeGeometry extends BoxGeometry {}
  class MeshStandardMaterial {
    constructor(readonly options: unknown) {}
  }
  class LineBasicMaterial extends MeshStandardMaterial {}
  class BufferGeometry {
    points: unknown[] = [];
    setFromPoints(points: unknown[]) {
      this.points = points;
      return this;
    }
  }
  class Vector3 {
    constructor(
      readonly x: number,
      readonly y: number,
      readonly z: number
    ) {}
  }

  return {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    Line,
    DirectionalLight,
    HemisphereLight,
    Color,
    BoxGeometry,
    CylinderGeometry,
    IcosahedronGeometry,
    OctahedronGeometry,
    DodecahedronGeometry,
    TetrahedronGeometry,
    TorusGeometry,
    ConeGeometry,
    MeshStandardMaterial,
    LineBasicMaterial,
    BufferGeometry,
    Vector3,
    PCFSoftShadowMap: "PCFSoftShadowMap",
    SRGBColorSpace: "SRGBColorSpace",
    ACESFilmicToneMapping: "ACESFilmicToneMapping"
  };
});

describe("game runtime flow", () => {
  beforeEach(() => {
    document.body.className = "";
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    vi.spyOn(performance, "now").mockReturnValue(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("navigates menu, minigame, attempt logging, dashboard, city, and settings in a DOM runtime", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    expect(root).toBeTruthy();
    const game = new Game(root!);

    game.showScene("mainMenu");
    expect(root!.textContent).toContain("Start avontuur");
    expect(root!.textContent).toContain("Dino Coach");
    expect(root!.querySelector(".mission-map")).toBeTruthy();
    expect(root!.querySelector<HTMLElement>(".mission-map")?.dataset.missionWorld).toBe("sterrenroute");
    expect(root!.querySelectorAll(".mission-node-world")).toHaveLength(4);
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".mission-step")).every((node) => node.dataset.routeMarker === "true")).toBe(true);
    expect(root!.querySelector<HTMLElement>(".kid-progress-strip")?.dataset.kidProgress).toBe("menu");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".kid-progress-token")).map((node) => node.dataset.progressToken)).toEqual(["star", "block", "rescue", "city"]);
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".mission-step")).map((node) => node.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "1 Getal",
      "2 Sprint",
      "3 WebWoud",
      "4 Stad"
    ]);
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".menu-tools .btn")).map((node) => node.textContent?.trim())).toEqual(["Oefenen", "Ouders", "Instellingen"]);
    expect(root!.querySelector('[data-action="BlokBlitz Sprint"]')).toBeFalsy();
    expect(root!.querySelector(".stats-card")).toBeFalsy();
    root!.querySelector<HTMLButtonElement>('.mission-step[data-mission-step="2"]')!.click();
    expect(root!.textContent).toContain("Getalpoort");
    game.showScene("mainMenu");
    expect(root!.querySelector<HTMLElement>(".coach-card")?.dataset.focusSkill).toBeTruthy();
    expect(root!.querySelector("canvas")).toBeTruthy();

    game.showScene("numberOfDay");
    expect(root!.textContent).toContain("Getalpoort");
    expect(root!.textContent).toContain("Maak de poort wakker");
    expect(root!.querySelector<HTMLElement>(".number-day-panel")?.dataset.numberWorld).toBe("portal");
    expect(root!.querySelector<HTMLElement>(".number-portal")?.dataset.numberPortal).toBe("true");
    expect(root!.querySelectorAll(".number-rune")).toHaveLength(4);
    expect(root!.querySelector<HTMLElement>(".adventure-bridge")?.dataset.adventureBridge).toBe("number-sprint");
    expect(root!.querySelector(".adventure-bridge")?.textContent).toContain("Wek eerst");
    expect(root!.querySelector<HTMLButtonElement>('button[data-action="Naar Sprint"]')).toBeFalsy();
    expect(root!.querySelector<HTMLElement>(".mission-ribbon")?.dataset.activeStep).toBe("1");

    game.showScene("minigame", "flash-gates");
    expect(root!.textContent).toContain("Oefenwereld");
    expect(root!.textContent).toContain("Flitspoorten");
    expect(root!.querySelector<HTMLElement>(".play-hud")?.dataset.gameplayHud).toBe("minigame");
    expect(root!.querySelector(".play-field-layer.mini")).toBeTruthy();
    expect(root!.querySelector(".challenge-card, .mini-coach")).toBeFalsy();
    expect((game.world as unknown as { children: unknown[] }).children.length).toBeGreaterThan(30);
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.minigameField).toBe("gate-run");
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex).toBe("1");
    expect(root!.querySelectorAll(".mini-object.gate")).toHaveLength(3);
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".mini-object")).every((node) => node.dataset.worldHitZone === "true")).toBe(true);
    expect(root!.querySelector<HTMLButtonElement>(".mini-object.selected")?.dataset.actionTarget).toBe("selected");
    expect(root!.querySelector(".action-pad")?.getAttribute("data-mode")).toBe("object");
    expect(root!.querySelector(".action-pad")?.getAttribute("data-pad-type")).toBe("movement");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".action-pad-button")).map((node) => node.dataset.padAction)).toEqual(["left", "act", "right"]);
    expect(root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="act"]')?.getAttribute("aria-label")).toBe("Pak voorwerp");
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.fieldProgress).toBe("0");
    expect(root!.querySelector(".mini-dash-meter")).toBeTruthy();
    root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="left"]')!.click();
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex).toBe("0");
    root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="right"]')!.click();
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex).toBe("1");

    const challenge = game.challenges.createMinigame("flash-gates", { quantity: 4, scene: "minigame" });
    const correct = challenge.options.find((option) => option.isCorrect);
    expect(correct).toBeTruthy();
    vi.mocked(performance.now).mockReturnValue(1320);
    expect(game.recordAttempt(challenge, correct!, 1000, false)).toBe(true);
    expect(game.mastery.getAttempts()).toHaveLength(1);
    expect(game.data().progress.attempts).toHaveLength(1);

    game.showScene("parentDashboard");
    expect(root!.textContent).toContain("Ouder dashboard");
    expect(root!.querySelector(".dashboard-guide")).toBeTruthy();
    expect(root!.textContent).toContain("Dino Coach");
    expect(root!.textContent).toContain("Recente voortgang");
    expect(root!.textContent).toContain("flash-gates");

    game.showScene("city");
    expect(root!.textContent).toContain("Sterrenstad Bouwers");
    expect(root!.querySelector(".city-coach")).toBeTruthy();
    expect(root!.querySelector<HTMLElement>(".mission-ribbon")?.dataset.activeStep).toBe("4");
    expect(root!.textContent).toContain("Block Stack Yard");
    expect(root!.querySelector<HTMLElement>(".district-grid.city-map-world")?.dataset.cityMap).toBe("sterrenstad");
    expect(root!.querySelectorAll(".city-plot-shell").length).toBeGreaterThanOrEqual(14);

    game.showScene("settings");
    expect(root!.textContent).toContain("Instellingen");
    const speedInput = root!.querySelector<HTMLInputElement>("#speed");
    const mutedInput = root!.querySelector<HTMLInputElement>("#muted");
    const hapticsInput = root!.querySelector<HTMLInputElement>("#haptics");
    const contrastInput = root!.querySelector<HTMLInputElement>("#contrast");
    expect(speedInput).toBeTruthy();
    expect(mutedInput).toBeTruthy();
    expect(hapticsInput).toBeTruthy();
    expect(contrastInput).toBeTruthy();
    speedInput!.value = "1.2";
    speedInput!.dispatchEvent(new Event("input", { bubbles: true }));
    mutedInput!.checked = true;
    mutedInput!.dispatchEvent(new Event("change", { bubbles: true }));
    hapticsInput!.checked = false;
    hapticsInput!.dispatchEvent(new Event("change", { bubbles: true }));
    contrastInput!.checked = true;
    contrastInput!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(game.data().settings.speed).toBe(1.2);
    expect(game.data().settings.muted).toBe(true);
    expect(game.data().settings.haptics).toBe(false);
    expect(game.data().settings.highContrast).toBe(true);
    expect(document.body.classList.contains("high-contrast")).toBe(true);
  });

  it("starts the normal session flow from the menu and supports keyboard, swipe lane, and pause controls", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    game.input.attach();
    const fullscreenSpy = vi.fn(() => Promise.resolve());
    Object.defineProperty(root!, "requestFullscreen", {
      value: fullscreenSpy,
      configurable: true
    });

    game.showScene("mainMenu");
    root!.querySelector<HTMLButtonElement>('button[data-action="Start avontuur"]')!.click();
    expect(fullscreenSpy).toHaveBeenCalledTimes(1);
    expect(root!.textContent).toContain("Getalpoort");
    expect(root!.querySelectorAll(".number-rune")).toHaveLength(4);
    const nameButton = root!.querySelector<HTMLButtonElement>('button[data-action^="Wek"]');
    expect(nameButton).toBeTruthy();
    nameButton!.click();
    expect(game.data().progress.attempts.at(-1)?.challengeType).toBe("number-name");
    expect(game.mastery.getAttempts().at(-1)?.challengeType).toBe("number-name");
    expect(root!.querySelector<HTMLButtonElement>('button[data-action="Poort wakker"]')).toBeFalsy();
    expect(root!.querySelector(".number-portal.awake")).toBeTruthy();
    expect(root!.querySelector(".reward-strip")?.textContent).toContain("Getalnaam wakker");
    expect(root!.querySelector(".adventure-bridge")?.textContent).toContain("Poort open");
    expect(root!.querySelector<HTMLButtonElement>('button[data-action="Naar Sprint"]')).toBeTruthy();

    root!.querySelector<HTMLButtonElement>('button[data-action="Naar Sprint"]')!.click();
    expect(root!.textContent).toContain("BlokBlitz Sprint");
    expect((game.world as unknown as { children: unknown[] }).children.length).toBeGreaterThan(34);
    expect(root!.querySelector<HTMLElement>(".play-hud")?.dataset.gameplayHud).toBe("runner");
    expect(root!.querySelector<HTMLElement>(".adventure-toast")?.dataset.adventureToast).toBe("number-sprint");
    expect(root!.querySelector<HTMLElement>(".play-target")?.dataset.targetVisible).toBe("true");
    expect(root!.querySelector(".play-target .quantity-svg")).toBeTruthy();
    expect(root!.querySelector(".play-memory")).toBeFalsy();
    expect(root!.querySelector(".play-field-layer.runner")).toBeTruthy();
    expect(root!.querySelector(".challenge-card")).toBeFalsy();
    expect(root!.querySelector(".runner-coach")).toBeFalsy();
    expect(root!.querySelector(".mission-ribbon")).toBeFalsy();
    expect(root!.querySelector<HTMLElement>(".runner-hud.play-tokens")?.dataset.hudStyle).toBe("tokens");
    expect(root!.querySelector<HTMLElement>(".runner-hud .micro-goal-chip")?.dataset.microGoal).toBeTruthy();
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".runner-hud .play-token")).map((node) => node.dataset.token)).toEqual(["speed", "distance", "streak"]);
    expect(root!.querySelector(".runner-hud .stat-pill")).toBeFalsy();
    expect(root!.querySelector(".option-grid.lanes")?.getAttribute("data-mode")).toBe("lanes");
    const runnerField = root!.querySelector<HTMLElement>(".option-grid.lanes.game-field");
    expect(runnerField?.getAttribute("data-field-mode")).toBe("runner-road");
    expect(runnerField?.getAttribute("data-field-phase")).toBe("approach");
    expect(runnerField?.getAttribute("data-field-progress")).toBe("0");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".option-grid.lanes .option-card")).every((node) => node.dataset.worldHitZone === "true")).toBe(true);
    expect(root!.querySelectorAll(".lane-road")).toHaveLength(3);
    expect(root!.querySelectorAll(".gate-arch")).toHaveLength(3);
    expect(root!.querySelector(".field-action-meter.runner")).toBeTruthy();
    expect(Array.from(root!.querySelectorAll(".lane-name")).map((node) => node.textContent)).toEqual(["Links", "Midden", "Rechts"]);
    expect(root!.querySelector(".action-pad")?.getAttribute("data-mode")).toBe("lane");
    expect(root!.querySelector(".action-pad")?.getAttribute("data-pad-type")).toBe("movement");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".action-pad-button")).map((node) => node.dataset.padAction)).toEqual(["left", "act", "right"]);
    expect(root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="act"]')?.getAttribute("aria-label")).toBe(runnerMicroGoals["flash-gate"].label);
    expect(root!.querySelector(".action-pad-button.act .pad-icon.gate")).toBeTruthy();
    expect(root!.querySelector<HTMLButtonElement>('button[data-action="Menu"]')?.classList.contains("icon-btn")).toBe(true);
    expect(root!.querySelector('button[data-action="Menu"] .control-icon.menu')).toBeTruthy();
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.optionIndex).toBe("1");
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.actionTarget).toBe("selected");
    expect(root!.querySelector(".option-card.selected .choice-beacon.runner")).toBeTruthy();
    expect(root!.querySelector(".option-card.selected .hero-marker.runner")).toBeTruthy();
    game.scenes.update(0.5);
    expect(Number(root!.querySelector<HTMLElement>(".option-grid.lanes.game-field")?.dataset.fieldProgress)).toBeGreaterThan(0);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.optionIndex).toBe("0");
    expect(root!.querySelector(".option-card.selected .choice-beacon.runner")).toBeTruthy();
    expect(root!.querySelector(".option-card.selected .hero-marker.runner")).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.optionIndex).toBe("1");

    root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="left"]')!.click();
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.optionIndex).toBe("0");

    root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="right"]')!.click();
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.optionIndex).toBe("1");

    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 260, clientY: 520 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 120, clientY: 520 }));
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.optionIndex).toBe("0");

    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 120, clientY: 520 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 260, clientY: 520 }));
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.optionIndex).toBe("1");

    root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="act"]')!.click();
    expect(root!.querySelector(".reward-strip, .scaffold-strip")).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(root!.textContent).toContain("Start avontuur");
    game.input.detach();
  });

  it("treats denied fullscreen requests as a safe optional mobile enhancement", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const fullscreenSpy = vi.fn(() => Promise.reject(new Error("denied")));
    Object.defineProperty(root!, "requestFullscreen", {
      value: fullscreenSpy,
      configurable: true
    });

    expect(() => game.requestFullscreenPlay()).not.toThrow();
    await Promise.resolve();
    expect(fullscreenSpy).toHaveBeenCalledTimes(1);
  });

  it("maps touch-like swipes to shared gameplay actions and ignores taps", async () => {
    const { InputManager } = await import("../src/game/InputManager");
    const input = new InputManager();
    const actions: string[] = [];
    input.subscribe((action) => actions.push(action));
    input.attach();

    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 200, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 208, clientY: 304 }));
    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 260, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 110, clientY: 304 }));
    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 110, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 260, clientY: 304 }));
    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 190, clientY: 360 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 190, clientY: 240 }));

    const touch = (type: "touchstart" | "touchend", x: number, y: number): Event => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "changedTouches", {
        value: [{ clientX: x, clientY: y }],
        configurable: true
      });
      return event;
    };
    await new Promise((resolve) => window.setTimeout(resolve, 140));
    window.dispatchEvent(touch("touchstart", 260, 420));
    window.dispatchEvent(touch("touchend", 110, 420));
    await new Promise((resolve) => window.setTimeout(resolve, 140));
    window.dispatchEvent(touch("touchstart", 110, 420));
    window.dispatchEvent(touch("touchend", 260, 420));

    expect(actions).toEqual(["left", "right", "up", "left", "right"]);
    input.detach();
  });

  it("auto-resolves selected action paths when the hero reaches a gate or anchor", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const fullscreenSpy = vi.fn(() => Promise.resolve());
    Object.defineProperty(root!, "requestFullscreen", {
      value: fullscreenSpy,
      configurable: true
    });

    game.showScene("runner");
    const runnerAttempts = game.data().progress.attempts.length;
    game.scenes.update(3);
    expect(game.data().progress.attempts).toHaveLength(runnerAttempts + 1);
    expect(root!.querySelector(".reward-strip, .scaffold-strip")).toBeTruthy();
    expect(root!.querySelector<HTMLElement>(".option-grid.lanes.game-field")?.dataset.fieldPhase).toMatch(/success|scaffold/);

    game.showScene("webwoud");
    const webAttempts = game.data().progress.attempts.length;
    game.scenes.update(3);
    expect(game.data().progress.attempts).toHaveLength(webAttempts + 1);
    expect(root!.querySelector(".reward-strip, .scaffold-strip")).toBeTruthy();
    expect(root!.querySelector<HTMLElement>(".option-grid.anchors.game-field")?.dataset.fieldPhase).toMatch(/success|scaffold/);
    vi.clearAllTimers();
  });

  it("uses mastery data to adapt live auto-run pressure", async () => {
    const { Game } = await import("../src/game/Game");
    const seedSubitize = (game: InstanceType<typeof Game>, wasCorrect: boolean, count: number, reactionTimeMs: number): void => {
      for (let index = 0; index < count; index += 1) {
        const challenge = game.challenges.createMinigame("flash-gates", { quantity: 4, representation: "eggs", scene: "runner" });
        const option = challenge.options.find((item) => item.isCorrect === wasCorrect) ?? challenge.options[0];
        game.mastery.logAttempt(
          buildAttemptLog({
            challenge,
            option,
            sessionId: wasCorrect ? "fluent-live-pressure" : "weak-live-pressure",
            reactionTimeMs,
            hintUsed: !wasCorrect
          })
        );
      }
    };

    const root = document.querySelector<HTMLElement>("#app")!;
    const weakGame = new Game(root);
    weakGame.save.updateProgress((progress) => {
      progress.numberOfDay = 3;
    });
    seedSubitize(weakGame, false, 4, 1800);
    weakGame.showScene("runner");
    const weakWindow = Number(root.querySelector<HTMLElement>(".play-hud")?.dataset.adaptiveWindow);
    weakGame.scenes.update(1);
    const weakProgress = Number(root.querySelector<HTMLElement>(".option-grid.lanes.game-field")?.dataset.fieldProgress);

    document.body.innerHTML = '<div id="app"></div>';
    const fluentRoot = document.querySelector<HTMLElement>("#app")!;
    const fluentGame = new Game(fluentRoot);
    fluentGame.save.updateProgress((progress) => {
      progress.numberOfDay = 3;
    });
    seedSubitize(fluentGame, true, 8, 420);
    fluentGame.showScene("runner");
    const fluentWindow = Number(fluentRoot.querySelector<HTMLElement>(".play-hud")?.dataset.adaptiveWindow);
    fluentGame.scenes.update(1);
    const fluentProgress = Number(fluentRoot.querySelector<HTMLElement>(".option-grid.lanes.game-field")?.dataset.fieldProgress);

    expect(weakWindow).toBeGreaterThan(fluentWindow);
    expect(weakProgress).toBeLessThan(fluentProgress);
  });

  it("keeps live Sprint and WebWoud play world-first with 3D outcome feedback", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const world = game.world as unknown as { children: unknown[] };

    game.showScene("runner");
    const runnerApproachObjects = world.children.length;
    expect(root!.querySelector(".play-hud")).toBeTruthy();
    expect(root!.querySelector(".play-field-layer.runner")).toBeTruthy();
    expect(root!.querySelector(".challenge-card, .runner-coach, .mission-ribbon")).toBeFalsy();
    root!.querySelector<HTMLButtonElement>('button[data-correct="false"]')!.click();
    expect(root!.querySelector(".play-outcome .scaffold-strip")).toBeTruthy();
    expect(world.children.length).toBeGreaterThan(runnerApproachObjects);

    game.showScene("webwoud");
    const webApproachObjects = world.children.length;
    expect(root!.querySelector(".play-hud")).toBeTruthy();
    expect(root!.querySelector(".play-field-layer.web")).toBeTruthy();
    expect(root!.querySelector(".challenge-card, .web-coach, .mission-ribbon")).toBeFalsy();
    root!.querySelector<HTMLButtonElement>('button[data-correct="true"]')!.click();
    expect(root!.querySelector(".play-outcome .reward-strip")).toBeTruthy();
    expect(root!.querySelectorAll(".play-outcome .reward-badge[data-reward-icon]").length).toBeGreaterThanOrEqual(2);
    expect(world.children.length).toBeGreaterThan(webApproachObjects);

    game.showScene("minigame", "flash-gates");
    const miniApproachObjects = world.children.length;
    expect(root!.querySelector<HTMLElement>(".play-hud")?.dataset.gameplayHud).toBe("minigame");
    expect(root!.querySelector(".play-field-layer.mini")).toBeTruthy();
    expect(root!.querySelector(".challenge-card, .mini-coach")).toBeFalsy();
    const miniCorrect = root!.querySelector<HTMLButtonElement>('button.mini-object[data-correct="true"]');
    expect(miniCorrect).toBeTruthy();
    const miniCorrectIndex = miniCorrect!.dataset.optionIndex;
    miniCorrect!.click();
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex).toBe(miniCorrectIndex);
    expect(root!.querySelector(".play-outcome .reward-strip")).toBeTruthy();
    expect(root!.querySelectorAll(".play-outcome .reward-badge[data-reward-icon]").length).toBeGreaterThanOrEqual(2);
    expect(world.children.length).toBeGreaterThan(miniApproachObjects);
    vi.clearAllTimers();
  });

  it("renders runner mechanics as distinct 3D game objects instead of generic lane gates", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const world = game.world as unknown as { children: Array<{ geometry?: { constructor?: { name?: string } } }> };
    const geometryNames = () =>
      world.children
        .map((child) => child.geometry?.constructor?.name)
        .filter((name): name is string => Boolean(name));

    game.resetWorld("runner");
    const makeTen = game.challenges.createRunnerChallenge("make-ten-shield", { quantity: 7 });
    game.renderRunnerChoices3d(makeTen, 1, 0.2, "approach");
    expect(geometryNames().filter((name) => name === "DodecahedronGeometry").length).toBeGreaterThanOrEqual(3);

    const enemyWave = game.challenges.createRunnerChallenge("enemy-wave", { quantity: 6 });
    game.renderRunnerChoices3d(enemyWave, 1, 0.2, "approach");
    expect(geometryNames().filter((name) => name === "IcosahedronGeometry").length).toBeGreaterThanOrEqual(15);

    const shortcut = game.challenges.createRunnerChallenge("shortcut-route", { quantity: 5 });
    game.renderRunnerChoices3d(shortcut, 1, 0.2, "approach");
    expect(geometryNames().filter((name) => name === "TetrahedronGeometry").length).toBeGreaterThanOrEqual(6);
  });

  it("renders selected live paths with number-structured 3D pickup trails", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const world = game.world as unknown as { children: Array<{ geometry?: { constructor?: { name?: string } } }> };
    const pickupCount = () => world.children.filter((child) => child.geometry?.constructor?.name === "OctahedronGeometry").length;
    const selectedQuantity = (challenge: { options: Array<{ quantity?: number; value: number | string | Array<number | string> }> }, index: number) =>
      Math.max(1, Math.min(10, Math.round(challenge.options[index].quantity ?? (Number(challenge.options[index].value) || 1))));

    game.resetWorld("runner");
    const runner = game.challenges.createRunnerChallenge("bead-bridge", { quantity: 7 });
    game.renderRunnerChoices3d(runner, 1, 0.35, "approach");
    expect(pickupCount()).toBe(selectedQuantity(runner, 1));

    const mini = game.challenges.createMinigame("rescue-the-herd", { quantity: 4, scene: "minigame" });
    game.renderMinigameChoices3d(mini, 0, 0.5, "approach");
    expect(pickupCount()).toBe(selectedQuantity(mini, 0));

    const city = game.challenges.createCityChallenge("block-yard", { quantity: 6, representation: "blocks" });
    game.renderCityBuildChoices3d(city, 2, 0.5, "approach");
    expect(pickupCount()).toBe(selectedQuantity(city, 2));
  });

  it("adds motion state to the hero and chains collected pickups along the selected path", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const world = game.world as unknown as {
      children: Array<{
        userData?: { blokblitzRole?: string; heroProgress?: number; pickupCollected?: boolean; pickupGroup?: string };
        position?: { y: number };
        rotation?: { x?: number };
        scale?: { z?: number };
      }>;
    };
    const selectedQuantity = (challenge: { options: Array<{ quantity?: number; value: number | string | Array<number | string> }> }, index: number) =>
      Math.max(1, Math.min(10, Math.round(challenge.options[index].quantity ?? (Number(challenge.options[index].value) || 1))));
    const byRole = (role: string) => world.children.filter((child) => child.userData?.blokblitzRole === role);

    game.resetWorld("runner");
    const runner = game.challenges.createRunnerChallenge("bead-bridge", { quantity: 7 });
    const selectedIndex = Math.max(0, runner.options.findIndex((option) => (option.quantity ?? Number(option.value)) >= 6));
    game.renderRunnerChoices3d(runner, selectedIndex, 0.15, "approach");
    const earlyBody = byRole("hero-body")[0];
    game.renderRunnerChoices3d(runner, selectedIndex, 0.68, "approach");
    const lateBody = byRole("hero-body")[0];
    const pickups = byRole("number-pickup");

    expect(lateBody.userData?.heroProgress).toBeCloseTo(0.68);
    expect(lateBody.position?.y).not.toBe(earlyBody.position?.y);
    expect(Math.abs(lateBody.rotation?.x ?? 0)).toBeGreaterThan(0);
    expect(byRole("hero-speed-streak").some((part) => (part.scale?.z ?? 1) > 1)).toBe(true);
    expect(byRole("pickup-chain")).toHaveLength(Math.max(0, selectedQuantity(runner, selectedIndex) - 1));
    expect(pickups.some((pickup) => pickup.userData?.pickupCollected)).toBe(true);
    expect(pickups.some((pickup) => pickup.userData?.pickupGroup === "extras")).toBe(true);
  });

  it("renders live play with a multi-part low-poly dino hero", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const world = game.world as unknown as { children: Array<{ userData?: { blokblitzRole?: string; heroMode?: string } }> };
    const heroRoles = () => new Set(world.children.map((child) => child.userData?.blokblitzRole).filter(Boolean));
    const heroParts = () => world.children.filter((child) => child.userData?.blokblitzRole?.startsWith("hero-"));

    game.resetWorld("runner");
    const runner = game.challenges.createRunnerChallenge("flash-gate", { quantity: 5 });
    game.renderRunnerChoices3d(runner, 1, 0.35, "approach");
    expect(heroParts().length).toBeGreaterThanOrEqual(10);
    const roles = heroRoles();
    ["hero-body", "hero-head", "hero-snout", "hero-eye", "hero-tail", "hero-leg", "hero-spike"].forEach((role) => expect(roles.has(role)).toBe(true));

    const web = game.challenges.createMinigame("web-anchors", { quantity: 6, scene: "webwoud" });
    game.renderWebChoices3d(web.options, 1, 0.35, "approach");
    expect(heroParts().some((part) => part.userData?.blokblitzRole === "hero-web-cape" && part.userData.heroMode === "webwoud")).toBe(true);
  });

  it("renders explicit 3D rescue and build win moments after correct actions", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const world = game.world as unknown as { children: Array<{ userData?: { blokblitzRole?: string; heroMode?: string } }> };
    const roles = () => new Set(world.children.map((child) => child.userData?.blokblitzRole).filter(Boolean));
    const roleCount = (role: string) => world.children.filter((child) => child.userData?.blokblitzRole === role).length;

    game.resetWorld("webwoud");
    const web = game.challenges.createMinigame("web-anchors", { quantity: 6, scene: "webwoud" });
    game.renderWebChoices3d(web.options, 1, 1, "success");
    expect(roles().has("webwoud-freed-friend")).toBe(true);
    expect(roleCount("webwoud-open-cage")).toBeGreaterThanOrEqual(2);
    expect(roleCount("webwoud-rescue-star")).toBeGreaterThanOrEqual(6);

    game.resetWorld("city");
    const city = game.challenges.createCityChallenge("block-yard", { quantity: 7, representation: "blocks" });
    game.renderCityBuildChoices3d(city, 1, 1, "success");
    expect(roles().has("city-built-roof")).toBe(true);
    expect(roleCount("city-built-block")).toBeGreaterThanOrEqual(6);
    expect(roleCount("city-build-star")).toBeGreaterThanOrEqual(6);
    expect(world.children.some((child) => child.userData?.blokblitzRole === "hero-body" && child.userData.heroMode === "city")).toBe(true);
  });

  it("renders child-friendly 3D landmarks for each live world", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const world = game.world as unknown as { children: Array<{ userData?: { blokblitzWorldRole?: string; worldTheme?: string } }> };
    const roles = () => new Set(world.children.map((child) => child.userData?.blokblitzWorldRole).filter(Boolean));
    const roleCount = (role: string) => world.children.filter((child) => child.userData?.blokblitzWorldRole === role).length;

    game.resetWorld("runner");
    expect(roles().has("runner-star-arch")).toBe(true);
    expect(roles().has("runner-dino-flag")).toBe(true);

    game.resetWorld("webwoud");
    expect(roles().has("webwoud-rescue-friend")).toBe(true);
    expect(roles().has("webwoud-rescue-cage")).toBe(true);
    expect(roles().has("webwoud-canopy-star")).toBe(true);

    game.resetWorld("minigame");
    expect(roles().has("minigame-practice-tower")).toBe(true);
    expect(roles().has("minigame-number-portal")).toBe(true);

    game.resetWorld("city");
    expect(roleCount("city-ten-tower")).toBe(10);
    expect(roles().has("city-star-beacon")).toBe(true);
  });

  it("supports Oefenwereld object dash selection with movement controls", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);

    game.showScene("minigame", "flash-gates");
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex).toBe("1");
    expect(root!.querySelector(".action-pad")?.getAttribute("data-pad-type")).toBe("movement");
    expect(root!.querySelector<HTMLButtonElement>('button[data-action="Nieuw"]')?.classList.contains("icon-btn")).toBe(true);
    expect(root!.querySelector('button[data-action="Nieuw"] .control-icon.refresh')).toBeTruthy();
    expect(root!.querySelector<HTMLButtonElement>('button[data-action="Menu"]')?.classList.contains("icon-btn")).toBe(true);
    expect(root!.querySelector('button[data-action="Menu"] .control-icon.menu')).toBeTruthy();
    root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="left"]')!.click();
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex).toBe("0");
    expect(root!.querySelector<HTMLButtonElement>(".mini-object.selected")?.dataset.optionIndex).toBe("0");
    root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="right"]')!.click();
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex).toBe("1");

    const correct = root!.querySelector<HTMLButtonElement>('button.mini-object[data-correct="true"]');
    expect(correct).toBeTruthy();
    const correctIndex = Number(correct!.dataset.optionIndex);
    const selectedIndex = Number(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.selectedIndex ?? 1);
    if (correctIndex < selectedIndex) root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="left"]')!.click();
    if (correctIndex > selectedIndex) root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="right"]')!.click();

    const attemptsBefore = game.data().progress.attempts.length;
    game.scenes.update(2.1);
    expect(game.data().progress.attempts).toHaveLength(attemptsBefore + 1);
    expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.fieldProgress).toBe("100");
    expect(root!.querySelector(".reward-strip")).toBeTruthy();
  });

  it("launches every minigame scene template and records a real DOM-picked attempt", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);

    for (const [index, type] of MINIGAME_TYPES.entries()) {
      vi.mocked(performance.now).mockReturnValue(1000 + index * 100);
      game.showScene("minigame", type);
      expect(root!.textContent).toContain("Oefenwereld");
      expect(root!.querySelector<HTMLElement>(".minigame-field")?.dataset.minigameField).toBeTruthy();
      expect(root!.querySelectorAll(".mini-object").length).toBeGreaterThanOrEqual(2);
      expect(root!.querySelector(".action-pad")?.getAttribute("data-mode")).toBe("object");
      expect(root!.querySelector(".action-pad")?.getAttribute("data-pad-type")).toBe("movement");
      const correct = root!.querySelector<HTMLButtonElement>('button[data-correct="true"]');
      expect(correct, `${type} should render a correct option`).toBeTruthy();
      correct!.click();
      expect(root!.querySelector(".reward-strip")?.textContent).toContain("Opdracht klaar");
      expect(root!.querySelector<HTMLElement>(".celebration-burst")?.dataset.celebration).toBe("true");
    }

    expect(game.mastery.getAttempts()).toHaveLength(MINIGAME_TYPES.length);
    expect(game.data().progress.attempts.map((attempt) => attempt.scene)).toEqual(Array(MINIGAME_TYPES.length).fill("minigame"));
  });

  it("opens Sterrenstad build mode from one child-first build action", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);

    game.showScene("city");
    const quickBuild = root!.querySelector<HTMLElement>(".city-quick-build");
    expect(quickBuild?.dataset.nextDistrict).toBe("dot-plaza");
    expect(quickBuild?.textContent).toContain("Bouw nu");
    const recommendedCards = root!.querySelectorAll<HTMLButtonElement>(".district-card.recommended");
    expect(recommendedCards).toHaveLength(1);
    expect(recommendedCards[0].dataset.recommended).toBe("true");
    expect(recommendedCards[0].textContent).toContain("Dot Card Plaza");

    root!.querySelector<HTMLButtonElement>('.city-quick-build button[data-action="Bouw nu"]')!.click();
    expect(root!.querySelector<HTMLElement>(".city-build-live")?.dataset.cityBuildLive).toBe("true");
    expect(root!.querySelector<HTMLElement>(".play-hud")?.dataset.gameplayHud).toBe("city");
    expect(root!.querySelector<HTMLButtonElement>(".district-card.selected")?.textContent).toContain("Dot Card Plaza");
  });

  it("plays through runner and WebWoud DOM choices into city restoration", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const fullscreenSpy = vi.fn(() => Promise.resolve());
    Object.defineProperty(root!, "requestFullscreen", {
      value: fullscreenSpy,
      configurable: true
    });

    game.showScene("runner");
    for (let index = 0; index < runnerMechanics.length; index += 1) {
      const mechanic = runnerMechanics[index];
      const goal = runnerMicroGoals[mechanic];
      expect(root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="act"]')?.getAttribute("aria-label")).toBe(goal.label);
      expect(root!.querySelector(`.action-pad-button.act .pad-icon.${goal.kind}`)).toBeTruthy();
      const correct = root!.querySelector<HTMLButtonElement>('button[data-correct="true"]');
      expect(correct, `runner step ${index} should have a correct lane`).toBeTruthy();
      correct!.click();
      if (index === 0) expect(root!.querySelector(".reward-strip")?.textContent).toMatch(/Baan open|Subitize Snap/);
      vi.runOnlyPendingTimers();
    }
    expect(root!.textContent).toContain("WebWoud Redders");
    expect((game.world as unknown as { children: unknown[] }).children.length).toBeGreaterThan(42);
    expect(root!.querySelector<HTMLElement>(".play-hud")?.dataset.gameplayHud).toBe("webwoud");
    expect(root!.querySelector<HTMLElement>(".web-hud.play-tokens")?.dataset.hudStyle).toBe("tokens");
    expect(root!.querySelector<HTMLElement>(".web-hud .micro-goal-chip")?.dataset.microGoal).toBeTruthy();
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".web-hud .play-token")).map((node) => node.dataset.token)).toEqual(["anchor", "rescue", "stars"]);
    expect(root!.querySelector(".web-hud .stat-pill")).toBeFalsy();
    expect(root!.querySelector(".play-field-layer.web")).toBeTruthy();
    expect(root!.querySelector(".challenge-card")).toBeFalsy();
    expect(root!.querySelector(".web-coach")).toBeFalsy();
    expect(root!.querySelector(".mission-ribbon")).toBeFalsy();
    expect(root!.querySelector(".option-grid.anchors")?.getAttribute("data-mode")).toBe("anchors");
    const webField = root!.querySelector<HTMLElement>(".option-grid.anchors.game-field");
    expect(webField?.getAttribute("data-field-mode")).toBe("web-canopy");
    expect(webField?.getAttribute("data-field-phase")).toBe("approach");
    expect(webField?.getAttribute("data-field-progress")).toBe("0");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".option-grid.anchors .option-card")).every((node) => node.dataset.worldHitZone === "true")).toBe(true);
    expect(root!.querySelectorAll(".vine-line")).toHaveLength(3);
    expect(root!.querySelectorAll(".anchor-ring")).toHaveLength(3);
    expect(root!.querySelector(".field-action-meter.web")).toBeTruthy();
    expect(Array.from(root!.querySelectorAll(".anchor-name")).map((node) => node.textContent)).toEqual(["Links", "Midden", "Rechts"]);
    expect(root!.querySelector(".action-pad")?.getAttribute("data-mode")).toBe("anchor");
    expect(root!.querySelector(".action-pad")?.getAttribute("data-pad-type")).toBe("movement");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".action-pad-button")).map((node) => node.dataset.padAction)).toEqual(["left", "act", "right"]);
    expect(root!.querySelector<HTMLButtonElement>('.action-pad-button[data-pad-action="act"]')?.getAttribute("aria-label")).toBe("Zwaai naar anker");
    expect(root!.querySelector<HTMLButtonElement>('button[data-action="Menu"]')?.classList.contains("icon-btn")).toBe(true);
    expect(root!.querySelector('button[data-action="Menu"] .control-icon.menu')).toBeTruthy();
    expect(root!.querySelector(".option-card.selected .choice-beacon.web")).toBeTruthy();
    expect(root!.querySelector(".option-card.selected .hero-marker.web")).toBeTruthy();
    game.scenes.update(0.5);
    expect(Number(root!.querySelector<HTMLElement>(".option-grid.anchors.game-field")?.dataset.fieldProgress)).toBeGreaterThan(0);
    expect(game.data().progress.attempts.filter((attempt) => attempt.scene === "runner")).toHaveLength(runnerMechanics.length);

    for (let index = 0; index < anchorDecisionPlan.length; index += 1) {
      const correct = root!.querySelector<HTMLButtonElement>('button[data-correct="true"]');
      expect(correct, `WebWoud step ${index} should have a correct anchor`).toBeTruthy();
      correct!.click();
      if (index === 0) expect(root!.querySelector(".reward-strip")?.textContent).toContain("Redding gelukt");
      if (index === 0) expect(root!.querySelector<HTMLElement>(".celebration-burst")?.dataset.celebration).toBe("true");
      vi.runOnlyPendingTimers();
    }
    expect(root!.textContent).toContain("Sterrenstad Bouwers");
    expect(root!.querySelector(".city-coach")).toBeTruthy();
    expect(root!.querySelector<HTMLElement>(".city-quick-build")?.dataset.nextDistrict).toBeTruthy();
    expect(root!.querySelector<HTMLButtonElement>('.city-quick-build button[data-action="Bouw nu"]')).toBeTruthy();
    expect(root!.querySelectorAll(".district-card.recommended")).toHaveLength(1);
    expect(game.data().progress.attempts.filter((attempt) => attempt.scene === "webwoud")).toHaveLength(anchorDecisionPlan.length);

    const district = Array.from(root!.querySelectorAll<HTMLButtonElement>(".district-card")).find((button) => button.textContent?.includes("Block Stack Yard"));
    expect(district).toBeTruthy();
    district!.click();
    const cityBuildObjects = (game.world as unknown as { children: unknown[] }).children.length;
    expect(root!.querySelector<HTMLButtonElement>(".district-card.selected")?.textContent).toContain("Block Stack Yard");
    expect(root!.querySelector<HTMLElement>(".city-build-live")?.dataset.cityBuildLive).toBe("true");
    expect(root!.querySelector<HTMLElement>(".play-hud")?.dataset.gameplayHud).toBe("city");
    expect(root!.querySelector<HTMLElement>(".city-build-field")?.dataset.cityBuildField).toBe("restoration-yard");
    expect(root!.querySelector<HTMLElement>(".city-build-field")?.dataset.fieldProgress).toBe("0");
    expect(root!.querySelector(".city-build-dash-meter")).toBeTruthy();
    expect(root!.querySelectorAll(".build-choice").length).toBeGreaterThanOrEqual(2);
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".build-choice")).every((node) => node.dataset.worldHitZone === "true")).toBe(true);
    expect(root!.querySelector(".action-pad")?.getAttribute("data-mode")).toBe("object");
    expect(root!.querySelector(".action-pad")?.getAttribute("data-pad-type")).toBe("movement");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".city-build-controls .action-pad-button")).map((node) => node.dataset.padAction)).toEqual(["left", "act", "right"]);
    expect(root!.querySelector<HTMLButtonElement>('.city-build-controls .action-pad-button[data-pad-action="act"]')?.getAttribute("aria-label")).toBe("Bouw keuze");
    expect(root!.querySelector<HTMLButtonElement>('.city-build-controls button[data-action="Terug"]')?.classList.contains("icon-btn")).toBe(true);
    expect(root!.querySelector('.city-build-controls button[data-action="Terug"] .control-icon.back')).toBeTruthy();
    const buildCorrect = root!.querySelector<HTMLButtonElement>('button[data-correct="true"]');
    expect(buildCorrect).toBeTruthy();
    const buildCorrectIndex = Number(buildCorrect!.dataset.optionIndex);
    const buildSelectedIndex = Number(root!.querySelector<HTMLElement>(".city-build-field")?.dataset.selectedIndex ?? 1);
    if (buildCorrectIndex < buildSelectedIndex) root!.querySelector<HTMLButtonElement>('.city-build-controls .action-pad-button[data-pad-action="left"]')!.click();
    if (buildCorrectIndex > buildSelectedIndex) root!.querySelector<HTMLButtonElement>('.city-build-controls .action-pad-button[data-pad-action="right"]')!.click();
    const cityAttemptsBefore = game.data().progress.attempts.length;
    game.scenes.update(2.2);
    expect(game.data().progress.attempts).toHaveLength(cityAttemptsBefore + 1);
    expect(game.data().progress.cityDistricts["block-yard"].restored).toBe(true);
    expect(game.data().progress.currentLevel).toBe(2);
    expect((game.world as unknown as { children: unknown[] }).children.length).toBeGreaterThan(cityBuildObjects);
    expect(root!.querySelector(".city-build-live")).toBeFalsy();
    expect(root!.querySelector(".reward-strip")?.textContent).toContain("Block Stack Yard groeit");
    expect(root!.querySelector<HTMLElement>(".celebration-burst")?.dataset.celebration).toBe("true");
    expect(root!.querySelector<HTMLElement>(".adventure-bridge")?.dataset.adventureBridge).toBe("city-summary");
    expect(root!.querySelector(".city-next-actions")?.textContent).toContain("Missie afronden");
    root!.querySelector<HTMLButtonElement>('.city-next-actions button[data-action="Missie afronden"]')!.click();
    expect(root!.textContent).toContain("Missie klaar");
    expect(root!.querySelector<HTMLElement>(".adventure-bridge")?.dataset.adventureBridge).toBe("city-summary");
    expect(root!.querySelector<HTMLElement>(".summary-finale")?.dataset.summaryWorld).toBe("finish");
    expect(root!.querySelector<HTMLElement>(".summary-treasure-trail")?.dataset.summaryProgress).toBe("treasure-trail");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".summary-treasure")).map((node) => node.dataset.treasureStep)).toEqual(["1", "2", "3", "4"]);
    expect(root!.querySelector<HTMLElement>(".summary-city-meter")?.dataset.cityRestored).toBe("1");
    expect(root!.querySelector<HTMLElement>(".summary-replay-actions")?.dataset.summaryActions).toBe("replay");
    expect(Array.from(root!.querySelectorAll<HTMLElement>(".summary-replay-actions .btn")).map((node) => node.textContent?.trim())).toEqual(["Nog een missie", "Bouw verder"]);
    const parentDetails = root!.querySelector<HTMLDetailsElement>(".summary-parent-details");
    expect(parentDetails).toBeTruthy();
    expect(parentDetails!.open).toBe(false);
    expect(parentDetails!.querySelector(".summary-scoreboard")?.textContent).toContain("Pogingen");
    expect(root!.querySelector(".summary-coach")).toBeTruthy();
    expect(root!.querySelector(".summary-coach .btn")).toBeFalsy();
    expect(root!.querySelector<HTMLElement>(".mission-ribbon")?.dataset.activeStep).toBe("done");
    expect(game.data().progress.sessions.at(-1)?.endedAt).toBeTypeOf("number");
    const endedSessionId = game.data().progress.sessions.at(-1)?.id;
    root!.querySelector<HTMLButtonElement>('.summary-replay-actions button[data-action="Nog een missie"]')!.click();
    expect(fullscreenSpy).toHaveBeenCalledTimes(1);
    expect(root!.textContent).toContain("Getalpoort");
    expect(game.data().progress.sessionId).not.toBe(endedSessionId);
    expect(game.data().progress.sessions.at(-1)?.endedAt).toBeUndefined();
    vi.useRealTimers();
  });

  it("rewards fast Subitize Snap and keeps wrong attempts safe", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const audioSpy = vi.spyOn(game.audio, "play").mockImplementation(() => undefined);
    const hapticSpy = vi.spyOn(game.haptics, "play").mockImplementation(() => undefined);

    const snapChallenge = game.challenges.createRunnerChallenge("flash-gate", { quantity: 3 });
    const correct = snapChallenge.options.find((option) => option.isCorrect);
    expect(correct).toBeTruthy();
    vi.mocked(performance.now).mockReturnValue(1250);
    expect(game.recordAttempt(snapChallenge, correct!, 1000, false)).toBe(true);
    expect(audioSpy).toHaveBeenLastCalledWith("snap");
    expect(hapticSpy).toHaveBeenLastCalledWith("snap");

    let data = game.data();
    expect(data.progress.stars).toBe(3);
    expect(data.progress.numberBlocks).toBe(1);
    expect(data.progress.dinoStreak).toBe(1);
    expect(data.progress.attempts[0].reactionTimeMs).toBe(250);

    const wrongChallenge = game.challenges.createRunnerChallenge("enemy-wave", { quantity: 6 });
    const wrong = wrongChallenge.options.find((option) => !option.isCorrect);
    expect(wrong).toBeTruthy();
    vi.mocked(performance.now).mockReturnValue(2300);
    expect(game.recordAttempt(wrongChallenge, wrong!, 1000, true)).toBe(false);
    expect(audioSpy).toHaveBeenLastCalledWith("soft-error");
    expect(hapticSpy).toHaveBeenLastCalledWith("soft-error");

    data = game.data();
    expect(data.progress.stars).toBe(3);
    expect(data.progress.dinoStreak).toBe(0);
    expect(data.progress.attempts).toHaveLength(2);
    expect(data.progress.attempts[1].wasCorrect).toBe(false);
    expect(data.progress.attempts[1].hintUsed).toBe(true);
    expect(data.progress.attempts[1].errorType).toBeTruthy();
  });

  it("routes scene-specific success audio through the shared attempt pipeline", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const audioSpy = vi.spyOn(game.audio, "play").mockImplementation(() => undefined);
    const hapticSpy = vi.spyOn(game.haptics, "play").mockImplementation(() => undefined);

    const webChallenge = game.challenges.createMinigame("web-anchors", { quantity: 5, scene: "webwoud" });
    const webCorrect = webChallenge.options.find((option) => option.isCorrect);
    expect(webCorrect).toBeTruthy();
    vi.mocked(performance.now).mockReturnValue(1600);
    game.recordAttempt(webChallenge, webCorrect!, 1000, false);
    expect(audioSpy).toHaveBeenLastCalledWith("rescue");
    expect(hapticSpy).toHaveBeenLastCalledWith("rescue");

    const cityChallenge = game.challenges.createCityChallenge("block-yard", { quantity: 7, representation: "blocks" });
    const cityCorrect = cityChallenge.options.find((option) => option.isCorrect);
    expect(cityCorrect).toBeTruthy();
    vi.mocked(performance.now).mockReturnValue(1700);
    game.recordAttempt(cityChallenge, cityCorrect!, 1000, false);
    expect(audioSpy).toHaveBeenLastCalledWith("build");
    expect(hapticSpy).toHaveBeenLastCalledWith("build");

    const rescueChallenge = game.challenges.createMinigame("rescue-the-herd", { quantity: 4, scene: "minigame" });
    const rescueCorrect = rescueChallenge.options.find((option) => option.isCorrect);
    expect(rescueCorrect).toBeTruthy();
    vi.mocked(performance.now).mockReturnValue(1800);
    game.recordAttempt(rescueChallenge, rescueCorrect!, 1000, false);
    expect(audioSpy).toHaveBeenLastCalledWith("rescue");
    expect(hapticSpy).toHaveBeenLastCalledWith("rescue");
  });

  it("renders a Subitize Snap burst for fast runner recognition", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);

    game.showScene("runner");
    const correct = root!.querySelector<HTMLButtonElement>('button[data-correct="true"]');
    expect(correct).toBeTruthy();
    vi.mocked(performance.now).mockReturnValue(1200);
    correct!.click();

    expect(root!.querySelector<HTMLElement>(".snap-burst")?.dataset.snap).toBe("true");
    expect(root!.textContent).toContain("Subitize Snap");
    expect(root!.querySelector(".reward-strip")?.textContent).toContain("+3");
    expect(root!.querySelectorAll(".snap-burst span")).toHaveLength(6);
  });

  it("adds visible route pacing rewards on runner milestones", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);

    game.showScene("runner");
    for (let step = 0; step < 3; step += 1) {
      const correct = root!.querySelector<HTMLButtonElement>('button[data-correct="true"]');
      expect(correct).toBeTruthy();
      correct!.click();
      if (step < 2) vi.runOnlyPendingTimers();
    }

    expect(root!.querySelector(".reward-strip")?.textContent).toContain("Route");
    expect(root!.querySelectorAll(".reward-badge")).toHaveLength(4);
    vi.useRealTimers();
  });

  it("keeps wrong scene choices scaffolded and retryable without a hard failure", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const roleCount = (role: string) =>
      (game.world as unknown as { children: Array<{ userData?: { blokblitzRole?: string } }> }).children.filter((child) => child.userData?.blokblitzRole === role).length;

    game.showScene("runner");
    const runnerWrong = root!.querySelector<HTMLButtonElement>('button[data-correct="false"]');
    expect(runnerWrong).toBeTruthy();
    runnerWrong!.click();
    expect(root!.textContent).toContain("BlokBlitz Sprint");
    expect(root!.textContent).toContain("Kijk naar het groepje");
    expect(root!.querySelector<HTMLElement>(".scaffold-strip")?.dataset.scaffold).toBe("true");
    expect(root!.querySelector(".scaffold-strip")?.textContent).toContain("Nog eens");
    expect(root!.querySelector(".reward-strip")).toBeFalsy();
    expect(root!.querySelector(".celebration-burst")).toBeFalsy();
    expect(root!.querySelector<HTMLButtonElement>('button[data-correct="true"]')).toBeTruthy();
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.correct).toBe("true");
    expect(roleCount("scaffold-target-beacon")).toBeGreaterThan(0);
    expect(roleCount("scaffold-target-pointer")).toBeGreaterThan(0);
    expect(game.data().progress.attempts.at(-1)?.wasCorrect).toBe(false);

    game.showScene("webwoud");
    const webWrong = root!.querySelector<HTMLButtonElement>('button[data-correct="false"]');
    expect(webWrong).toBeTruthy();
    webWrong!.click();
    expect(root!.textContent).toContain("WebWoud Redders");
    expect(root!.querySelector(".scaffold-strip")?.textContent).toContain("Nog eens");
    expect(root!.querySelector<HTMLButtonElement>(".option-card.selected")?.dataset.correct).toBe("true");
    expect(roleCount("scaffold-target-beacon")).toBeGreaterThan(0);

    game.showScene("city");
    const district = Array.from(root!.querySelectorAll<HTMLButtonElement>(".district-card")).find((button) => button.textContent?.includes("Block Stack Yard"));
    expect(district).toBeTruthy();
    district!.click();
    const cityWrong = root!.querySelector<HTMLButtonElement>('button[data-correct="false"]');
    expect(cityWrong).toBeTruthy();
    cityWrong!.click();
    expect(root!.textContent).toContain("Sterrenstad Bouwers");
    expect(root!.textContent).toContain("Bouw eerst vijf");
    expect(root!.querySelector<HTMLElement>(".city-build-live")?.dataset.cityBuildLive).toBe("true");
    expect(root!.querySelector<HTMLElement>(".play-hud")?.dataset.gameplayHud).toBe("city");
    expect(root!.querySelector<HTMLElement>(".city-build-field")?.dataset.cityBuildField).toBe("restoration-yard");
    expect(root!.querySelector<HTMLElement>(".city-build-field")?.dataset.fieldPhase).toBe("scaffold");
    expect(root!.querySelector<HTMLElement>(".city-build-field")?.dataset.fieldProgress).toBe("0");
    expect(root!.querySelector(".city-build-dash-meter")).toBeTruthy();
    expect(root!.querySelector(".scaffold-strip")?.textContent).toContain("Nog eens");
    expect(root!.querySelector<HTMLButtonElement>('button[data-correct="true"]')).toBeTruthy();
    expect(root!.querySelector<HTMLButtonElement>(".build-choice.selected")?.dataset.correct).toBe("true");
    expect(roleCount("scaffold-target-beacon")).toBeGreaterThan(0);
    expect(game.data().progress.cityDistricts["block-yard"].restored).toBe(false);
    expect(game.data().progress.attempts.at(-1)?.wasCorrect).toBe(false);

    game.showScene("minigame", "one-more-one-less");
    const minigameWrong = root!.querySelector<HTMLButtonElement>('button[data-correct="false"]');
    expect(minigameWrong).toBeTruthy();
    minigameWrong!.click();
    expect(root!.textContent).toContain("Oefenwereld");
    expect(root!.querySelector(".scaffold-strip")?.textContent).toContain("Nog eens");
    expect(root!.querySelector<HTMLButtonElement>(".mini-object.selected")?.dataset.correct).toBe("true");
    expect(roleCount("scaffold-target-beacon")).toBeGreaterThan(0);
  });

  it("shows every required parent dashboard readout from saved mastery data", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);

    const correctChallenge = game.challenges.createMinigame("make-ten-shield", { quantity: 7, scene: "minigame" });
    const correct = correctChallenge.options.find((option) => option.isCorrect)!;
    vi.mocked(performance.now).mockReturnValue(1520);
    game.recordAttempt(correctChallenge, correct, 1000, false);

    const wrongChallenge = game.challenges.createMinigame("one-more-one-less", { quantity: 4, scene: "minigame" });
    const wrong = wrongChallenge.options.find((option) => !option.isCorrect)!;
    vi.mocked(performance.now).mockReturnValue(1910);
    game.recordAttempt(wrongChallenge, wrong, 1000, true);

    game.showScene("parentDashboard");
    const text = root!.textContent ?? "";
    for (const label of [
      "Mastery per skill",
      "Mastery per representatie",
      "Zwakste hoeveelheden",
      "Zwakste ranges",
      "Misconcepties",
      "Reactietijd trend",
      "Sessies",
      "Recente voortgang",
      "Volgende focus",
      "Hint rate"
    ]) {
      expect(text).toContain(label);
    }
    expect(text).toContain("make-ten-shield");
    expect(text).toContain("one-more-one-less");
    expect(text).toContain("520 ms");
    expect(text).toContain("910 ms");
  });

  it("exports and resets parent dashboard progress with confirmation", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app");
    const game = new Game(root!);
    const challenge = game.challenges.createMinigame("build-the-number", { quantity: 7, scene: "minigame" });
    const correct = challenge.options.find((option) => option.isCorrect)!;
    vi.mocked(performance.now).mockReturnValue(1600);
    game.recordAttempt(challenge, correct, 1000, false);

    const createObjectURL = vi.fn(() => "blob:blokblitz-progress");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    game.showScene("parentDashboard");
    expect(root!.textContent).toContain("Ouder dashboard");
    root!.querySelector<HTMLButtonElement>('button[data-action="Export JSON"]')!.click();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:blokblitz-progress");

    root!.querySelector<HTMLButtonElement>('button[data-action="Reset voortgang"]')!.click();
    expect(window.confirm).toHaveBeenCalledOnce();
    expect(game.data().progress.attempts).toHaveLength(0);
    expect(game.mastery.getAttempts()).toHaveLength(0);
    expect(root!.textContent).toContain("Nog geen data");
  });
});
