import * as THREE from "three";
import { AdaptiveEngine } from "../education/adaptiveEngine";
import { buildAttemptLog } from "../education/challengeLogger";
import { ChallengeFactory } from "../education/challengeFactory";
import { MasteryTracker } from "../education/masteryTracker";
import { subitizeThresholdMs } from "../education/quantityLayouts";
import type { AttemptLog, Challenge, ChallengeOption, SaveData } from "../education/types";
import { AssetManager } from "./AssetManager";
import { AudioManager } from "./AudioManager";
import { GameLoop } from "./GameLoop";
import { HapticManager } from "./HapticManager";
import { InputManager } from "./InputManager";
import { SaveManager } from "./SaveManager";
import { ReadingAudioManager } from "./ReadingAudioManager";
import { VoiceManager } from "./VoiceManager";
import type { SoundCue } from "./AudioManager";
import { SceneManager } from "./SceneManager";
import { BootScene } from "../scenes/BootScene";
import { HubScene } from "../scenes/HubScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { ParentDashboardScene } from "../scenes/ParentDashboardScene";
import { ResultsScene } from "../scenes/ResultsScene";
import { ReisScene } from "../scenes/ReisScene";
import { RunScene } from "../scenes/RunScene";
import { BossScene } from "../scenes/minigames/BossScene";
import { CompareScene } from "../scenes/minigames/CompareScene";
import { GeldmarktScene } from "../scenes/minigames/GeldmarktScene";
import { GetallenlijnScene } from "../scenes/minigames/GetallenlijnScene";
import { KlankgrotScene } from "../scenes/minigames/KlankgrotScene";
import { KloktorenScene } from "../scenes/minigames/KloktorenScene";
import { LetterkompasScene } from "../scenes/minigames/LetterkompasScene";
import { LuisterbosScene } from "../scenes/minigames/LuisterbosScene";
import { CountScene } from "../scenes/minigames/CountScene";
import { FillScene } from "../scenes/minigames/FillScene";
import { MatchScene } from "../scenes/minigames/MatchScene";
import { MeetwerfScene } from "../scenes/minigames/MeetwerfScene";
import { MemoryScene } from "../scenes/minigames/MemoryScene";
import { OneMoreLessScene } from "../scenes/minigames/OneMoreLessScene";
import { OrderScene } from "../scenes/minigames/OrderScene";
import { SplitbordScene } from "../scenes/minigames/SplitbordScene";
import { TienbrugScene } from "../scenes/minigames/TienbrugScene";
import { TientalhuisScene } from "../scenes/minigames/TientalhuisScene";
import { VerkeerspadScene } from "../scenes/minigames/VerkeerspadScene";
import { VormenburchtScene } from "../scenes/minigames/VormenburchtScene";
import { WoordbouwplaatsScene } from "../scenes/minigames/WoordbouwplaatsScene";
import { ZoemrouteScene } from "../scenes/minigames/ZoemrouteScene";
import { SettingsScene } from "../scenes/SettingsScene";

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
  readonly readingAudio = new ReadingAudioManager(this.voice);
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
  /** The journey region the map last announced, so a "welcome" only fires when Buddy enters a new one. */
  journeyLastRegion?: string;

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
    this.readingAudio.setSettings(this.save.getMutableData().settings);
    this.voice.setDuckHook((ms) => this.audio.duck(ms));
    this.readingAudio.setDuckHook((ms) => this.audio.duck(ms));
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

  // Log a pre-built non-number (curriculum) attempt through the same pipeline:
  // mastery + persistence + reward. Used by literacy/measurement modes.
  recordCurriculumAttempt(attempt: AttemptLog): boolean {
    const logged = this.mastery.logAttempt(attempt);
    this.save.appendAttempt(logged);
    if (attempt.wasCorrect) {
      this.save.award({ stars: 1, blocks: 1, streakDelta: 1 });
      this.audio.play("success");
      this.haptics.play("success");
    } else {
      this.save.award({ streakDelta: -1 });
      this.audio.play("soft-error");
      this.haptics.play("soft-error");
    }
    return attempt.wasCorrect;
  }

  flashMessage(message: string, tone: "good" | "warn" = "good"): void {
    const node = document.createElement("div");
    node.className = `toast ${tone}`;
    node.textContent = message;
    this.overlay.appendChild(node);
    window.setTimeout(() => node.remove(), 1300);
  }

  resetWorld(theme: "menu" | "summary" = "menu"): void {
    this.world.clear();
    this.animatedObjects.length = 0;
    this.gameplayObjects.length = 0;
    this.setCameraForTheme(theme);
    const palette = {
      menu: { sky: 0xb9e8ff, ground: 0x6ee7b7, accent: 0xf6c453 },
      summary: { sky: 0xfffbeb, ground: 0xa7f3d0, accent: 0xf6c453 }
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

    this.addMenuWorld(palette.accent);
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
    this.scenes.register("splitbord", (game) => new SplitbordScene(game));
    this.scenes.register("klankgrot", (game) => new KlankgrotScene(game));
    this.scenes.register("letterkompas", (game) => new LetterkompasScene(game));
    this.scenes.register("tientalhuis", (game) => new TientalhuisScene(game));
    this.scenes.register("zoemroute", (game) => new ZoemrouteScene(game));
    this.scenes.register("getallenlijn", (game) => new GetallenlijnScene(game));
    this.scenes.register("woordbouwplaats", (game) => new WoordbouwplaatsScene(game));
    this.scenes.register("tienbrug", (game) => new TienbrugScene(game));
    this.scenes.register("vormenburcht", (game) => new VormenburchtScene(game));
    this.scenes.register("kloktoren", (game) => new KloktorenScene(game));
    this.scenes.register("geldmarkt", (game) => new GeldmarktScene(game));
    this.scenes.register("meetwerf", (game) => new MeetwerfScene(game));
    this.scenes.register("verkeerspad", (game) => new VerkeerspadScene(game));
    this.scenes.register("luisterbos", (game) => new LuisterbosScene(game));
    this.scenes.register("boss", (game) => new BossScene(game));
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

  private setCameraForTheme(_theme: "menu" | "summary"): void {
    this.camera.position.set(0, 4.2, 8.5);
    this.camera.lookAt(0, 0.6, 0);
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
