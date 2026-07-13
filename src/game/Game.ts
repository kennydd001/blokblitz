import { AdaptiveEngine } from "../education/adaptiveEngine";
import { journeyTier, recentAccuracy, type DifficultyTier } from "../education/difficulty";
import { dueForReview, nextInterleavedTarget, sessionWarmup } from "../education/review";
import { buildDailyPlayPlan, localDayKey } from "../education/dailyPlan";
import { JOURNEY, nodeIndexById } from "../data/journey";
import { buildAttemptLog } from "../education/challengeLogger";
import { ChallengeFactory } from "../education/challengeFactory";
import { MasteryTracker } from "../education/masteryTracker";
import { subitizeThresholdMs } from "../education/quantityLayouts";
import type { AttemptLog, Challenge, ChallengeOption, DailyPlanProgress, SaveData } from "../education/types";
import { AssetManager } from "./AssetManager";
import { AudioManager } from "./AudioManager";
import { GameLoop } from "./GameLoop";
import { HapticManager } from "./HapticManager";
import { InputManager } from "./InputManager";
import { SaveManager, type DailyMissionCompletion } from "./SaveManager";
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
import { BossRushScene } from "../scenes/minigames/BossRushScene";
import { CompareScene } from "../scenes/minigames/CompareScene";
import { GeldmarktScene } from "../scenes/minigames/GeldmarktScene";
import { GetallenlijnScene } from "../scenes/minigames/GetallenlijnScene";
import { KlankgrotScene } from "../scenes/minigames/KlankgrotScene";
import { RhymeScene } from "../scenes/minigames/RhymeScene";
import { KloktorenScene } from "../scenes/minigames/KloktorenScene";
import { LetterkompasScene } from "../scenes/minigames/LetterkompasScene";
import { SchrijfspoorScene } from "../scenes/minigames/SchrijfspoorScene";
import { LuisterbosScene } from "../scenes/minigames/LuisterbosScene";
import { CountScene } from "../scenes/minigames/CountScene";
import { FillScene } from "../scenes/minigames/FillScene";
import { MatchScene } from "../scenes/minigames/MatchScene";
import { MeetwerfScene } from "../scenes/minigames/MeetwerfScene";
import { MemoryScene } from "../scenes/minigames/MemoryScene";
import { OneMoreLessScene } from "../scenes/minigames/OneMoreLessScene";
import { OrderScene } from "../scenes/minigames/OrderScene";
import { BondsScene } from "../scenes/minigames/BondsScene";
import { DoublesScene } from "../scenes/minigames/DoublesScene";
import { SkipCountingScene } from "../scenes/minigames/SkipCountingScene";
import { SplitbordScene } from "../scenes/minigames/SplitbordScene";
import { TienbrugScene } from "../scenes/minigames/TienbrugScene";
import { TientalhuisScene } from "../scenes/minigames/TientalhuisScene";
import { VerkeerspadScene } from "../scenes/minigames/VerkeerspadScene";
import { VormenburchtScene } from "../scenes/minigames/VormenburchtScene";
import { WoordbouwplaatsScene } from "../scenes/minigames/WoordbouwplaatsScene";
import { ZoemrouteScene } from "../scenes/minigames/ZoemrouteScene";
import { SettingsScene } from "../scenes/SettingsScene";
import { ProfilePickerScene } from "../scenes/ProfilePickerScene";
import type { Stage3D } from "./Stage3D";

export class Game {
  readonly root: HTMLElement;
  readonly stage: HTMLElement;
  readonly overlay: HTMLElement;
  /** The lazily-loaded WebGL layer (Three.js). Undefined until its chunk lands. */
  stage3d?: Stage3D;
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
  private stage3dPromise?: Promise<Stage3D>;
  private worldTheme: "menu" | "summary" = "menu";
  private active = false;
  private focusSessionId = "";
  private readonly warmupTargets = new Map<string, string[]>();
  private lastFocusReason: "warmup" | "adaptive" | "review" | "discovery" = "discovery";

  private readonly onResize = (): void => this.resize();

  private readonly warmStage3d = (): void => {
    window.removeEventListener("pointerdown", this.warmStage3d);
    window.removeEventListener("keydown", this.warmStage3d);
    void this.ensureStage3d();
  };

  private readonly onVisibilityChange = (): void => {
    if (!this.active) return;
    if (document.hidden) {
      this.loop.stop();
      this.voice.pause();
      this.audio.pauseForBackground();
      return;
    }
    this.audio.resumeFromBackground();
    this.audio.duck(2200);
    this.voice.resume();
    this.loop.start();
    this.resize();
  };

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.className = "app-shell";
    this.stage = document.createElement("div");
    this.stage.className = "game-stage";
    this.overlay = document.createElement("main");
    this.overlay.className = "scene-layer";
    this.root.replaceChildren(this.stage, this.overlay);

    this.mastery = new MasteryTracker(this.save.getMutableData().progress.attempts);
    this.adaptive = new AdaptiveEngine(this.mastery);
    this.scenes = new SceneManager(this);
    this.loop = new GameLoop((dt, elapsed) => this.update(dt, elapsed));

    this.audio.setSettings(this.save.getMutableData().settings);
    this.haptics.setSettings(this.save.getMutableData().settings);
    this.voice.setSettings(this.save.getMutableData().settings);
    this.readingAudio.setSettings(this.save.getMutableData().settings);
    this.voice.setDuckHook((ms) => this.audio.duck(ms));
    this.registerScenes();
    this.resize();
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.voice.resume();
    this.input.attach();
    this.scenes.goTo("boot");
    this.loop.start();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    document.addEventListener("fullscreenchange", this.onResize);
    document.addEventListener("webkitfullscreenchange", this.onResize);
    window.addEventListener("resize", this.onResize);
    // Keep passive first paint light; the first real interaction starts the 3D
    // download while the child is still choosing a journey activity.
    window.addEventListener("pointerdown", this.warmStage3d, { once: true, passive: true });
    window.addEventListener("keydown", this.warmStage3d, { once: true });
    if (document.hidden) this.onVisibilityChange();
  }

  /**
   * Lazily load Three.js + the WebGL stage. Scenes that need 3D await this;
   * everything else boots without the ~475 kB chunk.
   */
  ensureStage3d(): Promise<Stage3D> {
    if (!this.stage3dPromise) {
      this.stage3dPromise = import("./Stage3D").then(({ Stage3D }) => {
        const stage3d = new Stage3D(this.stage);
        this.stage3d = stage3d;
        stage3d.resetWorld(this.worldTheme);
        this.resize();
        return stage3d;
      });
    }
    return this.stage3dPromise;
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    this.input.detach();
    this.loop.stop();
    this.audio.stopMusic();
    this.voice.cancel();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    document.removeEventListener("fullscreenchange", this.onResize);
    document.removeEventListener("webkitfullscreenchange", this.onResize);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.warmStage3d);
    window.removeEventListener("keydown", this.warmStage3d);
  }

  showScene(name: string, params?: unknown): void {
    this.scenes.goTo(name, params);
  }

  /**
   * Switch to a child profile: point the save layer at it, refresh the mastery
   * tracker to THAT child's attempts, re-apply their settings, and clear the
   * transient story-map view state so the picked child sees their own trajectory.
   * The caller navigates (usually to "reis").
   */
  useProfile(id: string): void {
    if (id) this.save.switchProfile(id);
    this.mastery.setAttempts(this.save.getMutableData().progress.attempts);
    this.focusSessionId = "";
    this.warmupTargets.clear();
    this.lastFocusReason = "discovery";
    this.lastJourneyNode = undefined;
    this.journeyLastRegion = undefined;
    this.journeySeenCompleted = this.save.getData().progress.journey.completed.length;
    this.audio.setSettings(this.save.getMutableData().settings);
    this.haptics.setSettings(this.save.getMutableData().settings);
    this.voice.setSettings(this.save.getMutableData().settings);
    this.readingAudio.setSettings(this.save.getMutableData().settings);
  }

  requestFullscreenPlay(): void {
    const fullscreenDocument = document as Document & { webkitFullscreenElement?: Element | null };
    if (document.fullscreenElement || fullscreenDocument.webkitFullscreenElement) return;
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
    this.mastery.setAttempts(this.save.getMutableData().progress.attempts);

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
    this.mastery.setAttempts(this.save.getMutableData().progress.attempts);
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

  /**
   * The dynamic difficulty tier for the activity being played: rises with the
   * Sterrenronde, with how deep into the path the launching node sits, and
   * with strong recent accuracy (drops when the child struggles). Free play
   * (no launching node) uses the current frontier position.
   *
   * `domain` scopes the accuracy signal to ONE learning domain, so a child
   * who is strong in rekenen but still growing in lezen gets a separate tier
   * per domain. Undefined = the classic 1-10 number modes.
   */
  difficultyTier(domain?: string): DifficultyTier {
    const journey = this.data().progress.journey;
    const nodeIndex = this.lastJourneyNode ? Math.max(0, nodeIndexById(this.lastJourneyNode)) : Math.min(journey.nodeIndex, JOURNEY.length - 1);
    const { accuracy, count } = recentAccuracy(this.mastery.getAttempts(), 20, domain);
    return journeyTier({
      round: journey.round ?? 1,
      pathProgress: nodeIndex / Math.max(1, JOURNEY.length - 1),
      recentAccuracy: accuracy,
      attemptCount: count
    });
  }

  /**
   * The curriculum target to steer this round toward. Two signals, in order:
   * (1) a currently-shaky target the child is struggling with right now, and if
   * there is none, (2) the target whose memory has decayed most since it was
   * last practised — spaced repetition, so a skill learned last week comes back
   * before it fades. Undefined lets the generator roll a fresh target freely.
   */
  curriculumFocus(domain?: string): string | undefined {
    this.lastFocusReason = "discovery";
    if (!domain) return undefined;
    const attempts = this.mastery.getAttempts();
    const sessionId = this.save.getMutableData().progress.sessionId;
    if (sessionId !== this.focusSessionId) {
      this.focusSessionId = sessionId;
      this.warmupTargets.clear();
    }
    if (!this.warmupTargets.has(domain)) {
      const historical = attempts.filter((attempt) => attempt.sessionId !== sessionId && attempt.domain === domain);
      this.warmupTargets.set(
        domain,
        sessionWarmup(historical, Date.now(), 3).map((item) => item.targetKey)
      );
    }
    const warmup = this.warmupTargets.get(domain)?.shift();
    const shaky = this.adaptive.recommendCurriculumFocus(domain);
    const due = dueForReview(attempts, Date.now())
      .filter((item) => item.domain === domain)
      .map((item) => item.targetKey);
    const target = nextInterleavedTarget(
      [warmup, shaky, ...due],
      attempts,
      sessionId,
      domain
    );
    if (target) {
      if (warmup && target === warmup) this.lastFocusReason = "warmup";
      else if (shaky && target === shaky) this.lastFocusReason = "adaptive";
      else this.lastFocusReason = "review";
    }
    return target;
  }

  curriculumFocusReason(): "warmup" | "adaptive" | "review" | "discovery" {
    return this.lastFocusReason;
  }

  /** Three balanced, stable recommendations generated from this child's own history. */
  dailyPlan(now = Date.now()): DailyPlanProgress {
    const data = this.data();
    const recommendations = buildDailyPlayPlan({
      dayKey: localDayKey(new Date(now)),
      now,
      attempts: data.progress.attempts,
      activityHistory: data.progress.activityHistory,
      journeyIndex: data.progress.journey.nodeIndex,
      journeyRound: data.progress.journey.round ?? 1
    });
    return this.save.ensureDailyPlan(localDayKey(new Date(now)), recommendations.map((item) => item.scene));
  }

  /** Shared completion hook for recommendations, recent-play variation and the daily bonus. */
  completeActivity(sceneId: string, now = Date.now()): DailyMissionCompletion {
    this.dailyPlan(now);
    const daily = this.save.completeDailyMode(sceneId);
    this.save.recordActivityComplete(sceneId, Boolean(this.lastJourneyNode), now);
    if (daily.rewardEarned) this.save.award({ stars: 10, blocks: 5 });
    this.save.endSession(now);
    return daily;
  }

  flashMessage(message: string, tone: "good" | "warn" = "good"): void {
    const node = document.createElement("div");
    node.className = `toast ${tone}`;
    node.setAttribute("role", "status");
    node.setAttribute("aria-atomic", "true");
    node.textContent = message;
    this.overlay.appendChild(node);
    window.setTimeout(() => node.remove(), 1300);
  }

  resetWorld(theme: "menu" | "summary" = "menu"): void {
    // Remember the requested theme: if the 3D layer is still downloading it
    // applies this theme the moment it lands.
    this.worldTheme = theme;
    this.stage3d?.resetWorld(theme);
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
    this.scenes.register("rijmspel", (game) => new RhymeScene(game));
    this.scenes.register("letterkompas", (game) => new LetterkompasScene(game));
    this.scenes.register("schrijfspoor", (game) => new SchrijfspoorScene(game));
    this.scenes.register("tientalhuis", (game) => new TientalhuisScene(game));
    this.scenes.register("zoemroute", (game) => new ZoemrouteScene(game));
    this.scenes.register("getallenlijn", (game) => new GetallenlijnScene(game));
    this.scenes.register("woordbouwplaats", (game) => new WoordbouwplaatsScene(game));
    this.scenes.register("tienbrug", (game) => new TienbrugScene(game));
    this.scenes.register("dubbelspel", (game) => new DoublesScene(game));
    this.scenes.register("sprongpad", (game) => new SkipCountingScene(game));
    this.scenes.register("vriendjes", (game) => new BondsScene(game));
    this.scenes.register("vormenburcht", (game) => new VormenburchtScene(game));
    this.scenes.register("kloktoren", (game) => new KloktorenScene(game));
    this.scenes.register("geldmarkt", (game) => new GeldmarktScene(game));
    this.scenes.register("meetwerf", (game) => new MeetwerfScene(game));
    this.scenes.register("verkeerspad", (game) => new VerkeerspadScene(game));
    this.scenes.register("luisterbos", (game) => new LuisterbosScene(game));
    this.scenes.register("boss", (game) => new BossScene(game));
    this.scenes.register("bossRush", (game) => new BossRushScene(game));
    this.scenes.register("parentDashboard", (game) => new ParentDashboardScene(game));
    this.scenes.register("settings", (game) => new SettingsScene(game));
    this.scenes.register("profiles", (game) => new ProfilePickerScene(game));
  }

  private resize(): void {
    const width = this.root.clientWidth || window.innerWidth;
    const height = this.root.clientHeight || window.innerHeight;
    this.stage3d?.resize(width, height);
  }

  private update(dt: number, elapsed: number): void {
    this.scenes.update(dt);
    // Only the runner shows the 3D world. Every other scene is pure DOM over an
    // opaque sky, so rendering the WebGL scene there just burned battery/heat/GPU
    // on a tablet for pixels the child never saw (~90% of playtime). Gate it.
    if (this.scenes.getCurrentName() === "run") this.stage3d?.update(dt, elapsed);
  }

  private soundCueForCorrectAttempt(challenge: Challenge, isSnap: boolean): SoundCue {
    if (isSnap) return "snap";
    if (challenge.scene === "webwoud" || challenge.challengeType === "rescue-the-herd") return "rescue";
    if (challenge.scene === "city" || ["bead-bridge", "build-the-number", "train-of-ten"].includes(challenge.challengeType)) return "build";
    return "success";
  }

}
