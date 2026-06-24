import * as THREE from "three";
import { AdaptiveEngine } from "../education/adaptiveEngine";
import { buildAttemptLog } from "../education/challengeLogger";
import { ChallengeFactory } from "../education/challengeFactory";
import { MasteryTracker } from "../education/masteryTracker";
import { subitizeThresholdMs } from "../education/quantityLayouts";
import type { Challenge, ChallengeOption, SaveData } from "../education/types";
import { AssetManager } from "./AssetManager";
import { AudioManager } from "./AudioManager";
import { GameLoop } from "./GameLoop";
import { HapticManager } from "./HapticManager";
import { InputManager } from "./InputManager";
import { SaveManager } from "./SaveManager";
import { VoiceManager } from "./VoiceManager";
import type { SoundCue } from "./AudioManager";
import { SceneManager } from "./SceneManager";
import { BlokBlitzScene } from "../scenes/BlokBlitzScene";
import { BootScene } from "../scenes/BootScene";
import { HubScene } from "../scenes/HubScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { MinigameScene } from "../scenes/MinigameScene";
import { NumberOfDayScene } from "../scenes/NumberOfDayScene";
import { ParentDashboardScene } from "../scenes/ParentDashboardScene";
import { ResultsScene } from "../scenes/ResultsScene";
import { ReisScene } from "../scenes/ReisScene";
import { RunScene } from "../scenes/RunScene";
import { CompareScene } from "../scenes/minigames/CompareScene";
import { CountScene } from "../scenes/minigames/CountScene";
import { FillScene } from "../scenes/minigames/FillScene";
import { MatchScene } from "../scenes/minigames/MatchScene";
import { MemoryScene } from "../scenes/minigames/MemoryScene";
import { OneMoreLessScene } from "../scenes/minigames/OneMoreLessScene";
import { OrderScene } from "../scenes/minigames/OrderScene";
import { SettingsScene } from "../scenes/SettingsScene";
import { SterrenstadScene } from "../scenes/SterrenstadScene";
import { SummaryScene } from "../scenes/SummaryScene";
import { WebWoudScene } from "../scenes/WebWoudScene";

export class Game {
  readonly root: HTMLElement;
  readonly stage: HTMLElement;
  readonly overlay: HTMLElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly world: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly input = new InputManager();
  readonly audio = new AudioManager();
  readonly haptics = new HapticManager();
  readonly voice = new VoiceManager();
  readonly assets = new AssetManager();
  readonly save = new SaveManager();
  readonly mastery: MasteryTracker;
  readonly adaptive: AdaptiveEngine;
  readonly challenges = new ChallengeFactory();
  readonly scenes: SceneManager;

  /** The journey node that launched the current activity (story mode), or undefined for free play. */
  lastJourneyNode?: string;
  /** How many journey nodes the map has already celebrated, so a return shows the new bloom once. */
  journeySeenCompleted = 0;

  private readonly loop: GameLoop;
  private readonly animatedObjects: THREE.Object3D[] = [];
  private readonly gameplayObjects: THREE.Object3D[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.className = "app-shell";
    this.stage = document.createElement("div");
    this.stage.className = "game-stage";
    this.overlay = document.createElement("main");
    this.overlay.className = "scene-layer";
    this.root.replaceChildren(this.stage, this.overlay);

    this.world = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 4.2, 8.5);
    this.camera.lookAt(0, 0.6, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.stage.appendChild(this.renderer.domElement);

    this.mastery = new MasteryTracker(this.save.getMutableData().progress.attempts);
    this.adaptive = new AdaptiveEngine(this.mastery);
    this.scenes = new SceneManager(this);
    this.loop = new GameLoop((dt, elapsed) => this.update(dt, elapsed));

    this.audio.setSettings(this.save.getMutableData().settings);
    this.haptics.setSettings(this.save.getMutableData().settings);
    this.voice.setSettings(this.save.getMutableData().settings);
    this.voice.setDuckHook((ms) => this.audio.duck(ms));
    this.registerScenes();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  start(): void {
    this.input.attach();
    this.scenes.goTo("boot");
    this.loop.start();
  }

  stop(): void {
    this.input.detach();
    this.loop.stop();
  }

  showScene(name: string, params?: unknown): void {
    this.scenes.goTo(name, params);
  }

  requestFullscreenPlay(): void {
    if (document.fullscreenElement) return;
    const target = this.root as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    const request = target.requestFullscreen?.bind(target) ?? target.webkitRequestFullscreen?.bind(target);
    if (!request) return;
    try {
      void Promise.resolve(request()).catch(() => undefined);
    } catch {
      // Fullscreen can be denied outside a trusted user gesture or unsupported by the browser.
    }
  }

  data(): SaveData {
    return this.save.getData();
  }

  recordAttempt(challenge: Challenge, option: ChallengeOption, startedAt: number, hintUsed = false): boolean {
    const reactionTimeMs = performance.now() - startedAt;
    const attempt = buildAttemptLog({
      challenge,
      option,
      sessionId: this.save.getMutableData().progress.sessionId,
      reactionTimeMs,
      hintUsed
    });
    const logged = this.mastery.logAttempt(attempt);
    this.save.appendAttempt(logged);

    if (option.isCorrect) {
      const isSnap = challenge.skill === "subitize" && reactionTimeMs <= subitizeThresholdMs(challenge.quantity);
      const cue = this.soundCueForCorrectAttempt(challenge, isSnap);
      this.save.award({
        stars: isSnap ? 3 : 1,
        blocks: 1,
        dinos: challenge.challengeType === "rescue-the-herd" ? 1 : 0,
        numerianen: challenge.scene === "webwoud" ? 1 : 0,
        streakDelta: 1
      });
      this.audio.play(cue);
      this.haptics.play(cue);
    } else {
      this.save.award({ streakDelta: -1 });
      this.audio.play("soft-error");
      this.haptics.play("soft-error");
    }
    return option.isCorrect;
  }

  flashMessage(message: string, tone: "good" | "warn" = "good"): void {
    const node = document.createElement("div");
    node.className = `toast ${tone}`;
    node.textContent = message;
    this.overlay.appendChild(node);
    window.setTimeout(() => node.remove(), 1300);
  }

  adventureToast(from: "number" | "sprint" | "web" | "city", to: "sprint" | "web" | "city" | "summary", label: string): void {
    const node = document.createElement("div");
    node.className = "adventure-toast";
    node.dataset.adventureToast = `${from}-${to}`;
    node.setAttribute("aria-live", "polite");
    node.innerHTML = `
      <span class="mission-icon ${from}" aria-hidden="true"></span>
      <i aria-hidden="true"></i>
      <strong>${label}</strong>
      <i aria-hidden="true"></i>
      <span class="mission-icon ${to}" aria-hidden="true"></span>
    `;
    this.overlay.appendChild(node);
    window.setTimeout(() => node.remove(), 1500);
  }

  resetWorld(theme: "menu" | "runner" | "webwoud" | "city" | "summary" | "minigame" = "menu"): void {
    this.world.clear();
    this.animatedObjects.length = 0;
    this.gameplayObjects.length = 0;
    this.setCameraForTheme(theme);
    const palette = {
      menu: { sky: 0xb9e8ff, ground: 0x6ee7b7, accent: 0xf6c453 },
      runner: { sky: 0x9bdcff, ground: 0x5bd06e, accent: 0xf97316 },
      webwoud: { sky: 0xbde0fe, ground: 0x229954, accent: 0x8b5cf6 },
      city: { sky: 0xc7f9ff, ground: 0x94d2bd, accent: 0x3b82f6 },
      summary: { sky: 0xfffbeb, ground: 0xa7f3d0, accent: 0xf6c453 },
      minigame: { sky: 0xbde0fe, ground: 0x86efac, accent: 0xf4b942 }
    }[theme];
    this.world.background = new THREE.Color(palette.sky);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x335533, 2.4);
    this.world.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(3, 7, 5);
    sun.castShadow = true;
    this.world.add(sun);

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.3, 20),
      new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.85 })
    );
    ground.position.set(0, -0.24, -2);
    ground.receiveShadow = true;
    this.world.add(ground);

    if (theme === "runner" || theme === "webwoud" || theme === "city" || theme === "minigame") this.addToyBackdrop3d(theme, palette.accent);
    if (theme === "runner") this.addRunnerWorld(palette.accent);
    else if (theme === "webwoud") this.addWebWorld(palette.accent);
    else if (theme === "city") this.addCityWorld(palette.accent);
    else if (theme === "minigame") this.addMinigameWorld(palette.accent);
    else this.addMenuWorld(palette.accent);
  }

  renderRunnerChoices3d(challenge: Challenge, selectedIndex: number, progress: number, phase: "approach" | "success" | "scaffold" = "approach"): void {
    this.clearGameplayObjects();
    const laneXs = [-2.1, 0, 2.1];
    challenge.options.forEach((option, index) => {
      const x = laneXs[index] ?? 0;
      const selected = index === selectedIndex;
      this.addChoicePad3d(x, -3.68, selected, phase, "runner");
      this.addRunnerMechanic3d(challenge, x, -3.78, selected, phase);
      this.addQuantityBlocks3d(option.quantity ?? (Number(option.value) || 1), x, 1.36, -3.62, selected);
      if (selected) {
        const quantity = option.quantity ?? (Number(option.value) || 1);
        this.addRunnerGuide3d(x, progress, phase);
        this.addNumberPickupTrail3d(quantity, x, 1.22, -3.28, progress, phase, "runner");
        if (phase === "scaffold") this.addScaffoldBeacon3d(x, 1.88, -3.58, "runner");
      }
    });
    const heroX = laneXs[selectedIndex] ?? 0;
    const heroZ = 2.12 - Math.max(0, Math.min(1, progress)) * 4.45;
    this.addHero3d(heroX, heroZ, phase, "runner", progress);
    if (phase !== "approach") this.addRunnerOutcome3d(heroX, -2.95, phase);
  }

  renderWebChoices3d(options: ChallengeOption[], selectedIndex: number, progress: number, phase: "approach" | "success" | "scaffold" = "approach"): void {
    this.clearGameplayObjects();
    const anchorXs = [-2.6, 0, 2.6];
    options.forEach((option, index) => {
      const x = anchorXs[index] ?? 0;
      const selected = index === selectedIndex;
      this.addChoicePad3d(x, -3.02, selected, phase, "webwoud");
      this.addAnchor3d(x, -3.0, selected, phase);
      this.addQuantityBlocks3d(option.quantity ?? (Number(option.value) || 1), x, 1.22, -2.86, selected);
      if (selected) {
        const quantity = option.quantity ?? (Number(option.value) || 1);
        this.addWebGuide3d(x, progress, phase);
        this.addNumberPickupTrail3d(quantity, x, 1.18, -2.58, progress, phase, "webwoud");
        if (phase === "scaffold") this.addScaffoldBeacon3d(x, 1.82, -2.82, "webwoud");
      }
    });
    const heroX = anchorXs[selectedIndex] ?? 0;
    const heroZ = 1.78 - Math.max(0, Math.min(1, progress)) * 3.72;
    this.addHero3d(heroX, heroZ, phase, "webwoud", progress);
    if (phase !== "approach") this.addWebOutcome3d(heroX, -2.55, phase);
  }

  renderMinigameChoices3d(challenge: Challenge, selectedIndex: number, progress = 0, phase: "approach" | "success" | "scaffold" = "approach"): void {
    this.clearGameplayObjects();
    const choiceXs = [-2.55, 0, 2.55];
    const clamped = Math.max(0, Math.min(1, progress));
    challenge.options.forEach((option, index) => {
      const x = choiceXs[index] ?? 0;
      const selected = index === selectedIndex;
      this.addMinigameChoice3d(challenge.challengeType, x, -3.35, selected, phase);
      this.addQuantityBlocks3d(option.quantity ?? (Number(option.value) || 1), x, 1.48, -3.22, selected);
      if (selected) {
        const quantity = option.quantity ?? (Number(option.value) || 1);
        this.addMinigameGuide3d(x, clamped, phase);
        this.addNumberPickupTrail3d(quantity, x, 1.18, -2.88, clamped, phase, "minigame");
        if (phase === "scaffold") this.addScaffoldBeacon3d(x, 1.9, -3.12, "minigame");
      }
    });
    const heroX = choiceXs[selectedIndex] ?? 0;
    this.addHero3d(heroX, 1.55 - clamped * 3.75, phase, "minigame", clamped);
    if (phase !== "approach") this.addMinigameOutcome3d(heroX, -2.42, phase);
  }

  renderCityBuildChoices3d(challenge: Challenge, selectedIndex: number, progress = 0, phase: "approach" | "success" | "scaffold" = "approach"): void {
    this.clearGameplayObjects();
    const choiceXs = [-2.6, 0, 2.6];
    const clamped = Math.max(0, Math.min(1, progress));
    challenge.options.forEach((option, index) => {
      const x = choiceXs[index] ?? 0;
      const selected = index === selectedIndex;
      this.addCityBuildChoice3d(challenge.challengeType, x, -3.25, selected, phase);
      this.addQuantityBlocks3d(option.quantity ?? (Number(option.value) || 1), x, 1.5, -3.08, selected);
      if (selected) {
        const quantity = option.quantity ?? (Number(option.value) || 1);
        this.addCityBuildGuide3d(x, clamped, phase);
        this.addNumberPickupTrail3d(quantity, x, 1.08, -2.82, clamped, phase, "city");
        if (phase === "scaffold") this.addScaffoldBeacon3d(x, 1.92, -3.0, "city");
      }
    });
    const heroX = choiceXs[selectedIndex] ?? 0;
    this.addHero3d(heroX, 1.42 - clamped * 3.62, phase, "city", clamped);
    if (phase !== "approach") this.addCityBuildOutcome3d(heroX, -2.45, phase);
  }

  private registerScenes(): void {
    this.scenes.register("boot", (game) => new BootScene(game));
    this.scenes.register("hub", (game) => new HubScene(game));
    this.scenes.register("reis", (game) => new ReisScene(game));
    this.scenes.register("mainMenu", (game) => new MainMenuScene(game));
    this.scenes.register("run", (game) => new RunScene(game));
    this.scenes.register("results", (game) => new ResultsScene(game));
    this.scenes.register("count", (game) => new CountScene(game));
    this.scenes.register("match", (game) => new MatchScene(game));
    this.scenes.register("compare", (game) => new CompareScene(game));
    this.scenes.register("fill", (game) => new FillScene(game));
    this.scenes.register("onemoreless", (game) => new OneMoreLessScene(game));
    this.scenes.register("order", (game) => new OrderScene(game));
    this.scenes.register("memory", (game) => new MemoryScene(game));
    this.scenes.register("numberOfDay", (game) => new NumberOfDayScene(game));
    this.scenes.register("runner", (game) => new BlokBlitzScene(game));
    this.scenes.register("webwoud", (game) => new WebWoudScene(game));
    this.scenes.register("city", (game) => new SterrenstadScene(game));
    this.scenes.register("minigame", (game) => new MinigameScene(game));
    this.scenes.register("summary", (game) => new SummaryScene(game));
    this.scenes.register("parentDashboard", (game) => new ParentDashboardScene(game));
    this.scenes.register("settings", (game) => new SettingsScene(game));
  }

  private resize(): void {
    const width = this.root.clientWidth || window.innerWidth;
    const height = this.root.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private update(dt: number, elapsed: number): void {
    for (const object of this.animatedObjects) {
      object.rotation.y += dt * 0.35;
      object.position.y += Math.sin(elapsed * 1.5 + object.position.x) * 0.002;
    }
    this.scenes.update(dt);
    this.renderer.render(this.world, this.camera);
  }

  private soundCueForCorrectAttempt(challenge: Challenge, isSnap: boolean): SoundCue {
    if (isSnap) return "snap";
    if (challenge.scene === "webwoud" || challenge.challengeType === "rescue-the-herd") return "rescue";
    if (challenge.scene === "city" || ["bead-bridge", "build-the-number", "train-of-ten"].includes(challenge.challengeType)) return "build";
    return "success";
  }

  private clearGameplayObjects(): void {
    const worldWithChildren = this.world as THREE.Scene & { children?: THREE.Object3D[] };
    for (const object of this.gameplayObjects) {
      if (typeof this.world.remove === "function") this.world.remove(object);
      const index = worldWithChildren.children?.indexOf(object) ?? -1;
      if (index >= 0) worldWithChildren.children?.splice(index, 1);
    }
    this.gameplayObjects.length = 0;
  }

  private addGameplayObject(object: THREE.Object3D): void {
    object.castShadow = true;
    object.receiveShadow = true;
    this.world.add(object);
    this.gameplayObjects.push(object);
  }

  private addTaggedGameplayObject(object: THREE.Object3D, role: string, data: Record<string, unknown> = {}): void {
    object.userData = { ...object.userData, blokblitzRole: role, ...data };
    this.addGameplayObject(object);
  }

  private addWorldObject(object: THREE.Object3D, role: string, theme: "runner" | "webwoud" | "minigame" | "city", animated = false): void {
    object.userData = { ...object.userData, blokblitzWorldRole: role, worldTheme: theme };
    object.castShadow = true;
    object.receiveShadow = true;
    this.world.add(object);
    if (animated) this.animatedObjects.push(object);
  }

  private toyMaterial(color: number, options: { roughness?: number; opacity?: number; emissive?: number; emissiveIntensity?: number } = {}): THREE.MeshStandardMaterial {
    const opacity = options.opacity ?? 1;
    return new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.52,
      metalness: 0,
      transparent: opacity < 1,
      opacity,
      emissive: options.emissive ?? color,
      emissiveIntensity: options.emissiveIntensity ?? 0.03
    });
  }

  private addToyBackdrop3d(theme: "runner" | "webwoud" | "minigame" | "city", accent: number): void {
    const cloudMaterial = this.toyMaterial(0xffffff, { roughness: 0.72, opacity: 0.92, emissive: 0xffffff, emissiveIntensity: 0.04 });
    const hillMaterial = this.toyMaterial(theme === "webwoud" ? 0x16a34a : theme === "city" ? 0x7dd3fc : 0x22c55e, { roughness: 0.8 });
    [-5.8, -2.2, 2.7, 5.6].forEach((x, index) => {
      const hill = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72 + (index % 2) * 0.18, 0), hillMaterial);
      hill.position.set(x, 0.38, -7.6 - (index % 2) * 0.55);
      hill.scale.set(1.5, 0.62, 0.72);
      this.addWorldObject(hill, "toy-soft-hill", theme);
    });
    [
      { x: -4.8, y: 3.05, z: -6.9 },
      { x: 4.6, y: 3.25, z: -7.5 },
      { x: 0.6, y: 3.55, z: -8.4 }
    ].forEach((spot, cloudIndex) => {
      for (let puff = 0; puff < 3; puff += 1) {
        const cloud = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + puff * 0.05, 0), cloudMaterial);
        cloud.position.set(spot.x + (puff - 1) * 0.34, spot.y + (puff % 2) * 0.08, spot.z);
        cloud.userData = { toyCloudIndex: cloudIndex };
        this.addWorldObject(cloud, "toy-cloud", theme, true);
      }
    });
    const sparkleMaterial = this.toyMaterial(accent, { roughness: 0.38, emissive: accent, emissiveIntensity: 0.16 });
    [-3.3, 3.3].forEach((x, index) => {
      const sparkle = new THREE.Mesh(new THREE.TetrahedronGeometry(0.22, 0), sparkleMaterial);
      sparkle.position.set(x, 1.35 + index * 0.18, -5.9 - index * 0.54);
      this.addWorldObject(sparkle, "toy-side-sparkle", theme, true);
    });
  }

  private setCameraForTheme(theme: "menu" | "runner" | "webwoud" | "city" | "summary" | "minigame"): void {
    if (theme === "runner") {
      this.camera.position.set(0, 2.9, 6.25);
      this.camera.lookAt(0, 0.86, -3.05);
    } else if (theme === "webwoud") {
      this.camera.position.set(0, 3.25, 6.35);
      this.camera.lookAt(0, 1.2, -3.0);
    } else if (theme === "city") {
      this.camera.position.set(0, 3.35, 6.9);
      this.camera.lookAt(0, 0.98, -3.05);
    } else if (theme === "minigame") {
      this.camera.position.set(0, 3.15, 6.45);
      this.camera.lookAt(0, 0.92, -3.0);
    } else {
      this.camera.position.set(0, 4.2, 8.5);
      this.camera.lookAt(0, 0.6, 0);
    }
  }

  private addGate3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const gateColor = phase === "success" && selected ? 0x86efac : phase === "scaffold" && selected ? 0xbfdbfe : selected ? 0xfef3c7 : 0xe2e8f0;
    const material = this.toyMaterial(gateColor, { roughness: 0.5, opacity: selected ? 1 : 0.48, emissiveIntensity: selected ? 0.12 : 0.02 });
    const edge = this.toyMaterial(0x172033, { roughness: 0.65, opacity: selected ? 1 : 0.38, emissive: 0x172033, emissiveIntensity: 0 });
    [
      { w: 0.2, h: 1.72, d: 0.22, px: -0.78, py: 0.96 },
      { w: 0.2, h: 1.72, d: 0.22, px: 0.78, py: 0.96 },
      { w: 1.74, h: 0.2, d: 0.24, px: 0, py: 1.8 }
    ].forEach((part) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(part.w, part.h, part.d), material);
      mesh.position.set(x + part.px, part.py, z);
      this.addGameplayObject(mesh);
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.3), edge);
    base.position.set(x, 0.12, z + 0.06);
    this.addGameplayObject(base);
  }

  private addRunnerMechanic3d(challenge: Challenge, x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    if (challenge.mechanic === "subitize-boost") {
      this.addBoostPads3d(x, z, selected, phase);
      return;
    }
    if (challenge.mechanic === "jump-platform") {
      this.addJumpPlatforms3d(x, z, selected, phase);
      return;
    }
    if (challenge.mechanic === "shortcut-route") {
      this.addShortcutRoute3d(x, z, selected, phase);
      return;
    }
    if (challenge.mechanic === "dino-streak") {
      this.addDinoStreakTrack3d(x, z, selected, phase);
      return;
    }
    if (challenge.challengeType === "enemy-wave-compare") {
      this.addEnemyWave3d(x, z, selected, phase);
      return;
    }
    if (challenge.challengeType === "flash-gates") {
      this.addGate3d(x, z, selected, phase);
      return;
    }

    this.addMinigameChoice3d(challenge.challengeType, x, z + 0.05, selected, phase);
  }

  private addChoicePad3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold", theme: "runner" | "webwoud" | "minigame" | "city"): void {
    const color =
      phase === "success" && selected
        ? 0x86efac
        : phase === "scaffold" && selected
          ? 0x93c5fd
          : selected
            ? 0xfacc15
            : theme === "webwoud"
              ? 0xa7f3d0
              : 0xdbeafe;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(selected ? 2.06 : 1.28, 0.08, selected ? 1.32 : 0.72), this.toyMaterial(color, { roughness: 0.42, opacity: selected ? 1 : 0.34, emissiveIntensity: selected ? 0.18 : 0.03 }));
    pad.position.set(x, 0.11, z + 0.18);
    this.addGameplayObject(pad);
    if (!selected) return;
    const rimMaterial = this.toyMaterial(0xffffff, { roughness: 0.34, emissive: 0xffffff, emissiveIntensity: 0.12 });
    [-0.72, 0.72].forEach((offset) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.12), rimMaterial);
      rail.position.set(x + offset, 0.19, z + 0.18);
      this.addGameplayObject(rail);
    });
  }

  private addBoostPads3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" && selected ? 0x86efac : phase === "scaffold" && selected ? 0x93c5fd : selected ? 0xfacc15 : 0x38bdf8;
    const material = this.toyMaterial(color, { roughness: 0.42, opacity: selected ? 1 : 0.45, emissiveIntensity: selected ? 0.18 : 0.04 });
    const railMaterial = this.toyMaterial(0x172033, { roughness: 0.65, opacity: selected ? 1 : 0.34, emissive: 0x172033, emissiveIntensity: 0 });
    for (let step = 0; step < 3; step += 1) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.18 - step * 0.12, 0.12, 0.42), material);
      pad.position.set(x, 0.22 + step * 0.04, z + 0.62 - step * 0.52);
      this.addGameplayObject(pad);
    }
    [-0.56, 0.56].forEach((offset) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 1.72), railMaterial);
      rail.position.set(x + offset, 0.24, z + 0.1);
      this.addGameplayObject(rail);
    });
  }

  private addJumpPlatforms3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" && selected ? 0x86efac : phase === "scaffold" && selected ? 0xbfdbfe : selected ? 0xfef08a : 0xa7f3d0;
    const material = this.toyMaterial(color, { roughness: 0.5, opacity: selected ? 1 : 0.45, emissiveIntensity: selected ? 0.14 : 0.03 });
    for (let step = 0; step < 3; step += 1) {
      const platform = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.62), material);
      platform.position.set(x + (step - 1) * 0.34, 0.32 + step * 0.24, z + 0.38 - step * 0.34);
      this.addGameplayObject(platform);
    }
  }

  private addShortcutRoute3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" && selected ? 0x4ade80 : phase === "scaffold" && selected ? 0x93c5fd : selected ? 0xfacc15 : 0x60a5fa;
    const material = this.toyMaterial(color, { roughness: 0.48, opacity: selected ? 1 : 0.42, emissiveIntensity: selected ? 0.16 : 0.03 });
    for (let step = 0; step < 5; step += 1) {
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.38), material);
      stone.position.set(x + (step - 2) * 0.22, 0.22 + step * 0.02, z + 0.8 - step * 0.36);
      this.addGameplayObject(stone);
    }
    [-0.44, 0.44].forEach((offset) => {
      const marker = new THREE.Mesh(new THREE.TetrahedronGeometry(0.22, 0), material);
      marker.position.set(x + offset, 0.52, z - 0.45);
      this.addGameplayObject(marker);
    });
  }

  private addDinoStreakTrack3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" && selected ? 0x86efac : phase === "scaffold" && selected ? 0xbfdbfe : selected ? 0xfacc15 : 0x38bdf8;
    const material = this.toyMaterial(color, { roughness: 0.5, opacity: selected ? 1 : 0.44, emissiveIntensity: selected ? 0.14 : 0.03 });
    [-0.28, 0.28].forEach((offset) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 1.72), material);
      rail.position.set(x + offset, 0.28, z + 0.02);
      this.addGameplayObject(rail);
    });
    [-0.34, 0, 0.34].forEach((offset, index) => {
      const friend = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), material);
      friend.position.set(x + offset, 0.72 + (index % 2) * 0.1, z - 0.28 + index * 0.18);
      this.addGameplayObject(friend);
    });
  }

  private addEnemyWave3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" && selected ? 0x86efac : phase === "scaffold" && selected ? 0x93c5fd : selected ? 0xf97316 : 0xfb7185;
    const material = this.toyMaterial(color, { roughness: 0.55, opacity: selected ? 1 : 0.42, emissiveIntensity: selected ? 0.12 : 0.03 });
    for (let step = 0; step < 5; step += 1) {
      const wave = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 + (step % 2) * 0.05, 0), material);
      wave.position.set(x + (step - 2) * 0.28, 0.42 + (step % 2) * 0.18, z + 0.18 - Math.abs(step - 2) * 0.12);
      this.addGameplayObject(wave);
    }
  }

  private addAnchor3d(x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.2), this.toyMaterial(0x15803d, { roughness: 0.7, opacity: selected ? 1 : 0.42 }));
    vine.position.set(x, 2.25, z);
    this.addGameplayObject(vine);
    const color = phase === "success" && selected ? 0xfacc15 : phase === "scaffold" && selected ? 0x93c5fd : selected ? 0xa7f3d0 : 0xdbeafe;
    const material = this.toyMaterial(color, { roughness: 0.5, opacity: selected ? 1 : 0.48, emissiveIntensity: selected ? 0.14 : 0.03 });
    [
      { w: 0.78, h: 0.09, px: 0, py: 1.28 },
      { w: 0.78, h: 0.09, px: 0, py: 0.72 },
      { w: 0.09, h: 0.66, px: -0.34, py: 1 },
      { w: 0.09, h: 0.66, px: 0.34, py: 1 }
    ].forEach((part) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(part.w, part.h, 0.12), material);
      mesh.position.set(x + part.px, part.py, z);
      this.addGameplayObject(mesh);
    });
  }

  private addQuantityBlocks3d(quantity: number, x: number, y: number, z: number, selected: boolean): void {
    const q = Math.max(1, Math.min(10, Math.round(quantity)));
    const materialTop = this.toyMaterial(selected ? 0xfacc15 : 0x60a5fa, { roughness: 0.5, opacity: selected ? 1 : 0.5, emissiveIntensity: selected ? 0.12 : 0.03 });
    const materialBottom = this.toyMaterial(selected ? 0xfb923c : 0x38bdf8, { roughness: 0.5, opacity: selected ? 1 : 0.5, emissiveIntensity: selected ? 0.12 : 0.03 });
    for (let index = 0; index < q; index += 1) {
      const row = index < 5 ? 0 : 1;
      const col = index % 5;
      const block = new THREE.Mesh(new THREE.BoxGeometry(selected ? 0.34 : 0.3, selected ? 0.28 : 0.24, selected ? 0.3 : 0.26), row === 0 ? materialTop : materialBottom);
      block.position.set(x + (col - 2) * 0.39, y + row * 0.35, z + row * 0.1);
      this.addGameplayObject(block);
    }
  }

  private addNumberPickupTrail3d(
    quantity: number,
    x: number,
    startZ: number,
    endZ: number,
    progress: number,
    phase: "approach" | "success" | "scaffold",
    mode: "runner" | "webwoud" | "minigame" | "city"
  ): void {
    const q = Math.max(1, Math.min(10, Math.round(quantity)));
    const clamped = Math.max(0, Math.min(1, progress));
    const firstFive = new THREE.MeshStandardMaterial({ color: phase === "scaffold" ? 0xbfdbfe : mode === "city" ? 0xfacc15 : 0xfef08a, roughness: 0.36 });
    const extras = new THREE.MeshStandardMaterial({ color: phase === "success" ? 0x86efac : mode === "webwoud" ? 0x38bdf8 : 0xa7f3d0, roughness: 0.36 });
    const collected = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28 });
    const chainMaterial = this.toyMaterial(phase === "scaffold" ? 0x93c5fd : phase === "success" ? 0x86efac : 0xfacc15, { roughness: 0.3, opacity: 0.74, emissiveIntensity: 0.1 });
    for (let index = 0; index < q; index += 1) {
      const row = index < 5 ? 0 : 1;
      const col = index % 5;
      const t = (index + 1) / (q + 1);
      const isCollected = phase === "success" || t <= clamped + 0.03;
      const pickup = new THREE.Mesh(new THREE.OctahedronGeometry(isCollected ? 0.14 : 0.11, 0), isCollected ? collected : row === 0 ? firstFive : extras);
      pickup.position.set(x + (col - 2) * 0.08 + (row === 1 ? 0.16 : -0.16), 0.42 + row * 0.18 + (isCollected ? 0.12 : 0), startZ + (endZ - startZ) * t);
      pickup.scale.set(isCollected ? 1.18 : 1, isCollected ? 1.18 : 1, isCollected ? 1.18 : 1);
      this.addTaggedGameplayObject(pickup, "number-pickup", {
        pickupMode: mode,
        pickupIndex: index,
        pickupGroup: row === 0 ? "first-five" : "extras",
        pickupCollected: isCollected
      });
      if (index > 0) {
        const previousT = index / (q + 1);
        const chain = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, Math.abs(endZ - startZ) / (q + 1) * 0.74), chainMaterial);
        chain.position.set(x + (row === 1 ? 0.16 : -0.16), 0.35 + row * 0.16, startZ + (endZ - startZ) * ((previousT + t) / 2));
        chain.rotation.y = (row === 0 ? -1 : 1) * 0.08;
        this.addTaggedGameplayObject(chain, "pickup-chain", { pickupMode: mode, chainIndex: index - 1 });
      }
    }
  }

  private addHero3d(x: number, z: number, phase: "approach" | "success" | "scaffold", mode: "runner" | "webwoud" | "minigame" | "city", progress = 0): void {
    const clamped = Math.max(0, Math.min(1, progress));
    const bounce = phase === "success" ? 0.18 : phase === "scaffold" ? 0.04 : Math.sin(clamped * Math.PI * 6) * 0.055;
    const lean = mode === "webwoud" ? Math.sin(clamped * Math.PI) * 0.22 : phase === "success" ? -0.16 : -0.06 - clamped * 0.1;
    const stride = Math.sin(clamped * Math.PI * 8);
    const color = phase === "scaffold" ? 0x93c5fd : mode === "webwoud" ? 0x38bdf8 : mode === "minigame" ? 0xf97316 : 0x4ade80;
    const bodyMaterial = this.toyMaterial(color, { roughness: 0.42, emissiveIntensity: 0.08 });
    const headMaterial = this.toyMaterial(phase === "scaffold" ? 0xbfdbfe : 0x86efac, { roughness: 0.42, emissiveIntensity: 0.08 });
    const bellyMaterial = this.toyMaterial(0xfef3c7, { roughness: 0.46, emissiveIntensity: 0.05 });
    const spikeMaterial = this.toyMaterial(mode === "runner" ? 0xfacc15 : mode === "webwoud" ? 0xa7f3d0 : 0xfef08a, { roughness: 0.36, emissiveIntensity: 0.12 });
    const inkMaterial = this.toyMaterial(0x172033, { roughness: 0.35, emissive: 0x172033, emissiveIntensity: 0 });
    const glowMaterial = this.toyMaterial(phase === "success" ? 0x86efac : 0xfacc15, { roughness: 0.28, opacity: 0.62, emissive: phase === "success" ? 0x86efac : 0xfacc15, emissiveIntensity: 0.24 });
    const parts: Array<{ mesh: THREE.Mesh; role: string }> = [];

    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.04, 0.78), glowMaterial);
    glow.position.set(x, 0.13, z + 0.02);
    glow.scale.set(1 + clamped * 0.18, 1, 1 + clamped * 0.12);
    parts.push({ mesh: glow, role: "hero-glow-pad" });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.76), bodyMaterial);
    body.position.set(x, 0.54 + bounce, z);
    body.rotation.x = lean;
    body.rotation.z = phase === "success" ? 0.1 : 0;
    parts.push({ mesh: body, role: "hero-body" });

    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.24, 0.12), bellyMaterial);
    belly.position.set(x, 0.54 + bounce, z - 0.4);
    belly.rotation.x = lean;
    parts.push({ mesh: belly, role: "hero-belly" });

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), headMaterial);
    head.position.set(x + 0.24, 0.84 + bounce, z - 0.3);
    head.rotation.x = lean * 0.74;
    parts.push({ mesh: head, role: "hero-head" });

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.22), bellyMaterial);
    snout.position.set(x + 0.35, 0.8 + bounce, z - 0.55);
    snout.rotation.x = lean * 0.74;
    parts.push({ mesh: snout, role: "hero-snout" });

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.04), inkMaterial);
    eye.position.set(x + 0.42, 0.91 + bounce, z - 0.66);
    parts.push({ mesh: eye, role: "hero-eye" });

    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), spikeMaterial);
    cheek.position.set(x + 0.46, 0.78 + bounce, z - 0.64);
    parts.push({ mesh: cheek, role: "hero-cheek" });

    const tail = new THREE.Mesh(new THREE.TetrahedronGeometry(0.3, 0), bodyMaterial);
    tail.position.set(x - 0.44, 0.54 + bounce, z + 0.27);
    tail.rotation.y = -0.55 + stride * 0.25;
    tail.rotation.x = -lean * 0.5;
    parts.push({ mesh: tail, role: "hero-tail" });

    [-0.17, 0.17].forEach((offset, index) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.2), headMaterial);
      leg.position.set(x + offset, 0.26 + bounce * 0.22, z + (index === 0 ? -0.18 : 0.16));
      leg.rotation.x = (index === 0 ? stride : -stride) * 0.28;
      parts.push({ mesh: leg, role: "hero-leg" });
    });

    [-0.24, 0.24].forEach((offset) => {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.28), spikeMaterial);
      boot.position.set(x + offset, 0.13 + Math.max(0, stride * offset) * 0.06, z - 0.2);
      parts.push({ mesh: boot, role: "hero-boost-boot" });
    });

    if (mode !== "webwoud") {
      [-0.22, 0, 0.22].forEach((offset, index) => {
        const streak = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.72 - index * 0.12), glowMaterial);
        streak.position.set(x + offset, 0.26 + index * 0.05, z + 0.56 + index * 0.18 + clamped * 0.16);
        streak.scale.set(1, 1, 1 + clamped * 0.42);
        parts.push({ mesh: streak, role: "hero-speed-streak" });
      });
    }

    [-0.18, 0.02, 0.22].forEach((offset, index) => {
      const spike = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12, 0), spikeMaterial);
      spike.position.set(x - 0.08 + index * 0.1, 0.82 + bounce - index * 0.05, z + offset);
      spike.rotation.y = 0.78;
      parts.push({ mesh: spike, role: "hero-spike" });
    });

    if (mode === "webwoud") {
      const cape = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.58), spikeMaterial);
      cape.position.set(x - 0.42, 0.6 + bounce, z - 0.04);
      cape.rotation.z = -0.18 - Math.sin(clamped * Math.PI) * 0.28;
      parts.push({ mesh: cape, role: "hero-web-cape" });
    }

    parts.forEach(({ mesh, role }) => {
      mesh.userData = { ...mesh.userData, blokblitzRole: role, heroMode: mode, heroProgress: clamped, heroPhase: phase };
      this.addGameplayObject(mesh);
    });
  }

  private addRunnerGuide3d(x: number, progress: number, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" ? 0x4ade80 : phase === "scaffold" ? 0x93c5fd : 0xfacc15;
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.42 });
    const clamped = Math.max(0, Math.min(1, progress));
    for (let step = 0; step < 5; step += 1) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.42), material);
      pad.position.set(x, 0.14 + step * 0.015, 2.2 - clamped * 1.2 - step * 1.02);
      this.addGameplayObject(pad);
    }
  }

  private addWebGuide3d(x: number, progress: number, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" ? 0xfacc15 : phase === "scaffold" ? 0x93c5fd : 0x38bdf8;
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const clamped = Math.max(0, Math.min(1, progress));
    for (let step = 0; step < 5; step += 1) {
      const bead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), material);
      bead.position.set(x * (0.3 + step * 0.14), 2.2 - Math.abs(step - 2) * 0.28, 1.42 - clamped * 1.15 - step * 0.74);
      this.addGameplayObject(bead);
    }
  }

  private addScaffoldBeacon3d(x: number, y: number, z: number, mode: "runner" | "webwoud" | "minigame" | "city"): void {
    const ringMaterial = this.toyMaterial(0xbfdbfe, { roughness: 0.32, opacity: 0.86, emissive: 0x60a5fa, emissiveIntensity: 0.22 });
    const arrowMaterial = this.toyMaterial(0xfef08a, { roughness: 0.32, emissive: 0xfacc15, emissiveIntensity: 0.18 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 8, 24), ringMaterial);
    ring.position.set(x, y, z);
    ring.rotation.x = Math.PI / 2;
    this.addTaggedGameplayObject(ring, "scaffold-target-beacon", { scaffoldMode: mode });

    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 4), arrowMaterial);
    arrow.position.set(x, y + 0.46, z);
    arrow.rotation.x = Math.PI;
    arrow.rotation.y = Math.PI / 4;
    this.addTaggedGameplayObject(arrow, "scaffold-target-pointer", { scaffoldMode: mode });
  }

  private addRunnerOutcome3d(x: number, z: number, phase: "success" | "scaffold"): void {
    if (phase === "success") {
      this.addStarCluster3d(x, 1.9, z - 0.25, 0xfef08a, "runner-win-star");
      [-0.48, 0.48].forEach((offset) => {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.45 }));
        block.position.set(x + offset, 0.46, z - 0.55);
        this.addTaggedGameplayObject(block, "runner-win-block");
      });
      return;
    }

    const material = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, roughness: 0.55 });
    for (let step = 0; step < 5; step += 1) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.38), material);
      pad.position.set(x + (step - 2) * 0.28, 0.24, z + step * 0.2);
      this.addTaggedGameplayObject(pad, "scaffold-step", { scaffoldMode: "runner" });
    }
  }

  private addWebOutcome3d(x: number, z: number, phase: "success" | "scaffold"): void {
    if (phase === "success") {
      this.addStarCluster3d(x, 1.78, z - 0.35, 0xfacc15, "webwoud-rescue-star");
      const friend = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), new THREE.MeshStandardMaterial({ color: 0xa7f3d0, roughness: 0.45 }));
      friend.position.set(x, 1.05, z - 0.32);
      this.addTaggedGameplayObject(friend, "webwoud-freed-friend");
      [-0.32, 0.32].forEach((offset) => {
        const openBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 }));
        openBar.position.set(x + offset, 0.98, z - 0.62);
        openBar.rotation.z = offset > 0 ? -0.58 : 0.58;
        this.addTaggedGameplayObject(openBar, "webwoud-open-cage");
      });
      return;
    }

    const material = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.55 });
    for (let step = 0; step < 6; step += 1) {
      const net = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.18), material);
      net.position.set(x + (step - 2.5) * 0.22, 0.44 + (step % 2) * 0.08, z + 0.16);
      this.addTaggedGameplayObject(net, "scaffold-step", { scaffoldMode: "webwoud" });
    }
  }

  private addMinigameChoice3d(type: string, x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    const baseColor = phase === "success" && selected ? 0x86efac : phase === "scaffold" && selected ? 0xbfdbfe : selected ? 0xfef3c7 : 0xe2e8f0;
    const base = new THREE.Mesh(new THREE.BoxGeometry(selected ? 1.82 : 1.28, 0.16, selected ? 1.12 : 0.78), this.toyMaterial(baseColor, { roughness: 0.56, opacity: selected ? 1 : 0.4, emissiveIntensity: selected ? 0.14 : 0.03 }));
    base.position.set(x, 0.16, z + 0.12);
    this.addGameplayObject(base);

    if (type === "flash-gates") {
      this.addGate3d(x, z - 0.08, selected, phase);
      return;
    }
    if (type === "web-anchors") {
      this.addAnchor3d(x, z - 0.02, selected, phase);
      return;
    }

    const material = this.toyMaterial(selected ? 0xfacc15 : 0x60a5fa, { roughness: 0.46, opacity: selected ? 1 : 0.5, emissiveIntensity: selected ? 0.14 : 0.03 });
    const warmMaterial = this.toyMaterial(selected ? 0xfb923c : 0xf6c453, { roughness: 0.5, opacity: selected ? 1 : 0.5, emissiveIntensity: selected ? 0.12 : 0.03 });
    if (type === "make-ten-shield") {
      const shield = new THREE.Mesh(new THREE.DodecahedronGeometry(0.54, 0), material);
      shield.position.set(x, 0.92, z);
      this.addGameplayObject(shield);
      return;
    }
    if (type === "split-chests") {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.58, 0.58), warmMaterial);
      chest.position.set(x, 0.68, z);
      this.addGameplayObject(chest);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 0.66), material);
      lid.position.set(x, 1.06, z - (phase === "success" && selected ? 0.28 : 0));
      this.addGameplayObject(lid);
      return;
    }
    if (type === "bead-bridge" || type === "train-of-ten" || type === "double-track" || type === "one-more-one-less") {
      for (let step = 0; step < 4; step += 1) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.8), step % 2 === 0 ? warmMaterial : material);
        plank.position.set(x + (step - 1.5) * 0.34, 0.72, z);
        this.addGameplayObject(plank);
      }
      return;
    }
    if (type === "rescue-the-herd") {
      const friend = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), this.toyMaterial(0x86efac, { roughness: 0.45, opacity: selected ? 1 : 0.5, emissiveIntensity: selected ? 0.1 : 0.03 }));
      friend.position.set(x, 0.86, z - 0.12);
      this.addGameplayObject(friend);
      [-0.44, 0, 0.44].forEach((offset) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.08), material);
        bar.position.set(x + offset, 0.86, z + 0.34);
        this.addGameplayObject(bar);
      });
      return;
    }
    if (type === "build-the-number") {
      for (let step = 0; step < 5; step += 1) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.36), step % 2 === 0 ? material : warmMaterial);
        block.position.set(x + (step % 3 - 1) * 0.34, 0.54 + Math.floor(step / 3) * 0.34, z);
        this.addGameplayObject(block);
      }
      return;
    }

    const gem = new THREE.Mesh(type === "dice-hunt" || type === "enemy-wave-compare" ? new THREE.IcosahedronGeometry(0.52, 0) : new THREE.DodecahedronGeometry(0.46, 0), material);
    gem.position.set(x, 0.84, z);
    this.addGameplayObject(gem);
  }

  private addMinigameGuide3d(x: number, progress: number, phase: "approach" | "success" | "scaffold"): void {
    const material = this.toyMaterial(phase === "success" ? 0x4ade80 : phase === "scaffold" ? 0x93c5fd : 0xfacc15, { roughness: 0.42, emissiveIntensity: 0.14 });
    const clamped = Math.max(0, Math.min(1, progress));
    for (let step = 0; step < 5; step += 1) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.36), material);
      pad.position.set(x, 0.18 + step * 0.01, 1.1 - clamped * 0.92 - step * 0.72);
      this.addGameplayObject(pad);
    }
  }

  private addMinigameOutcome3d(x: number, z: number, phase: "success" | "scaffold"): void {
    if (phase === "success") {
      this.addStarCluster3d(x, 1.8, z - 0.35, 0xfef08a, "minigame-win-star");
      const rescue = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), this.toyMaterial(0xa7f3d0, { roughness: 0.45, emissiveIntensity: 0.08 }));
      rescue.position.set(x + 0.48, 0.92, z - 0.45);
      this.addTaggedGameplayObject(rescue, "minigame-prize-friend");
      return;
    }
    const material = this.toyMaterial(0xbfdbfe, { roughness: 0.55, opacity: 0.82, emissiveIntensity: 0.05 });
    for (let step = 0; step < 6; step += 1) {
      const cue = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.22), material);
      cue.position.set(x + (step - 2.5) * 0.22, 0.32 + (step % 2) * 0.05, z + 0.18);
      this.addTaggedGameplayObject(cue, "scaffold-step", { scaffoldMode: "minigame" });
    }
  }

  private addCityBuildChoice3d(type: string, x: number, z: number, selected: boolean, phase: "approach" | "success" | "scaffold"): void {
    this.addMinigameChoice3d(type, x, z, selected, phase);
    const frameMaterial = this.toyMaterial(phase === "success" && selected ? 0x4ade80 : selected ? 0xfacc15 : 0xa7f3d0, { roughness: 0.52, opacity: selected ? 1 : 0.45, emissiveIntensity: selected ? 0.15 : 0.03 });
    [
      { w: 1.34, h: 0.12, d: 0.12, px: 0, py: 1.36, pz: -0.58 },
      { w: 0.12, h: 1.0, d: 0.12, px: -0.62, py: 0.86, pz: -0.58 },
      { w: 0.12, h: 1.0, d: 0.12, px: 0.62, py: 0.86, pz: -0.58 }
    ].forEach((part) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(part.w, part.h, part.d), frameMaterial);
      frame.position.set(x + part.px, part.py, z + part.pz);
      this.addGameplayObject(frame);
    });
  }

  private addCityBuildGuide3d(x: number, progress: number, phase: "approach" | "success" | "scaffold"): void {
    const color = phase === "success" ? 0x4ade80 : phase === "scaffold" ? 0x93c5fd : 0xfacc15;
    const material = this.toyMaterial(color, { roughness: 0.45, emissiveIntensity: 0.14 });
    const clamped = Math.max(0, Math.min(1, progress));
    for (let step = 0; step < 5; step += 1) {
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.28), material);
      brick.position.set(x + (step % 2 ? 0.24 : -0.24), 0.28 + step * 0.18, -0.72 - clamped * 0.88 - step * 0.44);
      this.addGameplayObject(brick);
    }
  }

  private addCityBuildOutcome3d(x: number, z: number, phase: "success" | "scaffold"): void {
    if (phase === "success") {
      this.addStarCluster3d(x, 2.0, z - 0.4, 0xfef08a, "city-build-star");
      const roof = new THREE.Mesh(new THREE.TetrahedronGeometry(0.58, 0), this.toyMaterial(0xf97316, { roughness: 0.42, emissiveIntensity: 0.12 }));
      roof.position.set(x, 1.45, z - 0.55);
      this.addTaggedGameplayObject(roof, "city-built-roof");
      for (let step = 0; step < 6; step += 1) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), this.toyMaterial(step % 2 ? 0x60a5fa : 0xa7f3d0, { roughness: 0.5, emissiveIntensity: 0.08 }));
        block.position.set(x + (step % 3 - 1) * 0.34, 0.56 + Math.floor(step / 3) * 0.32, z - 0.48);
        this.addTaggedGameplayObject(block, "city-built-block", { buildBlockIndex: step });
      }
      return;
    }
    const material = this.toyMaterial(0xbfdbfe, { roughness: 0.55, opacity: 0.82, emissiveIntensity: 0.04 });
    for (let step = 0; step < 6; step += 1) {
      const support = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.24), material);
      support.position.set(x + (step - 2.5) * 0.2, 0.35 + (step % 2) * 0.06, z + 0.1);
      this.addTaggedGameplayObject(support, "scaffold-step", { scaffoldMode: "city" });
    }
  }

  private addStarCluster3d(x: number, y: number, z: number, color: number, role = "win-star"): void {
    const material = this.toyMaterial(color, { roughness: 0.34, emissive: color, emissiveIntensity: 0.2 });
    for (let index = 0; index < 6; index += 1) {
      const star = new THREE.Mesh(new THREE.TetrahedronGeometry(0.16, 0), material);
      star.position.set(x + (index - 2.5) * 0.22, y + (index % 3) * 0.18, z + Math.sin(index) * 0.18);
      star.rotation.z = index * 0.42;
      this.addTaggedGameplayObject(star, role, { starIndex: index });
    }
  }

  private addRunnerLandmarks3d(accent: number): void {
    const archMaterial = this.toyMaterial(0xfacc15, { roughness: 0.42, emissive: 0xfacc15, emissiveIntensity: 0.08 });
    const trimMaterial = this.toyMaterial(accent, { roughness: 0.46, emissive: accent, emissiveIntensity: 0.08 });
    [
      { w: 0.18, h: 1.2, d: 0.2, x: -3.3, y: 0.66, z: -7.2 },
      { w: 0.18, h: 1.2, d: 0.2, x: 3.3, y: 0.66, z: -7.2 },
      { w: 6.6, h: 0.2, d: 0.24, x: 0, y: 1.34, z: -7.2 }
    ].forEach((part) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(part.w, part.h, part.d), archMaterial);
      mesh.position.set(part.x, part.y, part.z);
      this.addWorldObject(mesh, "runner-star-arch", "runner");
    });
    [-4.2, 4.2].forEach((x, index) => {
      const flag = new THREE.Mesh(new THREE.TetrahedronGeometry(0.34, 0), trimMaterial);
      flag.position.set(x, 1.68, -3.8 - index * 1.0);
      this.addWorldObject(flag, "runner-dino-flag", "runner", true);
    });
  }

  private addWebWoudLandmarks3d(accent: number): void {
    const cageMaterial = this.toyMaterial(0xfef3c7, { roughness: 0.52 });
    const friendMaterial = this.toyMaterial(0xa7f3d0, { roughness: 0.42, emissiveIntensity: 0.08 });
    [-3.0, 3.0].forEach((x, cageIndex) => {
      const friend = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), friendMaterial);
      friend.position.set(x, 1.12, -4.9 + cageIndex * 0.8);
      this.addWorldObject(friend, "webwoud-rescue-friend", "webwoud", true);
      [-0.32, 0, 0.32].forEach((offset) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.84, 0.08), cageMaterial);
        bar.position.set(x + offset, 1.12, -4.55 + cageIndex * 0.8);
        this.addWorldObject(bar, "webwoud-rescue-cage", "webwoud");
      });
    });
    const beacon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), this.toyMaterial(accent, { roughness: 0.36, emissive: accent, emissiveIntensity: 0.14 }));
    beacon.position.set(0, 2.68, -4.2);
    this.addWorldObject(beacon, "webwoud-canopy-star", "webwoud", true);
  }

  private addMinigameLandmarks3d(accent: number): void {
    const portalMaterial = this.toyMaterial(accent, { roughness: 0.42, emissive: accent, emissiveIntensity: 0.08 });
    const glowMaterial = this.toyMaterial(0xfef08a, { roughness: 0.3, emissive: 0xfef08a, emissiveIntensity: 0.2 });
    [-3.3, 3.3].forEach((x) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.42), portalMaterial);
      tower.position.set(x, 0.68, -4.4);
      this.addWorldObject(tower, "minigame-practice-tower", "minigame");
      const cap = new THREE.Mesh(new THREE.TetrahedronGeometry(0.36, 0), glowMaterial);
      cap.position.set(x, 1.48, -4.4);
      this.addWorldObject(cap, "minigame-practice-star", "minigame", true);
    });
    const portal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), glowMaterial);
    portal.position.set(0, 1.05, -4.55);
    this.addWorldObject(portal, "minigame-number-portal", "minigame", true);
  }

  private addCityLandmarks3d(accent: number): void {
    const towerMaterial = this.toyMaterial(accent, { roughness: 0.54, emissiveIntensity: 0.06 });
    const lightMaterial = this.toyMaterial(0xfef08a, { roughness: 0.34, emissive: 0xfef08a, emissiveIntensity: 0.18 });
    for (let index = 0; index < 10; index += 1) {
      const row = index < 5 ? 0 : 1;
      const col = index % 5;
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.32), row === 0 ? towerMaterial : lightMaterial);
      block.position.set((col - 2) * 0.38, 0.34 + row * 0.32, -5.95 + row * 0.16);
      this.addWorldObject(block, "city-ten-tower", "city");
    }
    const beacon = new THREE.Mesh(new THREE.TetrahedronGeometry(0.44, 0), lightMaterial);
    beacon.position.set(0, 1.28, -5.8);
    this.addWorldObject(beacon, "city-star-beacon", "city", true);
  }

  private addRunnerWorld(accent: number): void {
    const laneMaterial = this.toyMaterial(0x475569, { roughness: 0.66, emissive: 0x111827, emissiveIntensity: 0.01 });
    const railMaterial = this.toyMaterial(0xa7f3d0, { roughness: 0.5, emissiveIntensity: 0.04 });
    for (let lane = -1; lane <= 1; lane += 1) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 18), laneMaterial);
      strip.position.set(lane * 2.1, 0.02, -2);
      this.world.add(strip);
    }
    [-3.25, 3.25].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 17.5), railMaterial);
      rail.position.set(x, 0.16, -2);
      this.addWorldObject(rail, "runner-soft-rail", "runner");
    });
    const dashMaterial = this.toyMaterial(0xfef3c7, { roughness: 0.5 });
    for (let lane = -1; lane <= 1; lane += 1) {
      for (let dash = 0; dash < 8; dash += 1) {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.56), dashMaterial);
        marker.position.set(lane * 2.1, 0.1, 3.8 - dash * 1.75);
        this.world.add(marker);
      }
    }
    for (let i = 0; i < 10; i += 1) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.42 + (i % 3) * 0.1, 0.42 + (i % 2) * 0.16, 0.42),
        this.toyMaterial(i % 2 === 0 ? accent : 0x38bdf8, { roughness: 0.6, opacity: 0.92, emissiveIntensity: 0.04 })
      );
      const side = i % 2 === 0 ? -1 : 1;
      cube.position.set(side * (3.8 + (i % 3) * 0.46), 0.42, 1.8 - i * 1.05);
      cube.rotation.y = i * 0.35;
      this.world.add(cube);
      this.animatedObjects.push(cube);
    }
    this.addRunnerLandmarks3d(accent);
  }

  private addWebWorld(accent: number): void {
    for (let i = 0; i < 9; i += 1) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.4), this.toyMaterial(0x7c4a22, { roughness: 0.72 }));
      trunk.position.set(-6 + i * 1.5, 1.45, -2.8 - (i % 3));
      this.world.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), this.toyMaterial(i % 2 ? 0x16a34a : 0x22c55e, { roughness: 0.64, emissiveIntensity: 0.04 }));
      crown.position.set(trunk.position.x, 3.35, trunk.position.z);
      this.world.add(crown);
    }
    const vineMaterial = new THREE.LineBasicMaterial({ color: accent, linewidth: 4 });
    for (let i = 0; i < 5; i += 1) {
      const points = [new THREE.Vector3(-4 + i * 2, 3.4, -2), new THREE.Vector3(-3 + i * 2, 1.7, -2.5), new THREE.Vector3(-2 + i * 2, 3.1, -2)];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), vineMaterial);
      this.world.add(line);
    }
    this.addWebWoudLandmarks3d(accent);
  }

  private addMinigameWorld(accent: number): void {
    const pathMaterial = this.toyMaterial(0x334155, { roughness: 0.68, emissive: 0x111827, emissiveIntensity: 0.01 });
    for (let lane = -1; lane <= 1; lane += 1) {
      const path = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.08, 12.5), pathMaterial);
      path.position.set(lane * 2.55, 0.02, -2.1);
      this.world.add(path);
    }
    for (let index = 0; index < 12; index += 1) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.45, 0.45),
        this.toyMaterial(index % 3 === 0 ? accent : index % 3 === 1 ? 0x38bdf8 : 0x4ade80, { roughness: 0.58, opacity: 0.9, emissiveIntensity: 0.04 })
      );
      block.position.set((index % 6 - 2.5) * 1.2, 0.44 + (index % 2) * 0.16, -6.2 + Math.floor(index / 6) * 1.1);
      this.world.add(block);
      this.animatedObjects.push(block);
    }
    this.addMinigameLandmarks3d(accent);
  }

  private addCityWorld(accent: number): void {
    for (let i = 0; i < 14; i += 1) {
      const height = 0.7 + (i % 5) * 0.28;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, height, 0.9),
        this.toyMaterial(i % 3 === 0 ? accent : i % 3 === 1 ? 0xf6c453 : 0x14b8a6, { roughness: 0.68, emissiveIntensity: 0.04 })
      );
      building.position.set(-5.2 + (i % 7) * 1.7, height / 2, -4.8 + Math.floor(i / 7) * 1.8);
      this.world.add(building);
      this.animatedObjects.push(building);
    }
    this.addCityLandmarks3d(accent);
  }

  private addMenuWorld(accent: number): void {
    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 0), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 }));
    base.position.set(0, 1.4, -2.7);
    this.world.add(base);
    this.animatedObjects.push(base);
    for (let i = 0; i < 10; i += 1) {
      const star = new THREE.Mesh(new THREE.TetrahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }));
      star.position.set(Math.cos(i) * 4, 1.2 + (i % 3) * 0.5, -3 + Math.sin(i) * 2);
      this.world.add(star);
      this.animatedObjects.push(star);
    }
  }
}
