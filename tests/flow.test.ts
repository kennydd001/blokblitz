// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptiveEngine } from "../src/education/adaptiveEngine";
import { ChallengeFactory } from "../src/education/challengeFactory";
import { MasteryTracker } from "../src/education/masteryTracker";
import { buildCurriculumAttempt } from "../src/education/challengeLogger";
import { AdaptiveGateProvider } from "../src/runner/gateProvider";
import { RunnerCore, type GateProvider, type GateSpec, type RunnerSnapshot } from "../src/runner/RunnerCore";
import { STICKERS } from "../src/data/stickers";
import { PLAY_MODES } from "../src/data/playModes";
import { BOSSES, FRIENDS, FRIEND_STORY, JOURNEY, JOURNEY_INTRO, REGION_STORY, backfillCompleted, frontierIndex, journeyNodeAction, journeyNodeTitle } from "../src/data/journey";
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
  class CanvasTexture {
    constructor(readonly image: unknown) {}
    needsUpdate = false;
  }
  return {
    Scene,
    Group,
    CanvasTexture,
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

function collectUserDataByRole(root: unknown, role: string): Array<Record<string, unknown>> {
  const matches: Array<Record<string, unknown>> = [];
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const object = node as { userData?: Record<string, unknown>; children?: unknown[] };
    if (object.userData?.blokblitzRole === role) matches.push(object.userData);
    if (Array.isArray(object.children)) object.children.forEach(visit);
  };
  visit(root);
  return matches;
}

function countEveryAnimal(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>(".count-item:not(.counted)").forEach((animal) => animal.click());
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

  it("combo fever (3+) doubles coin pickups and shows in the snapshot", () => {
    // All gates correct from the middle lane -> combo climbs 1,2,3,... so later
    // coins are collected in fever. Reconstruct the exact coin total from the
    // event stream: 2 per fever coin, 1 otherwise, -2 per stumble (floored at 0).
    const core = new RunnerCore({ provider: fixedGateProvider(1), gatesTotal: 6, rng: () => 0.5 });
    let expected = 0;
    let feverCoins = 0;
    let sawFeverSnapshot = false;
    for (let i = 0; i < 8000 && core.state !== "finished"; i += 1) {
      core.update(0.05);
      if (core.snapshot().fever) sawFeverSnapshot = true;
      for (const event of core.drainEvents()) {
        if (event.type === "coin") {
          const fever = event.combo >= 3;
          expected += fever ? 2 : 1;
          if (fever) feverCoins += 1;
        } else if (event.type === "stumble") {
          expected = Math.max(0, expected - 2);
        }
      }
    }
    expect(sawFeverSnapshot).toBe(true);
    expect(feverCoins).toBeGreaterThan(0);
    expect(core.snapshot().coins).toBe(expected);
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

describe("RunnerView — clear mobile-readable gates", () => {
  it("renders each gate as a big number-coloured doorway", async () => {
    const THREE = await import("three");
    const { RunnerView } = await import("../src/runner/RunnerView");
    const { numberColor } = await import("../src/runner/voxelNumber");
    const { skinById } = await import("../src/runner/skins");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    const view = new RunnerView(scene, camera, skinById("blitz"));
    view.build();

    const gate: GateSpec = {
      id: "clarity-gate",
      correctLane: 1,
      targetText: "Ren door de 7!",
      skill: "subitize",
      representation: "tenframe",
      lanes: [
        { quantity: 4, correct: false, numeral: "4" },
        { quantity: 7, correct: true, numeral: "7" },
        { quantity: 9, correct: false, numeral: "9" }
      ]
    };
    const snapshot: RunnerSnapshot = {
      state: "running",
      laneTarget: 1,
      laneX: 1,
      airborne: false,
      jumpHeight: 0,
      speed: 11,
      speedRatio: 0.2,
      fever: false,
      distanceMeters: 12,
      coins: 0,
      runStars: 0,
      bonusStars: 0,
      combo: 0,
      bestCombo: 0,
      gatesCorrect: 0,
      gatesResolved: 0,
      gatesTotal: 1,
      target: gate,
      entities: [
        {
          id: 99,
          kind: "gate",
          z: -18,
          lane: 0,
          gate,
          collected: false,
          resolved: false,
          correctResolved: false
        }
      ]
    };

    view.sync(snapshot, 0.016);
    const lanes = collectUserDataByRole(scene, "runner-gate-lane");
    expect(lanes).toHaveLength(3);
    // Each lane is coloured by its NUMBER (not its position), so colour alone
    // already tells the child which gate is which; all three differ.
    expect(lanes.map((lane) => lane.gateColor)).toEqual([numberColor(4), numberColor(7), numberColor(9)]);
    expect(new Set(lanes.map((lane) => lane.gateColor)).size).toBe(3);
    expect(lanes.find((lane) => lane.lane === 1)?.selectedFocus).toBe(true);

    // The dominant marks per lane: a giant numeral + the matching getalbeeld.
    expect(collectUserDataByRole(scene, "runner-gate-big-numeral").map((lane) => lane.quantity)).toEqual([4, 7, 9]);
    expect(collectUserDataByRole(scene, "runner-gate-quantity-art").map((lane) => lane.quantity)).toEqual([4, 7, 9]);
    // A coloured sign panel + a glowing floor carpet, two posts per doorway.
    expect(collectUserDataByRole(scene, "runner-gate-panel").map((lane) => lane.quantity)).toEqual([4, 7, 9]);
    expect(collectUserDataByRole(scene, "runner-gate-floor").map((lane) => lane.quantity)).toEqual([4, 7, 9]);
    expect(collectUserDataByRole(scene, "runner-gate-post")).toHaveLength(6);

    // The decluttered design drops the old chevrons / runways / 5+ shelves / preview.
    expect(collectUserDataByRole(scene, "runner-gate-number-runway")).toHaveLength(0);
    expect(collectUserDataByRole(scene, "runner-gate-five-structure")).toHaveLength(0);
    expect(collectUserDataByRole(scene, "runner-gate-preview-lane")).toHaveLength(0);
  });
});

describe("AdaptiveGateProvider — gates from the education engine", () => {
  it("produces a two-lane fork with exactly one correct choice", () => {
    const tracker = new MasteryTracker([]);
    const provider = new AdaptiveGateProvider(new AdaptiveEngine(tracker), new ChallengeFactory());
    for (let round = 0; round < 6; round += 1) {
      const gate = provider.next(round);
      // Default gate is a big left/right fork: two choices on lanes 0 and 2.
      expect(gate.lanes).toHaveLength(2);
      expect(gate.lanes.map((lane) => lane.lane)).toEqual([0, 2]);
      expect(gate.lanes.filter((lane) => lane.correct)).toHaveLength(1);
      expect([0, 2]).toContain(gate.correctLane);
      const correctEntry = gate.lanes.find((lane) => lane.lane === gate.correctLane);
      expect(correctEntry?.correct).toBe(true);
      expect(typeof correctEntry?.optionIndex).toBe("number");
      // The two numbers differ, so the choice is real.
      expect(gate.lanes[0].quantity).not.toBe(gate.lanes[1].quantity);
      expect(gate.meta).toBeTruthy();
    }
  });

  it("can also build a three-lane gate when a world asks for it", () => {
    const tracker = new MasteryTracker([]);
    const provider = new AdaptiveGateProvider(new AdaptiveEngine(tracker), new ChallengeFactory(), { gateLanes: 3 });
    for (let round = 0; round < 4; round += 1) {
      const gate = provider.next(round);
      expect(gate.lanes).toHaveLength(3);
      expect(gate.lanes.filter((lane) => lane.correct)).toHaveLength(1);
      expect(gate.lanes[gate.correctLane].correct).toBe(true);
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
    game.showScene("boot");
    expect(root.querySelector('.boot-buddy[data-buddy="aqua"]')).toBeTruthy();
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
    fullscreenSpy.mockClear();
    Object.defineProperty(document, "webkitFullscreenElement", { configurable: true, value: root });
    game.requestFullscreenPlay();
    expect(fullscreenSpy).not.toHaveBeenCalled();
    delete (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
    // Three.js is a lazy chunk now: once the stage lands, the 3D world fills
    // up (runner view build, or at minimum the themed backdrop).
    const stage3d = await game.ensureStage3d();
    for (let i = 0; i < 20 && stage3d.world.children.length <= 2; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(stage3d.world.children.length).toBeGreaterThan(2);
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

  it("shows three personal missions and category-sized free-play choices", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("hub");
    expect(root.querySelectorAll(".daily-mission")).toHaveLength(3);
    expect(new Set([...root.querySelectorAll<HTMLElement>(".daily-mission")].map((card) => card.dataset.dailyMode)).size).toBe(3);
    expect(root.querySelector('.hub-adventure[data-mode="reis"]')).toBeTruthy();
    expect(root.querySelectorAll(".hub-tab")).toHaveLength(5);
    expect(root.querySelectorAll(".hub-card")).toHaveLength(6);

    const visibleModes = new Set<string>();
    for (const tab of root.querySelectorAll<HTMLButtonElement>(".hub-tab")) {
      tab.click();
      root.querySelectorAll<HTMLElement>(".hub-card").forEach((card) => visibleModes.add(card.dataset.mode ?? ""));
    }
    expect(visibleModes).toEqual(new Set(PLAY_MODES.map((mode) => mode.scene)));
    const numberTab = root.querySelector<HTMLButtonElement>('.hub-tab[data-category="getallen"]')!;
    numberTab.click();
    numberTab.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(root.querySelector('.hub-tab[data-category="splitsen"]')?.getAttribute("aria-selected")).toBe("true");
    expect(root.querySelector(".hub-grid")?.getAttribute("role")).toBe("tabpanel");
    expect(root.querySelector(".menu-garage")).toBeTruthy();
  });

  it("awards the daily bonus exactly once and shows completed missions on return", async () => {
    vi.useFakeTimers();
    const now = new Date(2026, 6, 11, 12, 0, 0).getTime();
    vi.setSystemTime(now);
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const plan = game.dailyPlan(now);
    const starsBefore = game.data().progress.stars;

    plan.modeIds.forEach((scene) => game.completeActivity(scene, now));
    expect(game.data().progress.stars).toBe(starsBefore + 10);
    game.completeActivity(plan.modeIds[2], now);
    expect(game.data().progress.stars).toBe(starsBefore + 10);

    game.showScene("hub");
    expect(root.querySelectorAll(".daily-mission.done")).toHaveLength(3);
    expect(root.querySelector(".hub-daily.complete")?.textContent).toContain("Alle missies klaar");
  });

  it("free play: a curriculum mode launched from the hub returns to the hub, journey untouched", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const journeyBefore = game.data().progress.journey.completed.length;

    game.showScene("hub");
    root.querySelector<HTMLButtonElement>('.hub-tab[data-category="lezen"]')!.click();
    root.querySelector<HTMLButtonElement>('.hub-card[data-mode="klankgrot"]')!.click();
    expect(root.querySelector(".klankgrot-play")).toBeTruthy();

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    // The home button reads "Speeltuin" and returns to the hub, not the journey.
    const home = root.querySelector<HTMLButtonElement>(".results-actions .btn.secondary")!;
    expect(home.textContent).toBe("Speeltuin");
    home.click();
    expect(root.querySelector(".hub-scene")).toBeTruthy();
    // Free play does NOT advance the Sterrenreis.
    expect(game.data().progress.journey.completed.length).toBe(journeyBefore);
    vi.useRealTimers();
  });

  it("fills the treasure meter per finished activity and pays out a chest at 3", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    // Fill the meter as three finished activities would.
    expect(game.save.bumpTreasure()).toBe(1);
    expect(game.save.bumpTreasure()).toBe(2);
    expect(game.save.bumpTreasure()).toBe(3);
    expect(game.save.treasureFull()).toBe(true);

    game.showScene("reis");
    // The meter pill shows 3/3 and the chest is spawned.
    expect(root.querySelector<HTMLElement>(".schat-meter")?.dataset.treasureFill).toBe("3");
    const chest = root.querySelector<HTMLButtonElement>(".schat-chest");
    expect(chest).toBeTruthy();

    const starsBefore = game.data().progress.stars;
    chest!.click();
    expect(game.data().progress.stars).toBe(starsBefore + 5);
    expect(game.data().progress.sessionChestFill).toBe(0);
    // Re-clicking pays nothing; a fresh mount shows no chest and an empty meter.
    chest!.click();
    expect(game.data().progress.stars).toBe(starsBefore + 5);
    game.showScene("hub");
    game.showScene("reis");
    expect(root.querySelector(".schat-chest")).toBeNull();
    expect(root.querySelector<HTMLElement>(".schat-meter")?.dataset.treasureFill).toBe("0");
  });

  it("reveals a hero when a treasure chest crosses its star threshold", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.createProfile("Mila", "blitz");
    game.save.award({ stars: 7 });
    game.save.syncStickers();
    game.save.bumpTreasure();
    game.save.bumpTreasure();
    game.save.bumpTreasure();
    game.showScene("reis");

    root.querySelector<HTMLButtonElement>(".schat-chest")!.click();
    vi.advanceTimersByTime(350);

    expect(root.querySelector('.skin-reveal[data-skin="aqua"]')).toBeTruthy();
  });

  it("waits for chest narration before showing its earned hero", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.createProfile("Mila", "blitz");
    game.save.award({ stars: 7 });
    game.save.syncStickers();
    game.save.bumpTreasure();
    game.save.bumpTreasure();
    game.save.bumpTreasure();
    game.showScene("reis");
    const queued: Array<{ text: string; done: () => void; options?: { interrupt?: boolean } }> = [];
    vi.spyOn(game.voice, "speakThen").mockImplementation((text, done, options) => {
      queued.push({ text, done, options });
    });

    const chest = root.querySelector<HTMLButtonElement>(".schat-chest")!;
    chest.click();

    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ text: "Hoera!", options: { interrupt: true } });
    expect(root.querySelector(".skin-reveal")).toBeNull();
    expect(chest.isConnected).toBe(true);

    queued[0].done();
    expect(chest.isConnected).toBe(false);
    expect(root.querySelector('.skin-reveal[data-skin="aqua"]')).toBeTruthy();
  });

  it("does not leak a delayed chest reveal into the next game scene", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.createProfile("Noor", "blitz");
    game.save.award({ stars: 7 });
    game.save.bumpTreasure();
    game.save.bumpTreasure();
    game.save.bumpTreasure();
    game.showScene("reis");

    root.querySelector<HTMLButtonElement>(".schat-chest")!.click();
    game.showScene("count");
    vi.advanceTimersByTime(350);

    expect(root.querySelector(".skin-reveal")).toBeNull();
    expect(root.querySelector(".count-play")).toBeTruthy();
  });

  it("finishing a mini mode fills the treasure meter", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    expect(game.data().progress.sessionChestFill).toBe(0);
    game.showScene("hub");
    root.querySelector<HTMLButtonElement>('.hub-tab[data-category="lezen"]')!.click();
    root.querySelector<HTMLButtonElement>('.hub-card[data-mode="klankgrot"]')!.click();
    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.sessionChestFill).toBe(1);
    expect(root.querySelector<HTMLElement>(".results-treasure")?.dataset.treasureFill).toBe("1");
    expect(root.querySelector(".results-treasure")?.textContent).toContain("1/3 voor je schat");
    vi.useRealTimers();
  });

  it("prioritizes opening a full treasure chest over another daily mission", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.bumpTreasure();
    game.save.bumpTreasure();

    game.showScene("klankgrot");
    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }

    expect(game.data().progress.sessionChestFill).toBe(3);
    expect(root.querySelector(".results-treasure.ready")?.textContent).toContain("Schatkist klaar");
    expect(root.querySelector(".results-next-mission")).toBeNull();
    const open = root.querySelector<HTMLButtonElement>(".results-open-treasure");
    expect(open).toBeTruthy();
    open!.click();
    expect(root.querySelector(".hub-scene")).toBeTruthy();
    expect(root.querySelector(".schat-chest")).toBeTruthy();
    vi.useRealTimers();
  });

  it("unboxes a new sticker with a full-screen reveal", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const { showStickerReveal } = await import("../src/scenes/minigames/miniUi");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const speak = vi.spyOn(game.voice, "speak");
    const cancel = vi.spyOn(game.voice, "cancel");

    expect(showStickerReveal(root, game, [])).toBeNull();
    const overlay = showStickerReveal(root, game, [{ emoji: "🦕", name: "Dino ster" }])!;
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(document.activeElement).toBe(overlay);
    expect(overlay.querySelector(".sticker-reveal-gift")).toBeTruthy();
    expect(overlay.textContent).toContain("Dino ster");
    expect(speak).toHaveBeenCalledWith("Je verdiende een nieuwe sticker: Dino ster!", expect.objectContaining({ interrupt: true }));
    // The gift auto-opens into the sticker...
    vi.advanceTimersByTime(700);
    expect(overlay.classList.contains("open")).toBe(true);
    // ...and a tap dismisses it.
    overlay.click();
    expect(cancel).toHaveBeenCalled();
    expect(root.querySelector(".sticker-reveal")).toBeNull();
    vi.useRealTimers();
  });

  it("evolves Buddy with stars: levels, stacking accessories, and a one-time level-up moment", async () => {
    const { BUDDY_LEVELS, buddyLevel, createBuddy } = await import("../src/scenes/buddy");
    const { skinById } = await import("../src/runner/skins");

    // Thresholds resolve to the right level.
    expect(buddyLevel(0).level).toBe(1);
    expect(buddyLevel(24).level).toBe(1);
    expect(buddyLevel(25).level).toBe(2);
    expect(buddyLevel(60).level).toBe(3);
    expect(buddyLevel(120).level).toBe(4);
    expect(buddyLevel(999).level).toBe(5);
    expect(BUDDY_LEVELS).toHaveLength(5);

    // Accessories stack as Buddy grows.
    const baby = createBuddy(skinById("blitz"), 0);
    expect(baby.el.querySelector(".buddy-acc")).toBeNull();
    const cool = createBuddy(skinById("blitz"), 30);
    expect(cool.el.querySelector(".buddy-acc-scarf")).toBeTruthy();
    expect(cool.el.querySelector(".buddy-acc-cape")).toBeNull();
    const koning = createBuddy(skinById("blitz"), 150);
    expect(koning.el.querySelector(".buddy-acc-scarf")).toBeTruthy();
    expect(koning.el.querySelector(".buddy-acc-cape")).toBeTruthy();
    expect(koning.el.querySelector(".buddy-acc-crown")).toBeTruthy();
    expect(koning.el.querySelector(".buddy-acc-stars")).toBeNull();
    const ster = createBuddy(skinById("blitz"), 300);
    expect(ster.el.querySelector(".buddy-acc-stars")).toBeTruthy();

    // Crossing a threshold triggers the level-up moment exactly once.
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.award({ stars: 30 });
    game.showScene("reis");
    expect(root.querySelector(".buddy-levelup")).toBeNull();
    root.querySelector<HTMLButtonElement>(".reis-story-start")!.click();
    const overlay = root.querySelector<HTMLElement>(".buddy-levelup");
    expect(overlay).toBeTruthy();
    expect(overlay!.textContent).toContain("Coole dino");
    expect(game.data().progress.buddyLevelSeen).toBe(2);
    overlay!.click();
    expect(root.querySelector(".buddy-levelup")).toBeNull();
    game.showScene("hub");
    game.showScene("reis");
    expect(root.querySelector(".buddy-levelup")).toBeNull();
    // The map buddy now wears its scarf.
    expect(root.querySelector(".reis-buddy .buddy-acc-scarf")).toBeTruthy();
  });

  it("serializes Hub level-up and hero unlock instead of stacking reward modals", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const speak = vi.spyOn(game.voice, "speak");
    game.save.award({ stars: 30 });

    game.showScene("hub");

    const level = root.querySelector<HTMLElement>(".buddy-levelup");
    expect(level).toBeTruthy();
    expect(level?.getAttribute("role")).toBe("dialog");
    expect(root.querySelector(".skin-reveal")).toBeNull();
    expect(speak.mock.calls.map((call) => call[0])).toEqual(["Buddy groeit! Coole dino!"]);
    expect(speak.mock.calls[0]?.[1]).toMatchObject({ interrupt: false });

    level!.click();
    expect(root.querySelector(".buddy-levelup")).toBeNull();
    expect(root.querySelector('.skin-reveal[data-skin="aqua"]')).toBeTruthy();
    expect(speak.mock.calls.at(-1)?.[0]).toBe("Aqua");

    root.querySelector<HTMLButtonElement>(".skin-reveal-later")!.click();
    expect(root.querySelector('.skin-reveal[data-skin="web"]')).toBeTruthy();
    expect(speak.mock.calls.map((call) => call[0])).toEqual(["Buddy groeit! Coole dino!", "Aqua", "Web"]);

    root.querySelector<HTMLButtonElement>(".skin-reveal-later")!.click();
    expect(root.querySelector(".skin-reveal")).toBeNull();
    expect(speak.mock.calls.map((call) => call[0])).toEqual(["Buddy groeit! Coole dino!", "Aqua", "Web", "Hoi! Wat gaan we spelen?"]);
  });

  it("plays map return, region welcome and Buddy growth in a strict sequence", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const grasland = JOURNEY.filter((node) => node.regionId === "grasland").map((node) => node.id);
    game.save.updateProgress((progress) => {
      progress.stars = 30;
      progress.journey.completed = grasland;
      progress.journey.nodeIndex = frontierIndex(grasland);
    });
    const queued: Array<{ text: string; done: () => void; options?: { interrupt?: boolean } }> = [];
    vi.spyOn(game.voice, "speakThen").mockImplementation((text, done, options) => {
      queued.push({ text, done, options });
    });
    const speak = vi.spyOn(game.voice, "speak");

    game.showScene("reis");

    expect(queued).toHaveLength(1);
    expect(queued[0].text).toBe("Verder met de reis! Waar gaan we heen?");
    expect(queued[0].options).toMatchObject({ interrupt: true });
    expect(root.querySelector(".buddy-levelup")).toBeNull();

    queued[0].done();
    expect(queued).toHaveLength(2);
    expect(queued[1].text).toContain("Welkom in Muntgrot!");
    expect(queued[1].options).toMatchObject({ interrupt: false });
    expect(root.querySelector(".buddy-levelup")).toBeNull();

    queued[1].done();
    expect(root.querySelector(".buddy-levelup")).toBeTruthy();
    expect(speak).toHaveBeenCalledWith("Buddy groeit! Coole dino!", expect.objectContaining({ interrupt: false }));
  });

  it("golden bonus rounds glitter and pay double stars", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    // Force golden: random 0 => every round after the first goes golden.
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    game.showScene("hub");
    root.querySelector<HTMLButtonElement>('.hub-tab[data-category="lezen"]')!.click();
    root.querySelector<HTMLButtonElement>('.hub-card[data-mode="klankgrot"]')!.click();
    // Round 1 is never golden.
    expect(root.querySelector(".mini-golden-banner")).toBeNull();
    root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="true"]')!.click();
    vi.advanceTimersByTime(1100);
    // Round 2 IS golden: banner + double payout on a correct tap.
    expect(root.querySelector(".mini-golden-banner")).toBeTruthy();
    expect(root.querySelector(".mini-scene.golden-round")).toBeTruthy();
    const starsBefore = game.data().progress.stars;
    root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="true"]')!.click();
    expect(game.data().progress.stars).toBe(starsBefore + 2);
    randomSpy.mockRestore();
    vi.useRealTimers();
  });

  it("paints the adventure road: healing veils, a golden trail, and region gates", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    // Fresh journey: every region sleeps under a veil, no trail yet.
    game.showScene("reis");
    let veils = [...root.querySelectorAll<SVGRectElement>(".reis-band-veil")];
    expect(veils).toHaveLength(6);
    expect(veils.every((veil) => Number(veil.dataset.completion) === 0)).toBe(true);
    expect(root.querySelector(".reis-road-trail")).toBeNull();
    // One portal arch at every world border, all still asleep (grey) and all
    // showing their world's name plate.
    let gates = [...root.querySelectorAll<SVGGElement>(".reis-region-gate")];
    expect(gates).toHaveLength(5);
    expect(gates.every((gate) => !gate.classList.contains("awake"))).toBe(true);
    expect(gates.every((gate) => gate.querySelector("text") !== null)).toBe(true);
    // Nothing lives in a sleeping world yet.
    expect(root.querySelectorAll(".reis-life")).toHaveLength(0);

    // Complete the whole first region: its veil lifts and the trail appears.
    const graslandNodes = JOURNEY.filter((node) => node.regionId === "grasland");
    game.save.updateProgress((progress) => {
      progress.journey.completed = graslandNodes.map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });
    game.showScene("hub");
    game.showScene("reis");
    veils = [...root.querySelectorAll<SVGRectElement>(".reis-band-veil")];
    const grasland = veils.find((veil) => veil.dataset.region === "grasland")!;
    expect(Number(grasland.dataset.completion)).toBe(1);
    expect(grasland.getAttribute("opacity")).toBe("0.00");
    const muntgrot = veils.find((veil) => veil.dataset.region === "muntgrot")!;
    expect(Number(muntgrot.dataset.completion)).toBe(0);
    const trail = root.querySelector<SVGPathElement>(".reis-road-trail")!;
    expect(trail).toBeTruthy();
    expect(Number(trail.dataset.progress)).toBeGreaterThan(0);
    expect(Number(trail.dataset.progress)).toBeLessThan(50);
    // Buddy now stands on muntgrot's doorstep: that gate woke up (colour) but
    // hides its name plate so the "volgende stap" label never covers it.
    gates = [...root.querySelectorAll<SVGGElement>(".reis-region-gate")];
    const muntgrotGate = gates.find((gate) => gate.dataset.region === "muntgrot")!;
    expect(muntgrotGate.classList.contains("awake")).toBe(true);
    expect(muntgrotGate.querySelector("text")).toBeNull();
    const ijsbaanGate = gates.find((gate) => gate.dataset.region === "ijsbaan")!;
    expect(ijsbaanGate.classList.contains("awake")).toBe(false);
    expect(ijsbaanGate.querySelector("text")!.textContent).toContain("IJsbaan");
    // The healed grasland has come alive: animated critters, only there —
    // and the rescued friend wanders around its home spot.
    const life = [...root.querySelectorAll<SVGGElement>(".reis-life")];
    expect(life).toHaveLength(1);
    expect(life[0].dataset.region).toBe("grasland");
    expect(life[0].querySelectorAll(".reis-life-piece").length).toBeGreaterThan(4);
    expect(life[0].querySelector(".life-wander text")?.textContent).toBe("🐰");
  });

  it("celebrates finishing a region live: the veil sweeps away and the border gate pops", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const graslandNodes = JOURNEY.filter((node) => node.regionId === "grasland");
    game.save.updateProgress((progress) => {
      progress.journey.completed = graslandNodes.map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });
    // Arriving back from the region's final activity triggers the celebration.
    game.lastJourneyNode = graslandNodes[graslandNodes.length - 1].id;
    game.showScene("reis");

    // The veil is re-lifted for the live sweep, then falls to clear.
    const veil = root.querySelector<SVGRectElement>('.reis-band-veil[data-region="grasland"]')!;
    expect(veil.getAttribute("opacity")).toBe("0.44");
    vi.advanceTimersByTime(120);
    expect(veil.getAttribute("opacity")).toBe("0.00");

    // Buddy walks across the border: the muntgrot gate pops shortly after.
    vi.advanceTimersByTime(800);
    const gate = root.querySelector<SVGGElement>('.reis-region-gate[data-region="muntgrot"]')!;
    expect(gate.classList.contains("passing")).toBe(true);
    vi.useRealTimers();
  });

  it("offers a daily gift chest on the map, once per day", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("reis");
    const chest = root.querySelector<HTMLButtonElement>(".reis-chest");
    expect(chest).toBeTruthy();

    const starsBefore = game.data().progress.stars;
    chest!.click();
    expect(game.data().progress.stars).toBe(starsBefore + 3);
    // Same day: no second chest, and re-clicking pays nothing.
    chest!.click();
    expect(game.data().progress.stars).toBe(starsBefore + 3);
    game.showScene("hub");
    game.showScene("reis");
    expect(root.querySelector(".reis-chest")).toBeNull();
    // The chest also appears in free-play (hub), not only on the map.
    game.save.updateProgress((p) => (p.dailyChestDay = ""));
    game.showScene("hub");
    expect(root.querySelector(".reis-chest")).toBeTruthy();
  });

  it("grows a come-back-tomorrow day streak with a scaling reward", async () => {
    const { SaveManager } = await import("../src/game/SaveManager");
    const save = new SaveManager();
    expect(save.dayStreak()).toEqual({ count: 0, best: 0, lastDay: "" });

    // Day 1: streak starts at 1, base +3 reward.
    let stars = save.getData().progress.stars;
    expect(save.claimDailyChest("2026-07-08")).toBe(true);
    expect(save.dayStreak()).toEqual({ count: 1, best: 1, lastDay: "2026-07-08" });
    // Consecutive day: streak 2, reward grows to +4.
    expect(save.claimDailyChest("2026-07-09")).toBe(true);
    expect(save.dayStreak().count).toBe(2);
    // A gap resets the count to 1 but keeps the best (no shaming).
    expect(save.claimDailyChest("2026-07-20")).toBe(true);
    expect(save.dayStreak()).toEqual({ count: 1, best: 2, lastDay: "2026-07-20" });
    // Same day twice pays nothing / does not bump.
    expect(save.claimDailyChest("2026-07-20")).toBe(false);
    expect(save.dayStreak().count).toBe(1);
    void stars;
  });

  it("makes De Sterrenreis the default adventure and advances after a story activity", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    // A returning child confirms the personal sign before the journey opens.
    game.save.createProfile("Test", "blitz");

    game.showScene("boot");
    vi.advanceTimersByTime(750);
    expect(root.querySelector(".reis-scene")).toBeFalsy();
    expect(root.querySelector(".splash-panel")).toBeTruthy();
    root.querySelector<HTMLButtonElement>('.boot-sign[data-correct="true"]')!.click();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
    expect(root.querySelectorAll(".reis-node")).toHaveLength(JOURNEY.length);
    expect(root.querySelectorAll(".reis-node.now")).toHaveLength(1);
    expect(root.querySelector(".reis-buddy")).toBeTruthy();
    expect(root.querySelector(".reis-quest")).toBeTruthy();
    expect(root.querySelector(".reis-progress-pill")?.textContent).toContain("1/");
    expect(root.querySelector(".reis-quest")?.textContent).toContain(journeyNodeTitle(JOURNEY[0]));
    expect(root.querySelector(".reis-quest")?.textContent).toContain(journeyNodeAction(JOURNEY[0]));

    const firstNode = JOURNEY[0];
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${firstNode.id}"]`)!.click();
    expect(game.lastJourneyNode).toBe(firstNode.id);
    expect(root.querySelector(".mini-header")).toBeTruthy();

    for (let r = 0; r < 15 && !root.querySelector(".mini-done"); r += 1) {
      countEveryAnimal(root);
      root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]')!.click();
      vi.advanceTimersByTime(1100);
    }

    expect(game.data().progress.journey.completed).toContain(firstNode.id);
    expect(root.querySelector<HTMLButtonElement>('.results-actions .btn.secondary')?.textContent).toBe("Verder");
    root.querySelector<HTMLButtonElement>('.results-actions .btn.secondary')!.click();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
    expect(root.querySelector(`.reis-node.done[data-node="${firstNode.id}"]`)).toBeTruthy();
    expect(root.querySelector(`.reis-node.now[data-node="${JOURNEY[1].id}"]`)).toBeTruthy();
    expect(root.querySelector(".reis-region-banner")?.textContent).toContain("Welkom in Grasland!");
  });

  it("has a story beat for every region and every rescued friend", () => {
    const regions = new Set(JOURNEY.map((node) => node.regionId));
    for (const region of regions) {
      expect(REGION_STORY[region], `region story for ${region}`).toBeTruthy();
    }
    for (const friend of FRIENDS) {
      expect(FRIEND_STORY[friend.id], `friend story for ${friend.id}`).toBeTruthy();
    }
  });

  it("keeps clock reading late in the first-grade learning spiral", () => {
    const stops = JOURNEY.filter((node) => node.kind === "stop");
    const indexOf = (scene: string) => stops.findIndex((node) => node.scene === scene);
    expect(JOURNEY.find((node) => node.scene === "kloktoren")?.regionId).toBe("sterrenrace");
    expect(indexOf("kloktoren")).toBeGreaterThan(indexOf("getallenlijn"));
    expect(indexOf("kloktoren")).toBeGreaterThan(indexOf("tienbrug"));
    expect(indexOf("kloktoren")).toBeGreaterThan(indexOf("zoemroute"));
  });

  it("guards every region's friend with a boss that has a name and a defeat line", () => {
    const bossNodes = JOURNEY.filter((node) => node.kind === "boss");
    const regions = [...new Set(JOURNEY.map((node) => node.regionId))];
    expect(bossNodes).toHaveLength(regions.length);
    for (const node of bossNodes) {
      const boss = BOSSES[node.regionId];
      expect(boss?.name, `boss name for ${node.regionId}`).toBeTruthy();
      expect(boss?.defeat, `defeat line for ${node.regionId}`).toBeTruthy();
      expect(node.scene).toBe("boss");
      // The boss sits between the region's gate and its friend.
      const index = JOURNEY.indexOf(node);
      expect(JOURNEY[index - 1]?.kind).toBe("gate");
      expect(JOURNEY[index + 1]?.kind).toBe("friend");
    }
  });

  it("draws a distinct SVG monster for every boss region", async () => {
    const { buildBossArt } = await import("../src/scenes/bossArt");
    const regions = [...new Set(JOURNEY.filter((node) => node.kind === "boss").map((node) => node.regionId))];
    const svgs = regions.map((region) => buildBossArt(region));
    regions.forEach((region, i) => {
      expect(svgs[i]).toContain("<svg");
      expect(svgs[i]).toContain(`data-boss="${region}"`);
    });
    // No two bosses share the same monster art.
    expect(new Set(svgs).size).toBe(regions.length);
  });

  it("back-fills a pre-boss save to a clean linear prefix (no jumping backwards)", () => {
    // A returning save whose furthest done node is a region's friend...
    const friendIndex = JOURNEY.findIndex((node) => node.kind === "friend");
    const stale = JOURNEY.slice(0, friendIndex + 1)
      .filter((node) => node.kind !== "boss") // ...predates the inserted bosses.
      .map((node) => node.id);
    const repaired = backfillCompleted(stale);
    // Everything up to and including that friend is now marked done — including
    // the boss that was inserted earlier — so the frontier moves forward, not back.
    expect(repaired).toEqual(JOURNEY.slice(0, friendIndex + 1).map((node) => node.id));
    expect(frontierIndex(repaired)).toBe(friendIndex + 1);
  });

  it("opens a brand-new journey with a playable micro-cinematic", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("reis");
    const overlay = root.querySelector<HTMLElement>(".reis-story-overlay");
    expect(overlay).toBeTruthy();
    expect(root.querySelector(".reis-region-banner")).toBeNull();
    expect(overlay?.textContent).toContain(JOURNEY_INTRO.title);
    expect(overlay?.textContent).toContain(JOURNEY_INTRO.lines[0]);
    // Three visual beats: star falls -> colours drain -> Buddy catches it.
    const stage = root.querySelector<HTMLElement>(".reis-cine")!;
    expect(stage.dataset.beat).toBe("1");
    overlay!.click();
    expect(stage.dataset.beat).toBe("2");
    overlay!.click();
    expect(stage.dataset.beat).toBe("3");
    const start = root.querySelector<HTMLButtonElement>(".reis-story-start");
    expect(start?.textContent).toBe(JOURNEY_INTRO.start);
    start!.click();
    expect(root.querySelector(".reis-story-overlay")).toBeNull();
    expect(root.querySelector(".reis-region-banner")).toBeNull();
    // The map itself is still there underneath the story.
    expect(root.querySelector(".reis-quest")).toBeTruthy();
  });

  it("does not re-show the story card once the journey has begun", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.updateProgress((progress) => {
      progress.journey.completed = [JOURNEY[0].id];
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });
    game.showScene("reis");
    expect(root.querySelector(".reis-story-overlay")).toBeNull();
  });

  it("advances story runner gates, friend rescues, and the final star", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const fullscreenSpy = vi.fn(() => Promise.resolve());
    Object.defineProperty(root, "requestFullscreen", { value: fullscreenSpy, configurable: true });

    const gateIndex = JOURNEY.findIndex((node) => node.kind === "gate");
    const gate = JOURNEY[gateIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, gateIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    expect(root.querySelector(`.reis-node.now[data-node="${gate.id}"]`)).toBeTruthy();
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${gate.id}"]`)!.click();
    expect(fullscreenSpy).toHaveBeenCalled();
    expect(root.querySelector(".run-scene")).toBeTruthy();

    for (let i = 0; i < 8000 && !root.querySelector(".results-card"); i += 1) {
      game.scenes.update(0.05);
    }
    expect(root.querySelector(".results-card")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(gate.id);
    root.querySelector<HTMLButtonElement>(".results-actions .play-now")!.click();

    // The region boss now guards the friend; its full fight is covered in its own
    // test, so here just confirm it's the next frontier, then skip past it.
    const boss = JOURNEY[gateIndex + 1];
    expect(boss.kind).toBe("boss");
    expect(root.querySelector(`.reis-node.now[data-node="${boss.id}"]`)).toBeTruthy();
    game.save.advanceJourney(boss.id);

    const friend = JOURNEY[gateIndex + 2];
    expect(friend.kind).toBe("friend");
    game.showScene("reis");
    expect(root.querySelector(`.reis-node.now[data-node="${friend.id}"]`)).toBeTruthy();
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${friend.id}"]`)!.click();
    expect(game.data().progress.journey.completed).toContain(friend.id);
    expect(root.querySelector(`.reis-friend.has[data-friend="${friend.friendId}"]`)).toBeTruthy();

    const star = JOURNEY[JOURNEY.length - 1];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, -1).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });
    game.showScene("reis");
    expect(root.querySelector(`.reis-node.now[data-node="${star.id}"]`)).toBeTruthy();
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${star.id}"]`)!.click();
    expect(game.save.journeyComplete()).toBe(true);
    expect(root.querySelector(".finale-overlay")).toBeTruthy();
    root.querySelector<HTMLButtonElement>(".finale-done")!.click();
    expect(root.querySelector(".reis-progress-pill")?.textContent).toContain("Ster thuis");
  });

  it("mini-games share the juice pack: tile entrances, flying stars and fever streaks", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("getallenlijn");
    // Every answer tile pops in with its own staggered delay.
    const tiles = [...root.querySelectorAll<HTMLButtonElement>(".mini-choices button")];
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles.every((tile) => tile.classList.contains("tile-in"))).toBe(true);
    expect(tiles[1].style.animationDelay).not.toBe(tiles[0].style.animationDelay);

    // Three correct answers in a row: stars fly to the dots, then fever mode.
    for (let i = 0; i < 3; i += 1) {
      root.querySelector<HTMLButtonElement>('.getallenlijn-choice[data-correct="true"]')!.click();
      expect(root.querySelector(".mini-star-fly")).toBeTruthy();
      if (i === 0) {
        // Signature moment: the gap fills and the star slides down the line.
        expect(root.querySelector(".getallenlijn-cell.landed")).toBeTruthy();
        expect(root.querySelector(".getallenlijn-slider")).toBeTruthy();
      }
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-scene.mini-fever")).toBeTruthy();

    // A wrong answer breaks the fever.
    root.querySelector<HTMLButtonElement>('.getallenlijn-choice[data-correct="false"]')!.click();
    expect(root.querySelector(".mini-scene.mini-fever")).toBeNull();
    vi.useRealTimers();
  });

  it("ends the journey with a full-screen star-home cinematic", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, -1).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });
    game.showScene("reis");
    root.querySelector<HTMLButtonElement>('.reis-node[data-kind="star"]')!.click();

    const overlay = root.querySelector<HTMLElement>(".finale-overlay")!;
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector(".finale-title")!.textContent).toContain("thuis");
    // Every rescued friend hops along in the parade, and the line counts them.
    expect(overlay.querySelectorAll(".finale-friend")).toHaveLength(6);
    expect(overlay.querySelector(".finale-line")!.textContent).toContain("6 vriendjes");
    expect(overlay.querySelectorAll(".finale-spark").length).toBeGreaterThan(4);

    // "Hoera!" closes the show; the map beneath is fully healed and alive.
    overlay.querySelector<HTMLButtonElement>(".finale-done")!.click();
    expect(root.querySelector(".finale-overlay")).toBeNull();
    expect(game.save.journeyComplete()).toBe(true);
    expect([...root.querySelectorAll<SVGRectElement>(".reis-band-veil")].every((veil) => veil.getAttribute("opacity") === "0.00")).toBe(
      true
    );
    expect(root.querySelectorAll(".reis-life")).toHaveLength(6);
  });

  it("continues the path after the finale: a new Sterrenronde, harder and tailored", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    // Fresh save plays round 1 at tier 1 (start of the path, no mastery yet).
    expect(game.save.journeyRound()).toBe(1);
    expect(game.difficultyTier()).toBe(1);

    // Bring the star home, then choose "Nog een reis!".
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, -1).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });
    game.showScene("reis");
    const starsBefore = game.data().progress.stars;
    root.querySelector<HTMLButtonElement>('.reis-node[data-kind="star"]')!.click();
    root.querySelector<HTMLButtonElement>(".finale-next-round")!.click();

    // The path continues: round 2, road reset, world asleep again — but
    // everything earned stays.
    expect(game.save.journeyRound()).toBe(2);
    expect(game.data().progress.journey.completed).toHaveLength(0);
    expect(game.data().progress.stars).toBeGreaterThanOrEqual(starsBefore);
    const veils = [...root.querySelectorAll<SVGRectElement>(".reis-band-veil")];
    expect(veils.every((veil) => Number(veil.dataset.completion) === 0)).toBe(true);
    expect(root.querySelector(".reis-progress-pill")?.textContent).toContain("R2");
    // Friendships survive the round reset: the meadow keeps all six friends.
    expect(root.querySelectorAll(".reis-friend.has")).toHaveLength(6);
    // Round 2 raises the difficulty tier for every mode.
    expect(game.difficultyTier()).toBe(2);
    // The round-2 story card frames the new journey.
    game.showScene("hub");
    game.showScene("reis");
    expect(root.querySelector(".reis-story-card h2")?.textContent).toContain("Sterrenronde 2");
  });

  it("Sterrenarena boss rush: unlocks at journey end and chains all six bosses to a champion screen", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    // Locked until the star is home.
    game.showScene("hub");
    expect(root.querySelector('[data-mode="bossRush"]')).toBeNull();

    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });
    expect(game.save.journeyComplete()).toBe(true);
    game.showScene("hub");
    expect(root.querySelector('[data-mode="bossRush"]')).toBeTruthy();

    // Enter the gauntlet: the first boss arena is up.
    game.showScene("bossRush");
    expect(root.querySelector(".boss-arena")).toBeTruthy();
    const starsBefore = game.data().progress.stars;

    // Beat every boss back-to-back; only the final champion screen is a .mini-done.
    for (let i = 0; i < 120 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.boss-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }

    const done = root.querySelector(".mini-done");
    expect(done).toBeTruthy();
    expect(done?.textContent).toContain("Sterrenarena");
    // A champion bonus lands on top of the per-hit rewards.
    expect(game.data().progress.stars).toBeGreaterThan(starsBefore + 6);
    vi.useRealTimers();
  });

  it("fights and defeats a region boss, then frees the trapped friend", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const bossIndex = JOURNEY.findIndex((node) => node.kind === "boss");
    const boss = JOURNEY[bossIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, bossIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    expect(root.querySelector(`.reis-node.now[data-node="${boss.id}"]`)).toBeTruthy();
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${boss.id}"]`)!.click();
    // The boss arena is up with a full health bar.
    expect(root.querySelector(".boss-arena")).toBeTruthy();
    expect(root.querySelectorAll(".boss-heart").length).toBeGreaterThan(0);

    // Land enough correct hits to drain the boss (each correct answer is a hit).
    for (let i = 0; i < 12 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.boss-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }

    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(boss.id);
    // Beating the boss makes the friend it guarded the next frontier.
    const friend = JOURNEY[bossIndex + 1];
    expect(friend.kind).toBe("friend");
    expect(game.data().progress.journey.nodeIndex).toBe(bossIndex + 1);
    vi.useRealTimers();
  });

  it("plays the Splitbord rekenbordje from the journey: a wrong tap scaffolds, finishing advances", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const sbIndex = JOURNEY.findIndex((node) => node.scene === "splitbord");
    const sb = JOURNEY[sbIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, sbIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${sb.id}"]`)!.click();
    expect(root.querySelector(".splitbord-board")).toBeTruthy();

    // A wrong tap teaches (scaffold) instead of failing, and does not finish.
    const wrong = root.querySelector<HTMLButtonElement>('.splitbord-choice[data-correct="false"]');
    if (wrong) {
      wrong.click();
      expect(root.querySelector(".mini-scaffold")).toBeTruthy();
    }
    expect(root.querySelector(".mini-done")).toBeNull();

    // Finish by always tapping the correct split.
    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.splitbord-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(sb.id);
    // Logged as splitbord-* under the existing partwhole skill for the dashboard.
    expect(game.mastery.getAttempts().some((a) => a.challengeType.startsWith("splitbord-"))).toBe(true);
    vi.useRealTimers();
  });

  it("plays Klankgrot from the journey: emoji choices, a wrong tap reveals, finishing advances + logs reading", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const kgIndex = JOURNEY.findIndex((node) => node.scene === "klankgrot");
    const kg = JOURNEY[kgIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, kgIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${kg.id}"]`)!.click();
    expect(root.querySelector(".klankgrot-play")).toBeTruthy();
    expect(root.querySelectorAll(".klankgrot-choice")).toHaveLength(3);

    // A wrong tap reveals the right picture (auditory re-teach), and does not finish.
    const wrong = root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="false"]');
    if (wrong) {
      wrong.click();
      expect(root.querySelector(".klankgrot-choice.reveal")).toBeTruthy();
    }
    expect(root.querySelector(".mini-done")).toBeNull();

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(kg.id);
    // Logged as a reading (literacy-phonemic) attempt for the dashboard.
    expect(game.mastery.getAttempts().some((a) => a.domain === "literacy-phonemic")).toBe(true);
    vi.useRealTimers();
  });

  it("keeps sticker, hero and completion narration aligned with the visible reward", async () => {
    const { Game } = await import("../src/game/Game");
    const { skinById } = await import("../src/runner/skins");
    const { showActivityRewards } = await import("../src/scenes/minigames/miniUi");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const speak = vi.spyOn(game.voice, "speak");

    showActivityRewards(root, game, {
      completionLine: "Goed gedaan!",
      stickers: [{ emoji: "⭐", name: "Dino ster" }],
      skins: [skinById("aqua")]
    });

    expect(root.querySelector(".sticker-reveal")?.textContent).toContain("Dino ster");
    expect(root.querySelector(".skin-reveal")).toBeNull();
    expect(speak.mock.calls.map((call) => call[0])).toEqual(["Je verdiende een nieuwe sticker: Dino ster!"]);

    root.querySelector<HTMLElement>(".sticker-reveal")!.click();
    expect(root.querySelector('.skin-reveal[data-skin="aqua"]')).toBeTruthy();
    expect(speak.mock.calls.map((call) => call[0])).toEqual(["Je verdiende een nieuwe sticker: Dino ster!", "Aqua"]);

    root.querySelector<HTMLButtonElement>(".skin-reveal-later")!.click();
    expect(root.querySelector(".skin-reveal")).toBeNull();
    expect(speak.mock.calls.map((call) => call[0])).toEqual(["Je verdiende een nieuwe sticker: Dino ster!", "Aqua", "Goed gedaan!"]);
  });

  it("checks a real completed mode off on its mission result screen", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const dayKey = game.dailyPlan().dayKey;
    game.save.updateProgress((progress) => {
      progress.dailyPlan = {
        dayKey,
        modeIds: ["klankgrot", "count", "vormenburcht"],
        completedModeIds: [],
        rewardClaimed: false
      };
    });

    game.showScene("hub");
    root.querySelector<HTMLButtonElement>('.hub-tab[data-category="lezen"]')!.click();
    root.querySelector<HTMLButtonElement>('.hub-card[data-mode="klankgrot"]')!.click();
    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.klankgrot-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }

    expect(root.querySelector(".results-unlock.daily")?.textContent).toContain("Missie 1/3 klaar");
    expect(game.data().progress.dailyPlan.completedModeIds).toEqual(["klankgrot"]);
    expect(game.data().progress.activityHistory.at(-1)).toMatchObject({ sceneId: "klankgrot", inJourney: false });
    const next = root.querySelector<HTMLButtonElement>('.results-next-mission[data-next-mission="count"]');
    expect(next?.textContent).toContain("Tel mee");
    const sessionBefore = game.data().progress.sessionId;
    expect(game.data().progress.sessions.find((session) => session.id === sessionBefore)?.endedAt).toBeTypeOf("number");
    next!.click();
    expect(root.querySelector(".count-play")).toBeTruthy();
    expect(game.data().progress.sessionId).not.toBe(sessionBefore);
    vi.useRealTimers();
  });

  it("auto-serves a real minimal-pair duel after the same sound confusion repeats", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    for (const responseKey of ["peer", "pen"]) {
      game.recordCurriculumAttempt(
        buildCurriculumAttempt({
          sessionId: game.save.getMutableData().progress.sessionId,
          domain: "literacy-phonemic",
          skill: "soundDiscriminate",
          targetKey: "begin-b",
          rangeKey: "phonics",
          stimulusKey: "b",
          responseKey,
          wasCorrect: false,
          reactionTimeMs: 500,
          hintUsed: false,
          errorType: "first-sound-weak"
        })
      );
    }

    const speak = vi.spyOn(game.voice, "speak");
    game.showScene("klankgrot");
    expect(root.querySelectorAll(".klankgrot-choice.minimal-pair")).toHaveLength(2);
    expect(root.querySelector(".mini-instruction")?.textContent).toContain("Welk woord hoor je");
    expect(speak.mock.calls[0]?.[0]).toBe("Welk woord hoor je? Tik op het plaatje.");
    expect(["beer", "peer"]).toContain(speak.mock.calls[1]?.[0]);
    expect(speak.mock.calls[1]?.[1]).toMatchObject({ interrupt: false });
    expect(game.mastery.getAttempts()).toHaveLength(2);
  });

  it("plays Rijmrivier from the journey and logs rhyme mastery", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const index = JOURNEY.findIndex((node) => node.scene === "rijmspel");
    const node = JOURNEY[index];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, index).map((item) => item.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${node.id}"]`)!.click();
    expect(root.querySelector(".rhyme-river")).toBeTruthy();
    expect(root.querySelectorAll(".rhyme-choice")).toHaveLength(2);
    for (let round = 0; round < 24 && !root.querySelector(".mini-done"); round += 1) {
      root.querySelector<HTMLButtonElement>('.rhyme-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(node.id);
    expect(game.mastery.getAttempts().some((attempt) => attempt.skill === "rhyme")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Letterkompas from the journey: finishing advances + logs letter-sound work", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const lkIndex = JOURNEY.findIndex((node) => node.scene === "letterkompas");
    const lk = JOURNEY[lkIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, lkIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${lk.id}"]`)!.click();
    expect(root.querySelector(".letterkompas-play")).toBeTruthy();
    expect(root.querySelectorAll(".letterkompas-choice")).toHaveLength(2);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.letterkompas-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(lk.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "literacy-reading")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Schrijfspoor from the journey with real pointer strokes and logs letter formation", async () => {
    vi.useFakeTimers();
    const [{ Game }, { traceGuide }] = await Promise.all([
      import("../src/game/Game"),
      import("../src/education/literacy/tracing")
    ]);
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const traceIndex = JOURNEY.findIndex((node) => node.scene === "schrijfspoor");
    const traceNode = JOURNEY[traceIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, traceIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${traceNode.id}"]`)!.click();
    expect(root.querySelector(".schrijfspoor-board")).toBeTruthy();

    const pointer = (type: string, x: number, y: number, pointerId: number): MouseEvent => {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
      Object.defineProperty(event, "pointerId", { value: pointerId });
      return event;
    };

    for (let round = 0; round < 8 && !root.querySelector(".mini-done"); round += 1) {
      const board = root.querySelector<HTMLElement>(".schrijfspoor-board")!;
      const grapheme = board.dataset.grapheme!;
      const svg = board.querySelector<SVGSVGElement>(".schrijfspoor-surface")!;
      vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 220,
        bottom: 180,
        width: 220,
        height: 180,
        toJSON: () => ({})
      });
      traceGuide(grapheme).strokes.forEach((stroke, strokeIndex) => {
        const pointerId = strokeIndex + 1;
        svg.dispatchEvent(pointer("pointerdown", stroke[0].x, stroke[0].y, pointerId));
        stroke.slice(1).forEach((point) => svg.dispatchEvent(pointer("pointermove", point.x, point.y, pointerId)));
        const end = stroke[stroke.length - 1];
        svg.dispatchEvent(pointer("pointerup", end.x, end.y, pointerId));
      });
      root.querySelector<HTMLButtonElement>(".schrijfspoor-check")!.click();
      vi.advanceTimersByTime(1100);
    }

    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(traceNode.id);
    expect(game.mastery.getAttempts().filter((attempt) => attempt.skill === "letterForm")).toHaveLength(5);
    expect(game.mastery.getAttempts().every((attempt) => attempt.wasCorrect)).toBe(true);
    vi.useRealTimers();
  });

  it("plays Tientalhuis from the journey: finishing advances + logs math-to-20", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const thIndex = JOURNEY.findIndex((node) => node.scene === "tientalhuis");
    const th = JOURNEY[thIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, thIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${th.id}"]`)!.click();
    expect(root.querySelector(".tientalhuis-board")).toBeTruthy();
    expect(root.querySelectorAll(".tientalhuis-choice")).toHaveLength(2);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.tientalhuis-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(th.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-number")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Zoemroute from the journey: sound stones + blend, finishing advances + logs reading", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const zrIndex = JOURNEY.findIndex((node) => node.scene === "zoemroute");
    const zr = JOURNEY[zrIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, zrIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${zr.id}"]`)!.click();
    expect(root.querySelector(".zoemroute-stones")).toBeTruthy();
    expect(root.querySelectorAll(".zoemroute-stone").length).toBeGreaterThanOrEqual(1);
    expect(root.querySelectorAll(".zoemroute-choice")).toHaveLength(3);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.zoemroute-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(zr.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "literacy-reading")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Getallenlijn from the journey: a blank on the line, finishing advances + logs math-to-20", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const glIndex = JOURNEY.findIndex((node) => node.scene === "getallenlijn");
    const gl = JOURNEY[glIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, glIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${gl.id}"]`)!.click();
    expect(root.querySelector(".getallenlijn-line")).toBeTruthy();
    expect(root.querySelectorAll(".getallenlijn-cell")).toHaveLength(5);
    expect(root.querySelector(".getallenlijn-cell.blank")).toBeTruthy();
    expect(root.querySelectorAll(".getallenlijn-choice")).toHaveLength(3);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.getallenlijn-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(gl.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-number")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Woordbouwplaats from the journey: sound boxes, finishing advances + logs reading", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const wbIndex = JOURNEY.findIndex((node) => node.scene === "woordbouwplaats");
    const wb = JOURNEY[wbIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, wbIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${wb.id}"]`)!.click();
    expect(root.querySelector(".woordbouw-board")).toBeTruthy();
    expect(root.querySelector(".woordbouw-box.blank")).toBeTruthy();
    // Choice count follows the difficulty tier at this node (2 gentle, 3 later).
    expect(root.querySelectorAll(".woordbouw-choice").length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.woordbouw-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(wb.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "literacy-reading")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Tienbrug from the journey: a sum over the ten, finishing advances + logs operations", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const tbIndex = JOURNEY.findIndex((node) => node.scene === "tienbrug");
    const tb = JOURNEY[tbIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, tbIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${tb.id}"]`)!.click();
    expect(root.querySelector(".tienbrug-sum")).toBeTruthy();
    expect(root.querySelectorAll(".tienbrug-choice")).toHaveLength(3);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.tienbrug-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(tb.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-operations")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Dubbelspel from the journey: doubles/even-odd choices, finishing advances + logs operations", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const dbIndex = JOURNEY.findIndex((node) => node.scene === "dubbelspel");
    const db = JOURNEY[dbIndex];
    expect(dbIndex).toBeGreaterThan(-1);
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, dbIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${db.id}"]`)!.click();
    expect(root.querySelector(".dubbel-play")).toBeTruthy();
    expect(root.querySelectorAll(".dubbel-choice").length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.dubbel-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(db.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-operations")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Sprongpad from the journey and logs jumps of 2, 5 or 10", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    const index = JOURNEY.findIndex((node) => node.scene === "sprongpad");
    const node = JOURNEY[index];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, index).map((item) => item.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${node.id}"]`)!.click();
    expect(root.querySelector(".skip-track")).toBeTruthy();
    expect(root.querySelectorAll(".skip-choice")).toHaveLength(3);
    for (let round = 0; round < 24 && !root.querySelector(".mini-done"); round += 1) {
      root.querySelector<HTMLButtonElement>('.skip-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(node.id);
    expect(game.mastery.getAttempts().some((attempt) => attempt.skill === "skipCount")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Vriendjes van 10 from the journey: a ten-frame + partner choices, finishing advances + logs make10", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const vIndex = JOURNEY.findIndex((node) => node.scene === "vriendjes");
    const v = JOURNEY[vIndex];
    expect(vIndex).toBeGreaterThan(-1);
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, vIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${v.id}"]`)!.click();
    expect(root.querySelector(".bond-play")).toBeTruthy();
    expect(root.querySelectorAll(".bond-cell")).toHaveLength(10);
    expect(root.querySelectorAll(".bond-choice").length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.bond-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(v.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-number" && a.skill === "make10")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Vormenburcht from the journey: shape choices, finishing advances + logs geometry", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const vbIndex = JOURNEY.findIndex((node) => node.scene === "vormenburcht");
    const vb = JOURNEY[vbIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, vbIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${vb.id}"]`)!.click();
    expect(root.querySelector(".vormen-play")).toBeTruthy();
    expect(root.querySelectorAll(".vormen-choice")).toHaveLength(3);
    expect(root.querySelectorAll(".vormen-build-stones > span")).toHaveLength(7);
    expect(root.querySelector(".vormen-build-progress")?.getAttribute("aria-label")).toBe("0 van 7 vormstenen gebouwd");

    root.querySelector<HTMLButtonElement>('.vormen-choice[data-correct="false"]')!.click();
    expect(root.querySelector(".vormen-corner-answer, .vormen-next.revealed, .vormen-name")).toBeTruthy();
    root.querySelector<HTMLButtonElement>('.vormen-choice[data-correct="true"]')!.click();
    expect(root.querySelectorAll(".vormen-build-stones > .built")).toHaveLength(1);
    expect(root.querySelector(".vormen-build-progress")?.getAttribute("aria-label")).toBe("1 van 7 vormstenen gebouwd");
    vi.advanceTimersByTime(1100);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.vormen-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(vb.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-geometry")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Kloktoren from the journey: clock reading, finishing advances + logs measurement", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const ktIndex = JOURNEY.findIndex((node) => node.scene === "kloktoren");
    const kt = JOURNEY[ktIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, ktIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${kt.id}"]`)!.click();
    expect(root.querySelector(".klok-play")).toBeTruthy();
    expect(root.querySelectorAll(".klok-choice")).toHaveLength(3);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.klok-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(kt.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-measurement")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Geldmarkt from the journey: coins, finishing advances + logs measurement", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const gmIndex = JOURNEY.findIndex((node) => node.scene === "geldmarkt");
    const gm = JOURNEY[gmIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, gmIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${gm.id}"]`)!.click();
    expect(root.querySelector(".geld-play")).toBeTruthy();
    expect(root.querySelectorAll(".geld-choice")).toHaveLength(3);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.geld-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(gm.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-measurement")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Meetwerf from the journey: length + measuring, finishing advances + logs measurement", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const mwIndex = JOURNEY.findIndex((node) => node.scene === "meetwerf");
    const mw = JOURNEY[mwIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, mwIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${mw.id}"]`)!.click();
    expect(root.querySelector(".meet-play")).toBeTruthy();
    // Choice count follows the difficulty tier at this node (2 gentle, 3 later).
    expect(root.querySelectorAll(".meet-choice").length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.meet-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(mw.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "math-measurement")).toBe(true);
    vi.useRealTimers();
  });

  it("plays Verkeerspad from the journey: picture cards, finishing advances + logs traffic", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const vpIndex = JOURNEY.findIndex((node) => node.scene === "verkeerspad");
    const vp = JOURNEY[vpIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, vpIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${vp.id}"]`)!.click();
    expect(root.querySelector(".verkeer-play")).toBeTruthy();
    expect(root.querySelectorAll(".verkeer-choice")).toHaveLength(3);
    expect(root.querySelectorAll(".verkeer-road > i")).toHaveLength(7);
    expect(root.querySelector(".verkeer-route")?.getAttribute("aria-label")).toBe("0 van 7 veilige stappen naar school");

    root.querySelector<HTMLButtonElement>('.verkeer-choice[data-correct="false"]')!.click();
    expect(root.querySelector(".verkeer-rule strong")?.textContent?.length).toBeGreaterThan(10);
    root.querySelector<HTMLButtonElement>('.verkeer-choice[data-correct="true"]')!.click();
    expect(root.querySelectorAll(".verkeer-road > i.safe")).toHaveLength(1);
    expect(root.querySelector(".verkeer-route")?.getAttribute("aria-label")).toBe("1 van 7 veilige stappen naar school");
    vi.advanceTimersByTime(1100);

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.verkeer-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(vp.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "world-traffic")).toBe(true);
    vi.useRealTimers();
  });

  it("the Sterrenrover finale: 7 hearts, escalating phases, and the freed star", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const finalIndex = JOURNEY.findIndex((node) => node.kind === "boss" && node.regionId === "sterrenrace");
    const finalBoss = JOURNEY[finalIndex];
    expect(finalBoss).toBeTruthy();
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, finalIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${finalBoss.id}"]`)!.click();
    // The finale: marked final, seven hearts, phase 1.
    expect(root.querySelector(".boss-scene.boss-final")).toBeTruthy();
    expect(root.querySelectorAll(".boss-heart")).toHaveLength(7);
    expect(root.querySelector(".phase-2")).toBeNull();

    const hit = (): void => {
      root.querySelector<HTMLButtonElement>('.boss-choice[data-correct="true"]')!.click();
      vi.advanceTimersByTime(1100);
    };
    hit();
    hit();
    hit();
    // Three hits in: the Sterrenrover gets angry (phase 2).
    expect(root.querySelector(".boss-scene.phase-2")).toBeTruthy();
    hit();
    hit();
    hit();
    // Last heart: phase 3.
    expect(root.querySelector(".boss-scene.phase-3")).toBeTruthy();
    // The final hit frees the star during the defeat beat...
    root.querySelector<HTMLButtonElement>('.boss-choice[data-correct="true"]')!.click();
    vi.advanceTimersByTime(1050);
    expect(root.querySelector(".boss-star-free")).toBeTruthy();
    // ...then the victory screen, with the journey advanced.
    vi.advanceTimersByTime(900);
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(finalBoss.id);
    vi.useRealTimers();
  });

  it("plays Luisterbos from the journey: story card + picture questions, finishing advances + logs listening", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const lbIndex = JOURNEY.findIndex((node) => node.scene === "luisterbos");
    const lb = JOURNEY[lbIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, lbIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    const speak = vi.spyOn(game.voice, "speak");
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${lb.id}"]`)!.click();
    expect(root.querySelector(".luister-story")).toBeTruthy();
    expect(root.querySelectorAll(".luister-choice")).toHaveLength(3);
    expect(speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak.mock.calls[0][1]).toMatchObject({ interrupt: true });
    expect(speak.mock.calls[1][1]).toMatchObject({ interrupt: false });

    for (let i = 0; i < 24 && !root.querySelector(".mini-done"); i += 1) {
      root.querySelector<HTMLButtonElement>('.luister-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }
    expect(root.querySelector(".mini-done")).toBeTruthy();
    expect(game.data().progress.journey.completed).toContain(lb.id);
    expect(game.mastery.getAttempts().some((a) => a.domain === "listening-comprehension")).toBe(true);
    vi.useRealTimers();
  });

  it("advances story memory stops back to the Sterrenreis map", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const memoryIndex = JOURNEY.findIndex((node) => node.scene === "memory");
    const memory = JOURNEY[memoryIndex];
    game.save.updateProgress((progress) => {
      progress.journey.completed = JOURNEY.slice(0, memoryIndex).map((node) => node.id);
      progress.journey.nodeIndex = frontierIndex(progress.journey.completed);
    });

    game.showScene("reis");
    expect(root.querySelector(`.reis-node.now[data-node="${memory.id}"]`)).toBeTruthy();
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${memory.id}"]`)!.click();
    expect(root.querySelector(".memory-board")).toBeTruthy();

    const byQuantity = new Map<string, HTMLButtonElement[]>();
    root.querySelectorAll<HTMLButtonElement>(".memory-card").forEach((card) => {
      const q = card.dataset.quantity!;
      byQuantity.set(q, [...(byQuantity.get(q) ?? []), card]);
    });
    expect(root.querySelector(".memory-board")?.getAttribute("data-tier")).toBe("1");
    expect(byQuantity.size).toBe(3);
    for (const pair of byQuantity.values()) {
      pair[0].click();
      pair[1].click();
    }
    vi.advanceTimersByTime(800);

    expect(game.data().progress.journey.completed).toContain(memory.id);
    expect(root.querySelector<HTMLButtonElement>(".results-actions .btn.secondary")?.textContent).toBe("Verder");
    root.querySelector<HTMLButtonElement>(".results-actions .btn.secondary")!.click();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
    expect(root.querySelector(`.reis-node.done[data-node="${memory.id}"]`)).toBeTruthy();
    expect(root.querySelector(`.reis-node.now[data-node="${JOURNEY[memoryIndex + 1].id}"]`)).toBeTruthy();
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
      countEveryAnimal(root);
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

  it("makes counting every animal unlock the answer and visibly rescues its group", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("count");

    const choices = Array.from(root.querySelectorAll<HTMLButtonElement>(".count-choices .mini-choice"));
    expect(root.querySelectorAll(".count-rescue-trail > span")).toHaveLength(5);
    expect(choices.every((choice) => choice.disabled)).toBe(true);
    expect(root.querySelector(".count-counter")?.textContent).toContain("0");

    countEveryAnimal(root);
    expect(choices.every((choice) => !choice.disabled)).toBe(true);
    expect(root.querySelectorAll('.count-item[aria-pressed="true"]')).toHaveLength(root.querySelectorAll(".count-item").length);
    expect(root.querySelector(".count-choices.ready")).toBeTruthy();
    root.querySelector<HTMLButtonElement>('.count-choices .mini-choice[data-correct="true"]')!.click();
    expect(root.querySelectorAll(".count-rescue-trail > .rescued")).toHaveLength(1);
    expect(root.querySelector(".count-rescue-trail > .arriving")).toBeTruthy();
    expect(root.querySelector(".count-rescue-trail")?.getAttribute("aria-label")).toBe("1 van 5 dierengroepjes gered");
  });

  it("feeds the winning quantity to the comparison dino", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("compare");

    root.querySelector<HTMLButtonElement>('.compare-choice[data-correct="true"]')!.click();
    expect(root.querySelector(".compare-choice.winner .compare-crown")).toBeTruthy();
    expect(root.querySelector(".compare-dino.eating")).toBeTruthy();
    expect(root.querySelectorAll(".compare-feed-meter > .filled")).toHaveLength(1);
    expect(root.querySelector(".compare-feed-meter")?.getAttribute("aria-label")).toBe("1 van 7 hapjes");
    expect(root.querySelector(".compare-food-fly")).toBeTruthy();
  });

  it("shows the before-and-after number structure while reteaching one more or less", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("onemoreless");

    expect(root.querySelector(".onemore-state.after .onemore-mystery")).toBeTruthy();
    const correct = root.querySelector<HTMLButtonElement>('.numeral-choice[data-correct="true"]')!;
    root.querySelector<HTMLButtonElement>('.numeral-choice[data-correct="false"]')!.click();
    expect(root.querySelector(".onemore-state.after.revealed.teaching strong")?.textContent).toBe(correct.textContent);

    correct.click();
    expect(root.querySelector(".onemore-state.after.revealed.success")).toBeTruthy();
    expect(root.querySelector(".onemore-state.after.teaching")).toBeFalsy();
  });

  it("finishes spoken counting and voice-first choices before unlocking or scoring", async () => {
    const originalAudio = globalThis.Audio;
    const originalUserAgent = navigator.userAgent;

    class SequencedAudio {
      static instances: SequencedAudio[] = [];
      preload = "";
      playbackRate = 1;
      currentTime = 0;
      private readonly listeners = new Map<string, () => void>();

      constructor(readonly src: string) {
        SequencedAudio.instances.push(this);
      }

      addEventListener(type: string, listener: () => void): void {
        this.listeners.set(type, listener);
      }

      play(): Promise<void> {
        return Promise.resolve();
      }

      pause(): void {}

      end(): void {
        this.listeners.get("ended")?.();
      }
    }

    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Chrome" });
    Object.defineProperty(globalThis, "Audio", { configurable: true, value: SequencedAudio });

    try {
      const { Game } = await import("../src/game/Game");
      const root = document.querySelector<HTMLElement>("#app")!;
      const game = new Game(root);
      game.showScene("count");
      const animalCount = root.querySelectorAll(".count-item").length;
      countEveryAnimal(root);
      expect(root.querySelector(".count-choices.locked")).toBeTruthy();

      for (let index = 0; index < animalCount; index += 1) SequencedAudio.instances[index + 1].end();
      expect(root.querySelector(".count-choices.ready")).toBeTruthy();

      game.showScene("verkeerspad");
      const attemptsBefore = game.mastery.getAttempts().length;
      root.querySelector<HTMLButtonElement>('.verkeer-choice[data-correct="true"]')!.click();
      expect(root.querySelector(".verkeer-play")?.getAttribute("aria-busy")).toBe("true");
      expect(game.mastery.getAttempts()).toHaveLength(attemptsBefore);

      SequencedAudio.instances.at(-1)!.end();
      expect(root.querySelector(".verkeer-play")?.hasAttribute("aria-busy")).toBe(false);
      expect(game.mastery.getAttempts()).toHaveLength(attemptsBefore + 1);
      game.showScene("hub");
    } finally {
      Object.defineProperty(navigator, "userAgent", { configurable: true, value: originalUserAgent });
      Object.defineProperty(globalThis, "Audio", { configurable: true, value: originalAudio });
    }
  });

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
    expect(root.querySelector(".memory-board")?.getAttribute("data-tier")).toBe("1");
    expect(byQuantity.size).toBe(3);
    for (const pair of byQuantity.values()) {
      pair[0].click();
      pair[1].click();
    }
    vi.advanceTimersByTime(900);
    expect(root.querySelector(".results-star-rating")).toBeTruthy();
    expect(game.data().progress.attempts.length).toBeGreaterThanOrEqual(before + 3);
  });

  it("expands Memory to five pairs and quantities through 10 at tier 3", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.getMutableData().progress.journey.round = 3;
    game.showScene("memory");

    const board = root.querySelector<HTMLElement>(".memory-board")!;
    const cards = Array.from(root.querySelectorAll<HTMLButtonElement>(".memory-card"));
    const quantities = new Set(cards.map((card) => Number(card.dataset.quantity)));
    expect(board.dataset.tier).toBe("3");
    expect(cards).toHaveLength(10);
    expect(quantities.size).toBe(5);
    expect(Math.max(...quantities)).toBeLessThanOrEqual(10);
    expect(cards.every((card) => card.getAttribute("aria-label") === "gesloten geheugenkaart")).toBe(true);
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
      countEveryAnimal(root);
      const correct = root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]');
      if (!correct) break;
      correct.click();
      vi.advanceTimersByTime(1100);
    }
    expect(game.data().progress.stickers).toContain("first-star");
    expect(root.querySelector(".results-unlock.sticker")).toBeTruthy();
  });

  it("persists a better calm-mode rating in the complete dynamic star collection", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.recordActivityStars("count", 1);
    game.showScene("count");

    for (let round = 0; round < 15 && !root.querySelector(".mini-done"); round += 1) {
      countEveryAnimal(root);
      root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }

    expect(game.data().progress.activityBestStars.count).toBe(3);
    expect(root.querySelector(".results-unlock.personal-best")?.textContent).toContain("3/3 sterren");
    game.showScene("hub");
    expect(root.querySelector(".hub-mode-total")?.textContent).toContain(`3/${PLAY_MODES.length * 3}`);
    expect(root.querySelectorAll('.hub-card[data-mode="count"] .hub-mode-stars .earned')).toHaveLength(3);
    expect(root.querySelector('.hub-card[data-mode="count"]')?.getAttribute("aria-label")).toContain("3 van 3 sterren");
  });

  it("reveals a hero earned in a calm mode and lets the child equip it", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.createProfile("Mila", "blitz");
    game.save.award({ stars: 11 });
    game.save.syncStickers();
    game.showScene("count");

    for (let round = 0; round < 15 && !root.querySelector(".mini-done"); round += 1) {
      countEveryAnimal(root);
      root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]')?.click();
      vi.advanceTimersByTime(1100);
    }

    const reveal = root.querySelector<HTMLElement>('.skin-reveal[data-skin="aqua"]');
    expect(reveal).toBeTruthy();
    reveal!.querySelector<HTMLButtonElement>(".skin-reveal-choose")!.click();
    expect(game.data().progress.cosmetics.activeSkin).toBe("aqua");
    expect(root.querySelector(".skin-reveal")).toBeNull();
  });

  it("updates the hub garage and Buddy as soon as an earned hero is chosen", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.createProfile("Noor", "blitz");
    game.save.award({ stars: 12 });
    game.showScene("hub");

    root.querySelector<HTMLButtonElement>(".skin-reveal-choose")!.click();

    expect(root.querySelector('.garage-card.active[data-skin="aqua"]')).toBeTruthy();
    expect(root.querySelector('.hub-buddy[data-buddy="aqua"]')).toBeTruthy();
    expect(game.data().progress.cosmetics.activeSkin).toBe("aqua");
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
    expect(wrong!.disabled).toBe(true);
    wrong!.click();
    expect(game.data().progress.attempts.length).toBe(before);
    countEveryAnimal(root);
    expect(wrong!.disabled).toBe(false);
    expect(root.querySelector(".count-choices.ready")).toBeTruthy();
    expect(root.querySelector(".count-counter.complete")).toBeTruthy();
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
    countEveryAnimal(root);
    root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]')!.click();
    expect(root.querySelector(".buddy.mood-happy, .buddy.mood-wow")).toBeTruthy();
    vi.advanceTimersByTime(1100);
    // second correct in a row: a streak banner appears
    countEveryAnimal(root);
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

  it("does not replace a blocked local ElevenLabs clip with browser speech", async () => {
    const originalAudio = globalThis.Audio;
    const originalUtterance = globalThis.SpeechSynthesisUtterance;
    const originalSpeech = window.speechSynthesis;
    const originalUserAgent = navigator.userAgent;
    const browserSpeak = vi.fn();

    class FakeAudio {
      preload = "";
      playbackRate = 1;
      currentTime = 0;
      constructor(readonly src: string) {}
      addEventListener() {}
      pause() {}
      play() {
        return Promise.reject(new Error("autoplay blocked"));
      }
    }
    class FakeUtterance {
      lang = "";
      rate = 1;
      pitch = 1;
      volume = 1;
      voice?: SpeechSynthesisVoice;
      constructor(readonly text: string) {}
    }

    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Chrome" });
    Object.defineProperty(globalThis, "Audio", { configurable: true, value: FakeAudio });
    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", { configurable: true, value: FakeUtterance });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { getVoices: () => [], speak: browserSpeak, cancel: vi.fn(), addEventListener: vi.fn() }
    });

    try {
      const { VoiceManager } = await import("../src/game/VoiceManager");
      const voice = new VoiceManager();
      voice.speak("Goed zo!", { interrupt: true });
      await Promise.resolve();
      expect(browserSpeak).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, "userAgent", { configurable: true, value: originalUserAgent });
      Object.defineProperty(globalThis, "Audio", { configurable: true, value: originalAudio });
      Object.defineProperty(globalThis, "SpeechSynthesisUtterance", { configurable: true, value: originalUtterance });
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: originalSpeech });
    }
  });
});

describe("De Sterrenreis — story mode", () => {
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

  it("advances the journey frontier and de-dups completed nodes", async () => {
    const { Game } = await import("../src/game/Game");
    const { JOURNEY } = await import("../src/data/journey");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    expect(game.data().progress.journey.nodeIndex).toBe(0);
    const first = JOURNEY[0].id;
    game.save.advanceJourney(first);
    expect(game.data().progress.journey.completed).toContain(first);
    expect(game.data().progress.journey.nodeIndex).toBe(1);
    game.save.advanceJourney(first);
    expect(game.data().progress.journey.completed.filter((id) => id === first)).toHaveLength(1);
    expect(game.data().progress.journey.nodeIndex).toBe(1);
  });

  it("renders the road with exactly one glowing frontier, a quest, the buddy and a friend meadow", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("reis");
    expect(root.querySelector(".reis-scene")).toBeTruthy();
    expect(root.querySelector(".reis-quest")).toBeTruthy();
    expect(root.querySelectorAll(".reis-node.now")).toHaveLength(1);
    expect(root.querySelector(".reis-buddy")).toBeTruthy();
    expect(root.querySelectorAll(".reis-friend")).toHaveLength(6);
    expect(root.querySelectorAll(".reis-node").length).toBeGreaterThanOrEqual(20);
  });

  it("launches a stop from the frontier and advances the journey on completion, then returns to the map", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const { JOURNEY } = await import("../src/data/journey");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("reis");
    const first = JOURNEY[0]; // a 'count' stop
    root.querySelector<HTMLButtonElement>(`.reis-node[data-node="${first.id}"]`)!.click();
    expect(game.lastJourneyNode).toBe(first.id);
    expect(root.querySelector(".mini-header")).toBeTruthy();
    for (let r = 0; r < 15 && !root.querySelector(".results-card"); r += 1) {
      countEveryAnimal(root);
      const correct = root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]');
      if (!correct) break;
      correct.click();
      vi.advanceTimersByTime(1100);
    }
    expect(game.data().progress.journey.completed).toContain(first.id);
    // The done-screen home button ("Verder") goes back to the map.
    const home = root.querySelector<HTMLButtonElement>(".results-actions .btn.secondary");
    expect(home?.textContent).toBe("Verder");
    home!.click();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
    expect(root.querySelector(`.reis-node[data-node="${first.id}"]`)?.classList.contains("done")).toBe(true);
  });

  it("back-fills journey progress for an old save without it", async () => {
    localStorage.setItem("blokblitz-save-v1", JSON.stringify({ version: 1, settings: { muted: false }, progress: { stars: 7 } }));
    const { SaveManager } = await import("../src/game/SaveManager");
    const save = new SaveManager();
    expect(save.getData().progress.journey).toEqual({ nodeIndex: 0, completed: [], round: 1 });
    expect(save.getData().progress.stars).toBe(7);
  });

  it("splits the legacy mute setting into independent music + sound toggles", async () => {
    const { SaveManager } = await import("../src/game/SaveManager");
    // Old save that was fully muted -> both music and effects start off.
    localStorage.setItem("blokblitz-save-v1", JSON.stringify({ version: 1, settings: { muted: true }, progress: {} }));
    let settings = new SaveManager().getData().settings;
    expect(settings.music).toBe(false);
    expect(settings.sound).toBe(false);
    // Old save with sound on -> both on.
    localStorage.setItem("blokblitz-save-v1", JSON.stringify({ version: 1, settings: { muted: false }, progress: {} }));
    settings = new SaveManager().getData().settings;
    expect(settings.music).toBe(true);
    expect(settings.sound).toBe(true);
    // An already-split save is preserved verbatim.
    localStorage.setItem("blokblitz-save-v1", JSON.stringify({ version: 1, settings: { muted: false, music: false, sound: true }, progress: {} }));
    settings = new SaveManager().getData().settings;
    expect(settings.music).toBe(false);
    expect(settings.sound).toBe(true);
  });
});

describe("per-child profiles", () => {
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

  it("opens with Buddy, Sterrenstad and return-aware journey progress", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("boot");
    const fresh = root.querySelector<HTMLElement>(".boot-splash")!;
    expect(fresh.dataset.returning).toBe("false");
    expect(fresh.querySelector(".boot-buddy")).toBeTruthy();
    expect(fresh.querySelectorAll(".boot-city .tower")).toHaveLength(6);
    expect(fresh.querySelector(".boot-lost-star")).toBeTruthy();
    expect(fresh.querySelector("h1")?.textContent).toBe("BlokBlitz");
    expect(fresh.querySelector(".brand-mark")).toBeFalsy();
    expect(fresh.querySelector<HTMLButtonElement>(".boot-start")?.getAttribute("aria-label")).toBe("Start het avontuur");

    game.save.createProfile("Noor", "aqua");
    game.save.award({ stars: 14 });
    game.save.advanceJourney(JOURNEY[0].id);
    game.showScene("boot");

    const returning = root.querySelector<HTMLElement>(".boot-splash")!;
    expect(returning.dataset.returning).toBe("true");
    expect(returning.querySelector('.boot-buddy[data-buddy="blitz"]')).toBeTruthy();
    expect(returning.querySelector(".boot-sign-prompt")?.textContent).toContain("Noor");
    expect(returning.querySelector(".boot-progress")?.getAttribute("aria-label")).toContain("14 sterren");
    expect(returning.querySelector(".boot-progress")?.getAttribute("aria-label")).toContain("2/");
    expect(returning.querySelector(".boot-start")).toBeNull();
    expect(returning.querySelectorAll(".boot-sign")).toHaveLength(3);
    expect(returning.querySelectorAll('.boot-sign[data-correct="true"]')).toHaveLength(1);
    expect(returning.querySelector('.boot-sign[data-correct="true"]')?.getAttribute("data-avatar")).toBe("aqua");
    expect(returning.querySelector<HTMLButtonElement>(".boot-switch")?.getAttribute("aria-label")).toContain("voor volwassenen");

    const speak = vi.spyOn(game.voice, "speak");
    returning.querySelector<HTMLButtonElement>('.boot-sign[data-correct="false"]')!.click();
    expect(root.querySelector(".boot-scene")).toBeTruthy();
    expect(speak).toHaveBeenCalledWith("Kijk nog eens goed.", expect.objectContaining({ interrupt: true }));

    returning.querySelector<HTMLButtonElement>('.boot-sign[data-correct="true"]')!.click();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
  });

  it("shows a clear adult-facing profile limit instead of an unusable add tile", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    for (let index = 1; index <= 4; index += 1) game.save.createProfile(`Kind ${index}`, "blitz", index);

    game.showScene("profiles");
    expect(root.querySelectorAll(".profile-card[data-profile]")).toHaveLength(4);
    expect(root.querySelector(".profile-add")).toBeFalsy();
    expect(root.querySelector(".profile-limit")?.textContent).toContain("4 spelers op dit toestel");
  });

  it("shows the profile picker on a fresh install and creates the first child", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    expect(game.save.hasChosenProfile()).toBe(false);

    game.showScene("profiles");
    // Empty install goes straight to "make your dino".
    expect(root.querySelector(".profile-create")).toBeTruthy();
    expect(root.querySelectorAll(".profile-avatar-choice .profile-token")).toHaveLength(6);
    expect(root.querySelector(".profile-avatar-choice .buddy")).toBeNull();
    root.querySelector<HTMLButtonElement>('.profile-avatar-choice[data-avatar="aqua"]')!.click();
    expect(root.querySelector('.profile-avatar-choice[data-avatar="aqua"]')?.getAttribute("aria-pressed")).toBe("true");
    const nameInput = root.querySelector<HTMLInputElement>(".profile-name-input")!;
    nameInput.value = "Roos";
    root.querySelector<HTMLButtonElement>(".profile-create-start")!.click();

    expect(game.save.hasChosenProfile()).toBe(true);
    const active = game.save.activeProfile()!;
    expect(active.name).toBe("Roos");
    expect(active.avatar).toBe("aqua");
    expect(game.data().progress.cosmetics.activeSkin).toBe("blitz");
    expect(root.querySelector(".reis-scene")).toBeTruthy();

    game.showScene("profiles");
    root.querySelector<HTMLButtonElement>(".profile-add")!.click();
    const usedSign = root.querySelector<HTMLButtonElement>('.profile-avatar-choice[data-avatar="aqua"]');
    expect(usedSign?.disabled).toBe(true);
    expect(usedSign?.getAttribute("aria-label")).toContain("al gebruikt");
    expect(root.querySelector('.profile-avatar-choice.chosen[data-avatar="aqua"]')).toBeNull();
  });

  it("keeps each child's stars and mastery fully independent", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    const a = game.save.createProfile("Kind A", "blitz");
    game.useProfile(a.id);
    game.save.award({ stars: 12 });
    const b = game.save.createProfile("Kind B", "ember");
    game.useProfile(b.id);
    // B starts clean; A's 12 stars did not leak.
    expect(game.data().progress.stars).toBe(0);
    game.save.award({ stars: 3 });

    game.useProfile(a.id);
    expect(game.data().progress.stars).toBe(12);
    game.useProfile(b.id);
    expect(game.data().progress.stars).toBe(3);

    // The picker lists both, and the hub shows who is playing.
    game.showScene("profiles");
    expect(root.querySelectorAll(".profile-card:not(.profile-add)")).toHaveLength(2);
    game.showScene("hub");
    expect(root.querySelector(".hub-profile")?.textContent).toContain("Kind B");
    expect(root.querySelector('.hub-profile-avatar.profile-token[data-avatar="ember"]')).toBeTruthy();
    expect(root.querySelector('.hub-buddy[data-buddy="blitz"]')).toBeTruthy();
    expect(root.querySelector<HTMLElement>('.garage-card[data-skin="ember"]')?.dataset.locked).toBe("true");
    expect(game.data().progress.cosmetics.activeSkin).toBe("blitz");
  });

  it("keeps profile switching behind the parent gate", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.createProfile("Noor", "aqua");
    game.showScene("hub");

    root.querySelector<HTMLButtonElement>(".hub-profile")!.click();
    expect(document.querySelector(".parent-gate-overlay")).toBeTruthy();
    expect(root.querySelector(".profiles-scene")).toBeFalsy();
    document.querySelector<HTMLButtonElement>('.parent-gate-option[data-correct="true"]')!.click();
    expect(document.querySelector(".parent-gate-overlay")).toBeTruthy();
    expect(root.querySelector(".profiles-scene")).toBeFalsy();
    const hold = document.querySelector<HTMLButtonElement>(".parent-gate-hold")!;
    hold.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    vi.advanceTimersByTime(1250);
    expect(document.querySelector(".parent-gate-overlay")).toBeTruthy();
    hold.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true }));
    vi.advanceTimersByTime(1);
    expect(document.querySelector(".parent-gate-overlay")).toBeFalsy();
    expect(root.querySelector(".profiles-scene")).toBeTruthy();
  });

  it("keeps boot-time profile switching behind the same adult hold gate", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.save.createProfile("Noor", "aqua");
    game.showScene("boot");

    root.querySelector<HTMLButtonElement>(".boot-switch")!.click();
    expect(document.querySelector(".parent-gate-overlay")).toBeTruthy();
    expect(root.querySelector(".profiles-scene")).toBeNull();
    document.querySelector<HTMLButtonElement>('.parent-gate-option[data-correct="true"]')!.click();
    const hold = document.querySelector<HTMLButtonElement>(".parent-gate-hold")!;
    hold.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    vi.advanceTimersByTime(1250);
    expect(document.querySelector(".parent-gate-overlay")).toBeTruthy();
    hold.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true }));
    vi.advanceTimersByTime(1);

    expect(document.querySelector(".parent-gate-overlay")).toBeNull();
    expect(root.querySelector(".profiles-scene")).toBeTruthy();
  });

  it("routes fresh boot to profile creation and returning boot through the personal sign", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    game.showScene("boot");
    root.querySelector<HTMLButtonElement>(".splash-panel .btn")!.click();
    expect(root.querySelector(".profiles-scene")).toBeTruthy();

    game.save.createProfile("Kind", "blitz");
    game.showScene("boot");
    root.querySelector<HTMLButtonElement>('.boot-sign[data-correct="true"]')!.click();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
  });

  it("keeps profile creation locked until the natural welcome line finishes", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);
    let finishWelcome: (() => void) | undefined;
    const speakThen = vi.spyOn(game.voice, "speakThen").mockImplementation((text, onComplete) => {
      if (text === "Hoi! Daar gaan we!") finishWelcome = onComplete;
    });

    game.showScene("profiles");
    const start = root.querySelector<HTMLButtonElement>(".profile-create-start")!;
    start.click();

    expect(speakThen).toHaveBeenCalledWith("Hoi! Daar gaan we!", expect.any(Function), expect.objectContaining({ interrupt: true }));
    expect(root.querySelector(".profiles-scene")?.getAttribute("aria-busy")).toBe("true");
    expect(start.disabled).toBe(true);
    expect(start.textContent).toBe("Daar gaan we!");
    expect(game.save.listProfiles()).toHaveLength(1);
    start.click();
    expect(game.save.listProfiles()).toHaveLength(1);
    expect(root.querySelector(".reis-scene")).toBeNull();

    finishWelcome?.();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
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
