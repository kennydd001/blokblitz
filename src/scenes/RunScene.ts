import { RepresentationFactory } from "../education/representations/RepresentationFactory";
import type { Challenge } from "../education/types";
import type { Game } from "../game/Game";
import { AdaptiveGateProvider } from "../runner/gateProvider";
import { RunnerCore, type RunnerEvent } from "../runner/RunnerCore";
import { RunnerView } from "../runner/RunnerView";
import { newlyUnlockedSkins, skinById, unlockedSkinIds } from "../runner/skins";
import { getWorld, starsForRun, type WorldDef } from "../runner/worlds";
import { BaseScene } from "./SceneUtils";

export class RunScene extends BaseScene {
  private core!: RunnerCore;
  private view!: RunnerView;
  private world!: WorldDef;
  private starsAtStart = 0;
  private ended = false;
  private countdown = 0;
  private countdownEl?: HTMLElement;
  private lastSpokenCountdown = "";

  private starsEl?: HTMLElement;
  private comboEl?: HTMLElement;
  private distEl?: HTMLElement;
  private coinsEl?: HTMLElement;
  private progressEl?: HTMLElement;
  private targetTextEl?: HTMLElement;
  private targetArtEl?: HTMLElement;
  private lastTargetId = "";

  constructor(game: Game) {
    super(game, "run");
  }

  mount(params?: unknown): void {
    super.mount();
    const data = this.game.data();
    this.starsAtStart = data.progress.stars;
    this.ended = false;
    this.world = getWorld((params as { worldId?: string } | undefined)?.worldId);

    const provider = new AdaptiveGateProvider(this.game.adaptive, this.game.challenges, {
      maxQuantity: this.world.maxQuantity,
      gateTypes: this.world.gateTypes,
      representations: this.world.representations
    });
    this.core = new RunnerCore({
      provider,
      gatesTotal: this.world.gatesTotal,
      speedScale: data.settings.speed * this.world.speed,
      mechanics: this.world.mechanics
    });
    this.view = new RunnerView(this.game.world, this.game.camera, skinById(data.progress.cosmetics.activeSkin), this.world.palette);
    this.view.build();

    this.buildHud();
    this.countdown = 3.5;
    this.game.audio.startMusic(this.world.id);

    this.onInput((action) => {
      if (this.ended) return;
      if (action === "left") this.core.input("left");
      else if (action === "right") this.core.input("right");
      else if (action === "up" || action === "confirm") this.jump();
      else if (action === "pause") this.game.showScene("mainMenu");
    });
  }

  unmount(): void {
    this.game.audio.stopMusic();
    this.view?.dispose();
    super.unmount();
  }

  update(dt: number): void {
    if (this.ended) return;
    if (this.countdown > 0) {
      this.countdown -= dt;
      this.tickCountdown();
      this.view.sync(this.core.snapshot(), 0);
      return;
    }
    this.core.update(dt);
    for (const event of this.core.drainEvents()) this.handleEvent(event);
    if (this.ended) return;
    const snapshot = this.core.snapshot();
    this.view.sync(snapshot, dt);
    this.updateHud(snapshot.distanceMeters, snapshot.coins, snapshot.runStars + snapshot.bonusStars, snapshot.combo, snapshot.gatesResolved, snapshot.gatesTotal, snapshot.target?.id);
    this.refreshTarget(snapshot.target?.id, snapshot.target?.meta as Challenge | undefined, snapshot.target?.targetText);
  }

  private jump(): void {
    if (!this.core.jumping) {
      this.game.audio.play("jump");
      this.game.haptics.play("jump");
    }
    this.core.input("jump");
  }

  private handleEvent(event: RunnerEvent): void {
    this.view.onEvent(event);
    if (event.type === "coin") {
      this.game.audio.play("coin");
      this.game.haptics.play("coin");
    } else if (event.type === "stumble") {
      this.game.audio.play("stumble");
      this.game.haptics.play("stumble");
    } else if (event.type === "boost") {
      this.game.audio.play("boost");
      this.game.haptics.play("boost");
    } else if (event.type === "swing") {
      this.game.audio.play("boost");
      this.game.haptics.play("boost");
      this.game.flashMessage("Zwiep! 🕸️", "good");
    } else if (event.type === "build") {
      this.game.audio.play("build");
      this.game.haptics.play("build");
      this.game.flashMessage("Bouwen! 🧱", "good");
    } else if (event.type === "gate") {
      const challenge = event.gate.meta as Challenge | undefined;
      if (challenge) {
        const option = challenge.options[event.chosenLane] ?? challenge.options[0];
        this.game.recordAttempt(challenge, option, performance.now() - event.reactionMs, false);
      }
    } else if (event.type === "finished") {
      this.endRun(event);
    }
  }

  private endRun(event: Extract<RunnerEvent, { type: "finished" }>): void {
    if (this.ended) return;
    this.ended = true;
    const summary = event.summary;
    const stars = starsForRun(summary.gatesCorrect, summary.gatesTotal);
    // Gate stars were already awarded per attempt; settle the run-wide extras once.
    this.game.save.award({ blocks: summary.coins, stars: summary.bonusStars });
    const before = this.game.data().progress.bestRunDistance;
    this.game.save.recordRunResult(summary.distanceMeters);
    const { newWorldUnlocked } = this.game.save.recordWorldResult(this.world.id, stars);
    const afterData = this.game.data();
    const totalStars = afterData.progress.stars;
    this.game.save.syncUnlockedSkins(unlockedSkinIds(totalStars));
    const unlocked = newlyUnlockedSkins(this.starsAtStart, totalStars);
    this.game.audio.play("win");
    this.game.haptics.play("win");
    this.game.showScene("results", {
      summary,
      stars,
      world: this.world,
      newWorldUnlocked,
      totalStars,
      newBest: summary.distanceMeters > before,
      unlocked
    });
  }

  // ---- HUD ------------------------------------------------------------------

  private buildHud(): void {
    this.root.classList.add("run-scene");

    const top = document.createElement("div");
    top.className = "run-top";
    const pause = this.iconButton("Menu", "menu", () => this.game.showScene("mainMenu"));
    pause.classList.add("run-pause");
    const stats = document.createElement("div");
    stats.className = "run-stats";
    stats.append(
      this.runStat("stars", "⭐", "0", (el) => (this.starsEl = el)),
      this.runStat("coins", "🟦", "0", (el) => (this.coinsEl = el)),
      this.runStat("combo", "🔥", "x0", (el) => (this.comboEl = el)),
      this.runStat("dist", "🏁", "0 m", (el) => (this.distEl = el))
    );
    top.append(pause, stats);

    const progressWrap = document.createElement("div");
    progressWrap.className = "run-progress";
    const progressFill = document.createElement("i");
    this.progressEl = progressFill;
    progressWrap.appendChild(progressFill);

    const target = document.createElement("div");
    target.className = "run-target";
    target.dataset.runTarget = "true";
    const targetText = document.createElement("strong");
    targetText.className = "run-target-text";
    targetText.textContent = "Klaar voor de start!";
    const targetArt = document.createElement("div");
    targetArt.className = "run-target-art";
    this.targetTextEl = targetText;
    this.targetArtEl = targetArt;
    target.append(targetText, targetArt);

    const controls = document.createElement("div");
    controls.className = "run-controls";
    controls.append(
      this.ctrlButton("left", "◀", () => this.core.input("left")),
      this.ctrlButton("jump", "SPRING", () => this.jump()),
      this.ctrlButton("right", "▶", () => this.core.input("right"))
    );

    const countdown = document.createElement("div");
    countdown.className = "run-countdown";
    countdown.setAttribute("aria-hidden", "true");
    countdown.textContent = "3";
    this.countdownEl = countdown;

    this.root.append(top, progressWrap, target, controls, countdown);
  }

  private tickCountdown(): void {
    const c = this.countdown;
    const text = c > 2.5 ? "3" : c > 1.5 ? "2" : c > 0.5 ? "1" : "GA!";
    if (text !== this.lastSpokenCountdown) {
      this.lastSpokenCountdown = text;
      if (text === "GA!") this.game.voice.speak("Ga!", { interrupt: true, pitch: 1.3 });
      else this.game.voice.sayNumber(Number(text), { interrupt: true });
    }
    if (this.countdownEl) {
      this.countdownEl.textContent = text;
      this.countdownEl.classList.add("show");
      if (c <= 0) {
        this.countdownEl.remove();
        this.countdownEl = undefined;
        this.game.audio.play("start-race");
        this.game.haptics.play("start-race");
      }
    }
    const snap = this.core.snapshot();
    this.refreshTarget(snap.target?.id, snap.target?.meta as Challenge | undefined, snap.target?.targetText);
  }

  private runStat(kind: string, icon: string, value: string, ref: (el: HTMLElement) => void): HTMLElement {
    const stat = document.createElement("div");
    stat.className = `run-stat ${kind}`;
    stat.dataset.runStat = kind;
    stat.innerHTML = `<span class="run-stat-icon" aria-hidden="true">${icon}</span><strong>${value}</strong>`;
    ref(stat.querySelector("strong") as HTMLElement);
    return stat;
  }

  private ctrlButton(dir: string, label: string, onPress: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `run-ctrl run-ctrl-${dir}`;
    button.dataset.runCtrl = dir;
    button.setAttribute("aria-label", dir === "jump" ? "Springen" : dir === "left" ? "Naar links" : "Naar rechts");
    button.innerHTML = `<span aria-hidden="true">${label}</span>`;
    const press = (event: Event): void => {
      event.preventDefault();
      if (!this.ended) onPress();
    };
    button.addEventListener("click", press);
    return button;
  }

  private updateHud(distance: number, coins: number, stars: number, combo: number, resolved: number, total: number, _targetId?: string): void {
    if (this.starsEl) this.starsEl.textContent = String(stars);
    if (this.coinsEl) this.coinsEl.textContent = String(coins);
    if (this.comboEl) this.comboEl.textContent = `x${combo}`;
    if (this.distEl) this.distEl.textContent = `${Math.round(distance)} m`;
    if (this.progressEl) this.progressEl.style.width = `${Math.round((resolved / Math.max(1, total)) * 100)}%`;
    this.comboEl?.parentElement?.classList.toggle("hot", combo >= 3);
  }

  private refreshTarget(id: string | undefined, challenge: Challenge | undefined, text: string | undefined): void {
    if (!id || id === this.lastTargetId) return;
    this.lastTargetId = id;
    if (text) this.game.voice.speak(text, { interrupt: true });
    if (this.targetTextEl && text) this.targetTextEl.textContent = text;
    if (this.targetArtEl) {
      if (challenge && challenge.challengeType !== "enemy-wave-compare") {
        this.targetArtEl.innerHTML = RepresentationFactory.renderSvg(challenge.promptRepresentation, challenge.quantity, {
          label: text ?? ""
        });
      } else {
        this.targetArtEl.innerHTML =
          '<span class="run-target-compare" aria-hidden="true"><i class="cmp s"></i><i class="cmp m"></i><i class="cmp l"></i></span>';
      }
    }
  }
}
