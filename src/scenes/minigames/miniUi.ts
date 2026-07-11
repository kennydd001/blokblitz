// Shared celebration / done screen for every calm mode, so they all end the same
// friendly way: confetti, a 1-3 star rating, and "Nog eens" / "Speeltuin" buttons.

import { playModeByScene } from "../../data/playModes";
import type { Game } from "../../game/Game";
import type { HeroSkin } from "../../runner/skins";
import { showSkinUnlock } from "../skinRewards";

export interface NextMissionAction {
  scene: string;
  emoji: string;
  name: string;
  onPlay: () => void;
}

export interface SessionTreasureProgress {
  fill: number;
  total: number;
}

export interface DoneScreenOptions {
  emoji: string;
  heading: string;
  stars: number;
  sub: string;
  newStickers?: { emoji: string; name: string }[];
  dailyMission?: { completedCount: number; total: number; rewardEarned: boolean };
  personalBest?: { stars: number };
  nextMission?: NextMissionAction;
  sessionTreasure?: SessionTreasureProgress;
  homeLabel?: string;
  onReplay: () => void;
  onHome: () => void;
}

/** The next unfinished recommendation from this child's stable daily plan. */
export function nextDailyMission(game: Game, currentScene: string): NextMissionAction | undefined {
  if (game.lastJourneyNode) return undefined;
  const plan = game.dailyPlan();
  const nextScene = plan.modeIds.find((scene) => scene !== currentScene && !plan.completedModeIds.includes(scene));
  const mode = nextScene ? playModeByScene(nextScene) : undefined;
  if (!mode) return undefined;
  return {
    scene: mode.scene,
    emoji: mode.emoji,
    name: mode.name,
    onPlay: () => {
      game.requestFullscreenPlay();
      game.save.startNewSession();
      game.showScene(mode.scene);
    }
  };
}

export function buildDoneScreen(options: DoneScreenOptions): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "mini-done";

  const burst = document.createElement("div");
  burst.className = "results-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";

  const card = document.createElement("div");
  card.className = "results-card";

  const eyebrow = document.createElement("p");
  eyebrow.className = "results-eyebrow";
  eyebrow.textContent = `${options.emoji} ${options.heading}`;

  const title = document.createElement("h1");
  title.className = "results-title";
  title.textContent = options.stars >= 3 ? "PERFECT!" : options.stars >= 2 ? "SUPER!" : "Goed gedaan!";

  const starRow = document.createElement("div");
  starRow.className = "results-star-rating";
  starRow.dataset.stars = String(options.stars);
  for (let i = 0; i < 3; i += 1) {
    const star = document.createElement("span");
    star.className = `rating-star${i < options.stars ? " earned" : ""}`;
    star.textContent = "★";
    star.style.setProperty("--i", String(i));
    starRow.appendChild(star);
  }

  const sub = document.createElement("p");
  sub.className = "results-sub";
  sub.textContent = options.sub;

  card.append(eyebrow, title, starRow, sub);

  if (options.personalBest) {
    const best = document.createElement("div");
    best.className = "results-unlock personal-best";
    best.innerHTML = `<span aria-hidden="true">🏅</span><strong>Nieuwe beste: ${options.personalBest.stars}/3 sterren!</strong>`;
    card.appendChild(best);
  }

  if (options.dailyMission) {
    const daily = document.createElement("div");
    daily.className = `results-unlock daily${options.dailyMission.rewardEarned ? " grand" : ""}`;
    daily.innerHTML = options.dailyMission.rewardEarned
      ? `<span aria-hidden="true">🏆</span><strong>3 missies klaar: +10 sterren!</strong>`
      : `<span aria-hidden="true">✅</span><strong>Missie ${options.dailyMission.completedCount}/${options.dailyMission.total} klaar!</strong>`;
    card.appendChild(daily);
  }

  if (options.sessionTreasure) card.appendChild(buildTreasureProgress(options.sessionTreasure));

  for (const sticker of options.newStickers ?? []) {
    const banner = document.createElement("div");
    banner.className = "results-unlock sticker";
    banner.innerHTML = `<span class="sticker-pop" aria-hidden="true">${sticker.emoji}</span><strong>Nieuwe sticker: ${sticker.name}!</strong>`;
    card.appendChild(banner);
  }

  const actions = document.createElement("div");
  actions.className = "results-actions";
  const again = document.createElement("button");
  again.type = "button";
  again.className = "btn play-now";
  again.dataset.action = "Nog eens!";
  again.textContent = "Nog eens!";
  again.addEventListener("click", options.onReplay);
  const home = document.createElement("button");
  home.type = "button";
  home.className = "btn secondary";
  home.dataset.action = options.homeLabel ?? "Speeltuin";
  home.textContent = options.homeLabel ?? "Speeltuin";
  home.addEventListener("click", options.onHome);
  const treasureReady = (options.sessionTreasure?.fill ?? 0) >= (options.sessionTreasure?.total ?? 3);
  const focus = treasureReady ? buildTreasureAction(options.onHome) : options.nextMission ? buildNextMissionAction(options.nextMission) : undefined;
  if (focus) {
    actions.classList.add("has-focus");
    again.classList.remove("play-now");
    again.classList.add("ghost");
    actions.append(focus, again, home);
  } else actions.append(again, home);
  card.appendChild(actions);

  wrap.append(burst, card);
  return wrap;
}

export function buildTreasureProgress(progress: SessionTreasureProgress): HTMLElement {
  const total = Math.max(1, Math.round(progress.total));
  const fill = Math.max(0, Math.min(total, Math.round(progress.fill)));
  const ready = fill >= total;
  const meter = document.createElement("div");
  meter.className = `results-treasure${ready ? " ready" : ""}`;
  meter.dataset.treasureFill = String(fill);
  meter.setAttribute("aria-label", ready ? "Schatkist klaar" : `Schatkist: ${fill} van ${total} spelletjes`);
  const gems = Array.from({ length: total }, (_, index) => `<span class="schat-gem${index < fill ? " filled" : ""}" aria-hidden="true">&#x1F48E;</span>`).join("");
  meter.innerHTML = `<span class="results-treasure-icon" aria-hidden="true">${ready ? "&#x1F9F0;" : "&#x1F392;"}</span><span class="results-treasure-copy"><strong>${ready ? "Schatkist klaar!" : `${fill}/${total} voor je schat`}</strong><span>${gems}</span></span>`;
  return meter;
}

function buildNextMissionAction(next: NextMissionAction): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn play-now results-focus-action results-next-mission";
  button.dataset.nextMission = next.scene;
  button.setAttribute("aria-label", `Volgende missie: ${next.name}`);
  button.innerHTML = `<span class="results-focus-icon" aria-hidden="true">${next.emoji}</span><span><small>Volgende missie</small><strong>${next.name}</strong></span><b aria-hidden="true">&#x25B6;</b>`;
  button.addEventListener("click", next.onPlay);
  return button;
}

function buildTreasureAction(onOpen: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn play-now results-focus-action results-open-treasure";
  button.dataset.action = "Open schatkist";
  button.setAttribute("aria-label", "Open je volle schatkist");
  button.innerHTML = `<span class="results-focus-icon" aria-hidden="true">&#x1F9F0;</span><span><small>Beloning klaar</small><strong>Open je schatkist</strong></span><b aria-hidden="true">&#x25B6;</b>`;
  button.addEventListener("click", onOpen);
  return button;
}

export function starsFromPerfect(perfect: number, total: number): number {
  if (perfect >= total) return 3;
  if (perfect >= Math.ceil(total * 0.6)) return 2;
  return 1;
}

/**
 * The sticker unboxing: a full-screen gift that wiggles, bursts open and pops
 * the earned sticker BIG with its name — a real collect moment instead of a
 * side banner. Tap anywhere to dismiss (auto-opens shortly after appearing).
 */
export function showStickerReveal(root: HTMLElement, game: Game, stickers: { emoji: string; name: string }[], onDone?: () => void): HTMLElement | null {
  if (stickers.length === 0) return null;
  const overlay = document.createElement("div");
  overlay.className = "sticker-reveal";
  overlay.dataset.stickerReveal = "true";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.tabIndex = 0;
  let index = 0;
  let openTimer: number | undefined;

  const show = (): void => {
    const sticker = stickers[index];
    overlay.setAttribute("aria-label", `Nieuwe sticker: ${sticker.name}`);
    overlay.innerHTML = `
      <div class="sticker-reveal-card">
        <div class="sticker-reveal-gift" aria-hidden="true">🎁</div>
        <div class="sticker-reveal-sticker" aria-hidden="true">${sticker.emoji}</div>
        <strong>Nieuwe sticker!</strong>
        <em>${sticker.name}</em>
        <small>${index + 1}/${stickers.length} — tik om verder te gaan</small>
      </div>
      <div class="results-burst sticker-reveal-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    `;
    // Gift wiggles, then bursts open into the sticker.
    if (openTimer !== undefined) window.clearTimeout(openTimer);
    openTimer = window.setTimeout(() => {
      if (overlay.isConnected) overlay.classList.add("open");
    }, 650);
    game.voice.speak(`Je verdiende een nieuwe sticker: ${sticker.name}!`, { interrupt: true, pitch: 1.2 });
    overlay.focus();
  };

  const advance = (): void => {
    game.voice.cancel();
    index += 1;
    if (index < stickers.length) {
      overlay.classList.remove("open");
      show();
      return;
    }
    if (openTimer !== undefined) window.clearTimeout(openTimer);
    overlay.remove();
    onDone?.();
  };
  overlay.addEventListener("click", advance);
  overlay.addEventListener("keydown", (event) => {
    if (!["Enter", " ", "Escape"].includes(event.key)) return;
    event.preventDefault();
    advance();
  });

  root.appendChild(overlay);
  show();
  return overlay;
}

export interface ActivityRewardSequence {
  completionLine: string;
  stickers: { emoji: string; name: string }[];
  skins: HeroSkin[];
}

/** Keep each collectible visible while its matching local narration is heard. */
export function showActivityRewards(root: HTMLElement, game: Game, rewards: ActivityRewardSequence): HTMLElement | null {
  const speakCompletion = (): void => game.voice.speak(rewards.completionLine, { interrupt: true, pitch: 1.2 });
  const revealSkins = (): HTMLElement | null => {
    const overlay = showSkinUnlock(root, game, rewards.skins, { onDone: speakCompletion });
    if (!overlay) speakCompletion();
    return overlay;
  };
  const stickerOverlay = showStickerReveal(root, game, rewards.stickers, () => {
    revealSkins();
  });
  return stickerOverlay ?? revealSkins();
}
