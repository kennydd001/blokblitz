// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptiveEngine } from "../src/education/adaptiveEngine";
import { ChallengeFactory } from "../src/education/challengeFactory";
import { MasteryTracker } from "../src/education/masteryTracker";
import { AdaptiveGateProvider } from "../src/runner/gateProvider";
import { RunnerCore, type GateProvider, type GateSpec } from "../src/runner/RunnerCore";
import { STICKERS } from "../src/data/stickers";
import { WORLDS, nextWorldId, starsForRun } from "../src/runner/worlds";

// A compact Three.js stand-in covering everything the menu, runner view and the
// legacy world builders touch. jsdom has no WebGL, so the real renderer is replaced.
vi.mock("three", () => {
  class MockObject3D {
    position = {
      x: 0,
      y: 0,
      z: 0,
      set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    };
    rotation = { x: 0, y: 0, z: 0 };
    scale = {
      x: 1,
      y: 1,
      z: 1,
      set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    };
    userData: Record<string, unknown> = {};
    castShadow = false;
    receiveShadow = false;
  }
  class Group extends MockObject3D {
    children: unknown[] = [];
    add(...objects: unknown[]) {
      this.children.push(...objects);
    }
    remove(object: unknown) {
      const index = this.children.indexOf(object);
      if (index >= 0) this.children.splice(index, 1);
    }
    clear() {
      this.children = [];
    }
  }
  class Scene extends Group {
    background: unknown;
    fog: unknown = null;
  }
  class PerspectiveCamera extends MockObject3D {
    aspect = 1;
    fov = 55;
    constructor(fov: number, aspect: number, readonly near = 0.1, readonly far = 100) {
      super();
      this.fov = fov;
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
    constructor(readonly geometry: unknown, readonly material: unknown) {
      super();
    }
  }
  class Line extends Mesh {}
  class DirectionalLight extends MockObject3D {
    constructor(readonly color: unknown, readonly intensity?: number) {
      super();
    }
  }
  class HemisphereLight extends DirectionalLight {}
  class AmbientLight extends DirectionalLight {}
  class Color {
    constructor(readonly value: unknown) {}
  }
  class Fog {
    constructor(readonly color: unknown, readonly near: number, readonly far: number) {}
  }
  class BoxGeometry {
    args: unknown[];
    constructor(...args: unknown[]) {
      this.args = args;
    }
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
    constructor(readonly x: number, readonly y: number, readonly z: number) {}
  }
  return {
    Scene,
    Group,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    Line,
    DirectionalLight,
    HemisphereLight,
    AmbientLight,
    Color,
    Fog,
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

function fixedGateProvider(correctLane: number): GateProvider {
  let n = 0;
  return {
    next(): GateSpec {
      n += 1;
      const lanes = [0, 1, 2].map((lane) => ({
        quantity: lane + 1,
        correct: lane === correctLane,
        numeral: String(lane + 1)
      }));
      return { id: `g${n}`, lanes, correctLane, targetText: "x", skill: "subitize" };
    }
  };
}

function driveToFinish(core: RunnerCore, maxSteps = 8000): void {
  for (let i = 0; i < maxSteps && core.state !== "finished"; i += 1) core.update(0.05);
}

describe("RunnerCore — real-time runner logic", () => {
  it("finishes a run and never reaches a game-over state", () => {
    const core = new RunnerCore({ provider: fixedGateProvider(1), gatesTotal: 4, rng: () => 0.5 });
    driveToFinish(core);
    expect(core.state).toBe("finished");
    const summary = core.summary();
    expect(summary.gatesTotal).toBe(4);
    expect(summary.distanceMeters).toBeGreaterThan(0);
  });

  it("rewards staying in the correct lane with a perfect run", () => {
    // Hero starts in the middle lane (1); keep the correct gate there.
    const core = new RunnerCore({ provider: fixedGateProvider(1), gatesTotal: 5, rng: () => 0.5 });
    driveToFinish(core);
    const summary = core.summary();
    expect(summary.gatesCorrect).toBe(5);
    expect(summary.perfect).toBe(true);
    expect(summary.runStars).toBe(5);
  });

  it("treats wrong lanes as safe: zero stars but the run still completes", () => {
    const core = new RunnerCore({ provider: fixedGateProvider(0), gatesTotal: 4, rng: () => 0.5 });
    // Hero stays in the middle lane while the correct gate is on the left.
    driveToFinish(core);
    const summary = core.summary();
    expect(summary.gatesCorrect).toBe(0);
    expect(core.state).toBe("finished");
  });

  it("emits a finished event exactly once with a summary", () => {
    const core = new RunnerCore({ provider: fixedGateProvider(1), gatesTotal: 3, rng: () => 0.5 });
    let finishedCount = 0;
    for (let i = 0; i < 8000 && core.state !== "finished"; i += 1) {
      core.update(0.05);
      for (const event of core.drainEvents()) if (event.type === "finished") finishedCount += 1;
    }
    for (const event of core.drainEvents()) if (event.type === "finished") finishedCount += 1;
    expect(finishedCount).toBe(1);
  });

  it("lets the player change lanes within the three-lane band", () => {
    const core = new RunnerCore({ provider: fixedGateProvider(1), gatesTotal: 2 });
    core.input("left");
    core.input("left");
    core.input("left"); // clamped at 0
    core.update(0.2);
    expect(core.snapshot().laneTarget).toBe(0);
    core.input("right");
    core.input("right");
    core.input("right"); // clamped at 2
    core.update(0.2);
    expect(core.snapshot().laneTarget).toBe(2);
  });
});

describe("AdaptiveGateProvider — gates from the education engine", () => {
  it("produces a three-lane gate with exactly one correct lane", () => {
    const tracker = new MasteryTracker([]);
    const provider = new AdaptiveGateProvider(new AdaptiveEngine(tracker), new ChallengeFactory());
    for (let round = 0; round < 6; round += 1) {
      const gate = provider.next(round);
      expect(gate.lanes).toHaveLength(3);
      expect(gate.lanes.filter((lane) => lane.correct)).toHaveLength(1);
      expect(gate.correctLane).toBeGreaterThanOrEqual(0);
      expect(gate.correctLane).toBeLessThan(3);
      expect(gate.lanes[gate.correctLane].correct).toBe(true);
      expect(gate.meta).toBeTruthy();
    }
  });

  it("respects a world's quantity cap and representation set", () => {
    const tracker = new MasteryTracker([]);
    const provider = new AdaptiveGateProvider(new AdaptiveEngine(tracker), new ChallengeFactory(), {
      maxQuantity: 5,
      gateTypes: ["flash-gates"],
      representations: ["dice"]
    });
    for (let round = 0; round < 5; round += 1) {
      const gate = provider.next(round);
      expect(gate.representation).toBe("dice");
      expect(gate.lanes.every((lane) => lane.quantity <= 5)).toBe(true);
    }
  });
});

describe("worlds — progression ladder", () => {
  it("defines six worlds chained by unlock and rising number caps", () => {
    expect(WORLDS).toHaveLength(6);
    expect(WORLDS[0].unlockAfter).toBeNull();
    expect(WORLDS[0].maxQuantity).toBeLessThanOrEqual(WORLDS[5].maxQuantity);
    for (let i = 1; i < WORLDS.length; i += 1) {
      expect(WORLDS[i].unlockAfter).toBe(WORLDS[i - 1].id);
    }
  });

  it("rates runs from one to three stars", () => {
    expect(starsForRun(6, 6)).toBe(3);
    expect(starsForRun(4, 6)).toBe(2);
    expect(starsForRun(2, 6)).toBe(1);
  });

  it("walks the world chain and stops at the end", () => {
    expect(nextWorldId("grasland")).toBe("muntgrot");
    expect(nextWorldId(WORLDS[WORLDS.length - 1].id)).toBeNull();
  });
});

describe("game shell — menu, run, results", () => {
  beforeEach(() => {
    document.body.className = "";
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("shows a world-map hub and a hero garage", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("mainMenu");
    expect(root.querySelector(".world-map")).toBeTruthy();
    expect(root.querySelectorAll(".world-card").length).toBe(6);
    // The first world is open, the rest are locked at the start.
    expect(root.querySelector('.world-card[data-world="grasland"]')?.getAttribute("data-locked")).toBe("false");
    expect(root.querySelectorAll('.world-card[data-locked="true"]').length).toBe(5);
    expect(root.querySelector(".menu-garage")).toBeTruthy();
    expect(root.querySelector(".garage-card.active")?.getAttribute("data-skin")).toBe("blitz");
  });

  it("keeps later worlds locked until the previous one is finished", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    expect(game.data().progress.worlds.muntgrot.unlocked).toBe(false);
    const { newWorldUnlocked } = game.save.recordWorldResult("grasland", 2);
    expect(newWorldUnlocked).toBe(true);
    expect(game.data().progress.worlds.muntgrot.unlocked).toBe(true);
    expect(game.data().progress.worlds.grasland.bestStars).toBe(2);

    game.showScene("mainMenu");
    expect(root.querySelector('.world-card[data-world="muntgrot"]')?.getAttribute("data-locked")).toBe("false");
  });

  it("unlocks and selects a hero once enough stars are earned", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.award({ stars: 20 });

    game.showScene("mainMenu");
    const aqua = root.querySelector<HTMLButtonElement>('.garage-card[data-skin="aqua"]');
    expect(aqua?.dataset.locked).toBe("false");
    aqua!.click();
    expect(game.data().progress.cosmetics.activeSkin).toBe("aqua");
  });

  it("starts a run from the menu, requesting fullscreen", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const fullscreenSpy = vi.fn(() => Promise.resolve());
    Object.defineProperty(root, "requestFullscreen", { value: fullscreenSpy, configurable: true });

    game.showScene("mainMenu");
    root.querySelector<HTMLButtonElement>('.world-card[data-world="grasland"]')!.click();
    expect(fullscreenSpy).toHaveBeenCalledTimes(1);
    expect(root.querySelector(".run-scene")).toBeTruthy();
    expect(root.querySelectorAll(".run-ctrl")).toHaveLength(3);
    expect(root.querySelector(".run-target")).toBeTruthy();
    // The 3D world is populated by the runner view.
    expect((game.world as unknown as { children: unknown[] }).children.length).toBeGreaterThan(2);
  });

  it("plays a full run that logs number attempts and ends on the results screen", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("run");
    expect(root.querySelector(".run-scene")).toBeTruthy();
    const before = game.data().progress.attempts.length;

    for (let i = 0; i < 8000 && !root.querySelector(".results-card"); i += 1) {
      game.scenes.update(0.05);
    }

    expect(root.querySelector(".results-card")).toBeTruthy();
    expect(root.querySelector(".results-title")).toBeTruthy();
    expect(root.querySelector(".results-star-rating")).toBeTruthy();
    // Every gate of the default world is logged through the shared MasteryTracker.
    expect(game.data().progress.attempts.length).toBeGreaterThanOrEqual(before + 5);
    expect(game.data().progress.runsCompleted).toBe(1);
    expect(root.textContent).not.toContain("Game over");
  });

  it("responds to on-screen lane and jump controls without throwing", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("run");
    game.scenes.update(0.05);
    expect(() => {
      root.querySelector<HTMLButtonElement>('.run-ctrl[data-run-ctrl="left"]')!.click();
      root.querySelector<HTMLButtonElement>('.run-ctrl[data-run-ctrl="jump"]')!.click();
      root.querySelector<HTMLButtonElement>('.run-ctrl[data-run-ctrl="right"]')!.click();
      game.scenes.update(0.05);
    }).not.toThrow();
  });
});

describe("Speeltuin hub + calm game modes", () => {
  beforeEach(() => {
    document.body.className = "";
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("shows game-mode cards and a garage in the hub", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("hub");
    expect(root.querySelectorAll(".hub-card").length).toBe(8);
    ["mainMenu", "count", "match", "compare", "fill", "onemoreless", "order", "memory"].forEach((mode) => {
      expect(root.querySelector(`.hub-card[data-mode="${mode}"]`)).toBeTruthy();
    });
    expect(root.querySelector(".menu-garage")).toBeTruthy();
  });

  const choicePlay = async (scene: string): Promise<void> => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene(scene);
    expect(root.querySelector(".mini-header")).toBeTruthy();
    expect(root.querySelector(".mini-instruction")).toBeTruthy();
    const before = game.data().progress.attempts.length;
    for (let r = 0; r < 15 && !root.querySelector(".results-card"); r += 1) {
      const correct = root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]');
      if (!correct) break;
      correct.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".results-star-rating")).toBeTruthy();
    expect(game.data().progress.attempts.length).toBeGreaterThanOrEqual(before + 5);
  };

  it("plays Tel mee end to end and logs attempts", () => choicePlay("count"));
  it("plays Zoek hetzelfde end to end and logs attempts", () => choicePlay("match"));
  it("plays Wat is meer? end to end and logs attempts", () => choicePlay("compare"));
  it("plays Eentje erbij end to end and logs attempts", () => choicePlay("onemoreless"));

  it("plays Op volgorde by tapping numbers small to big", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("order");
    const before = game.data().progress.attempts.length;
    for (let r = 0; r < 15 && !root.querySelector(".results-card"); r += 1) {
      const cards = Array.from(root.querySelectorAll<HTMLElement>(".order-card"));
      if (!cards.length) break;
      const sorted = cards.map((c) => Number(c.dataset.quantity)).sort((a, b) => a - b);
      sorted.forEach((q) => root.querySelector<HTMLButtonElement>(`.order-card[data-quantity="${q}"]`)?.click());
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".results-star-rating")).toBeTruthy();
    expect(game.data().progress.attempts.length).toBeGreaterThanOrEqual(before + 5);
  });

  it("plays Memory by matching every number to its getalbeeld", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("memory");
    const before = game.data().progress.attempts.length;
    const byQuantity = new Map<string, HTMLButtonElement[]>();
    root.querySelectorAll<HTMLButtonElement>(".memory-card").forEach((card) => {
      const q = card.dataset.quantity!;
      byQuantity.set(q, [...(byQuantity.get(q) ?? []), card]);
    });
    expect(byQuantity.size).toBe(4);
    for (const pair of byQuantity.values()) {
      pair[0].click();
      pair[1].click();
    }
    vi.advanceTimersByTime(900);
    expect(root.querySelector(".results-star-rating")).toBeTruthy();
    expect(game.data().progress.attempts.length).toBeGreaterThanOrEqual(before + 4);
  });

  it("plays Vul de tien by filling the ten-frame to the target", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("fill");
    const before = game.data().progress.attempts.length;
    for (let r = 0; r < 15 && !root.querySelector(".results-card"); r += 1) {
      const target = Number(root.querySelector(".fill-goal strong")?.textContent);
      const cells = Array.from(root.querySelectorAll<HTMLButtonElement>(".ten-cell"));
      if (!cells.length) break;
      for (let i = 0; i < target; i += 1) cells[i].click();
      root.querySelector<HTMLButtonElement>(".fill-done")!.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".results-star-rating")).toBeTruthy();
    expect(game.data().progress.attempts.length).toBeGreaterThanOrEqual(before + 5);
  });
});

describe("rewards, voice and parent gate", () => {
  beforeEach(() => {
    document.body.className = "";
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("shows a sticker book in the hub", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("hub");
    expect(root.querySelector(".sticker-book")).toBeTruthy();
    expect(root.querySelectorAll(".sticker-cell").length).toBe(STICKERS.length);
    expect(root.querySelectorAll(".sticker-cell.earned").length).toBe(0);
  });

  it("awards collectible stickers after playing a mode", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("count");
    for (let r = 0; r < 15 && !root.querySelector(".results-card"); r += 1) {
      const correct = root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]');
      if (!correct) break;
      correct.click();
      vi.advanceTimersByTime(1100);
    }
    expect(game.data().progress.stickers).toContain("first-star");
    expect(root.querySelector(".results-unlock.sticker")).toBeTruthy();
  });

  it("re-teaches with a scaffold visual on a wrong answer instead of just failing", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("count");
    const before = game.data().progress.attempts.length;
    const wrong = root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="false"]');
    expect(wrong).toBeTruthy();
    wrong!.click();
    expect(root.querySelector(".mini-scaffold")).toBeTruthy();
    expect(root.querySelector(".mini-scaffold .quantity-svg")).toBeTruthy();
    expect(game.data().progress.attempts.at(-1)?.wasCorrect).toBe(false);
    expect(game.data().progress.attempts.length).toBe(before + 1);
    // No game over: the round stays so the child can retry.
    expect(root.querySelector(".mini-choice")).toBeTruthy();
  });

  it("brings a reacting buddy and an escalating streak to every mode", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("count");
    expect(root.querySelector(".buddy")).toBeTruthy();
    // first correct: buddy cheers
    root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]')!.click();
    expect(root.querySelector(".buddy.mood-happy, .buddy.mood-wow")).toBeTruthy();
    vi.advanceTimersByTime(1100);
    // second correct in a row: a streak banner appears
    root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]')!.click();
    expect(root.querySelector(".mini-streak")).toBeTruthy();
  });

  it("guards the parent area behind a sum and only proceeds on the right answer", async () => {
    const { openParentGate } = await import("../src/scenes/parentGate");
    const pass = vi.fn();
    openParentGate(pass);
    expect(document.querySelector(".parent-gate-overlay")).toBeTruthy();
    document.querySelector<HTMLButtonElement>('.parent-gate-option[data-correct="false"]')!.click();
    expect(pass).not.toHaveBeenCalled();
    expect(document.querySelector(".parent-gate-overlay")).toBeTruthy();
    document.querySelector<HTMLButtonElement>('.parent-gate-option[data-correct="true"]')!.click();
    expect(pass).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".parent-gate-overlay")).toBeFalsy();
  });

  it("keeps the spoken voice a safe no-op without speech support", async () => {
    const { VoiceManager } = await import("../src/game/VoiceManager");
    const voice = new VoiceManager();
    expect(() => {
      voice.speak("hoi");
      voice.sayNumber(5);
      voice.countTo(3);
      voice.praise();
      voice.encourage();
      voice.cancel();
    }).not.toThrow();
  });
});

describe("input mapping", () => {
  it("maps touch-like swipes to lane and jump actions and ignores small taps", async () => {
    const { InputManager } = await import("../src/game/InputManager");
    const input = new InputManager();
    const actions: string[] = [];
    input.subscribe((action) => actions.push(action));
    input.attach();

    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 200, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 208, clientY: 304 })); // tap -> ignored
    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 260, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 110, clientY: 304 })); // left
    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 110, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 260, clientY: 304 })); // right
    window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 190, clientY: 360 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 190, clientY: 240 })); // up

    expect(actions).toEqual(["left", "right", "up"]);
    input.detach();
  });
});
