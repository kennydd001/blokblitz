// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptiveEngine } from "../src/education/adaptiveEngine";
import { ChallengeFactory } from "../src/education/challengeFactory";
import { MasteryTracker } from "../src/education/masteryTracker";
import { AdaptiveGateProvider } from "../src/runner/gateProvider";
import { RunnerCore, type GateProvider, type GateSpec, type RunnerSnapshot } from "../src/runner/RunnerCore";
import { STICKERS } from "../src/data/stickers";
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
    ["reis", "count", "match", "compare", "fill", "onemoreless", "order", "memory"].forEach((mode) => {
      expect(root.querySelector(`.hub-card[data-mode="${mode}"]`)).toBeTruthy();
    });
    expect(root.querySelector(".menu-garage")).toBeTruthy();
  });

  it("makes De Sterrenreis the default adventure and advances after a story activity", async () => {
    vi.useFakeTimers();
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("boot");
    vi.advanceTimersByTime(750);
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
      root.querySelector<HTMLButtonElement>('.mini-choice[data-correct="true"]')!.click();
      vi.advanceTimersByTime(1100);
    }

    expect(game.data().progress.journey.completed).toContain(firstNode.id);
    expect(root.querySelector<HTMLButtonElement>('.results-actions .btn.secondary')?.textContent).toBe("Verder");
    root.querySelector<HTMLButtonElement>('.results-actions .btn.secondary')!.click();
    expect(root.querySelector(".reis-scene")).toBeTruthy();
    expect(root.querySelector(`.reis-node.done[data-node="${firstNode.id}"]`)).toBeTruthy();
    expect(root.querySelector(`.reis-node.now[data-node="${JOURNEY[1].id}"]`)).toBeTruthy();
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

  it("opens a brand-new journey with a tappable story card", async () => {
    const { Game } = await import("../src/game/Game");
    const root = document.querySelector<HTMLElement>("#app")!;
    const game = new Game(root);

    game.showScene("reis");
    const overlay = root.querySelector(".reis-story-overlay");
    expect(overlay).toBeTruthy();
    expect(overlay?.textContent).toContain(JOURNEY_INTRO.title);
    expect(overlay?.textContent).toContain(JOURNEY_INTRO.lines[0]);
    const start = root.querySelector<HTMLButtonElement>(".reis-story-start");
    expect(start?.textContent).toBe(JOURNEY_INTRO.start);
    start!.click();
    expect(root.querySelector(".reis-story-overlay")).toBeNull();
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
    expect(root.querySelector(".reis-finale")).toBeTruthy();
    expect(root.querySelector(".reis-progress-pill")?.textContent).toContain("Ster thuis");
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
    expect(byQuantity.size).toBe(4);
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
    expect(save.getData().progress.journey).toEqual({ nodeIndex: 0, completed: [] });
    expect(save.getData().progress.stars).toBe(7);
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
