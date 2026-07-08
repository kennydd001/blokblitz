// The session treasure loop: every finished activity fills a 3-gem meter; a full
// meter spawns a treasure chest worth a big reward. Shared by the Sterrenreis
// map and the Speeltuin hub so the loop is visible wherever the child lands.

import type { Game } from "../game/Game";
import { skinById } from "../runner/skins";
import { buddyLevel, createBuddy, type Buddy } from "./buddy";

/**
 * The daily gift chest + come-back-tomorrow streak. Shown once per day on the
 * map AND the hub, so a free-play child sees it too. Opening it scales the
 * reward with the day streak and shows a growing flame + week ribbon; a gap
 * return is welcomed, never shamed.
 */
export function maybeDailyChest(game: Game, root: HTMLElement, buddy?: Buddy): HTMLButtonElement | null {
  const dayKey = new Date().toISOString().slice(0, 10);
  if (!game.save.dailyChestAvailable(dayKey)) return null;
  const chest = document.createElement("button");
  chest.type = "button";
  chest.className = "reis-chest";
  chest.dataset.dailyChest = "true";
  chest.setAttribute("aria-label", "Open je dagelijkse cadeautje");
  chest.innerHTML = `<span aria-hidden="true">🎁</span>`;
  chest.addEventListener("click", () => {
    if (!game.save.claimDailyChest(dayKey)) return;
    const { count, best } = game.save.dayStreak();
    const reward = 3 + Math.min(3, count - 1); // +3 today, growing to +6 by day 4
    game.save.award({ stars: reward, blocks: reward });
    game.audio.play("win");
    game.haptics.play("win");
    const line =
      count >= 2
        ? `Hoera, ${count} dagen op een rij! ${reward} sterren erbij. Kom morgen weer!`
        : best >= 2
          ? `Ik heb je gemist! Fijn dat je er weer bent. ${reward} sterren erbij!`
          : `Hoera! ${reward} sterren erbij!`;
    game.voice.speak(line, { interrupt: true, pitch: 1.2 });
    buddy?.setMood("wow", 1600);
    buddy?.say(count >= 2 ? `${count} dagen!` : "Een cadeautje!");
    const burst = document.createElement("div");
    burst.className = "results-burst reis-chest-burst";
    burst.setAttribute("aria-hidden", "true");
    burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
    root.appendChild(burst);
    root.appendChild(streakRibbon(count));
    window.setTimeout(() => burst.remove(), 1100);
    window.setTimeout(() => root.querySelector(".daglint")?.remove(), 2600);
    chest.classList.add("opened");
    chest.disabled = true;
    window.setTimeout(() => chest.remove(), 900);
  });
  root.appendChild(chest);
  return chest;
}

/** A transient flame + 7-day ribbon celebrating the current streak. */
function streakRibbon(count: number): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "daglint";
  wrap.setAttribute("aria-label", `${count} dagen op een rij`);
  const dots = Array.from({ length: 7 }, (_, i) => `<span class="daglint-dot${i < Math.min(7, count) ? " lit" : ""}" aria-hidden="true"></span>`).join("");
  wrap.innerHTML = `<span class="daglint-flame" aria-hidden="true">🔥</span><strong>${count}</strong><span class="daglint-dots" aria-hidden="true">${dots}</span>`;
  return wrap;
}

/** The 3-gem meter pill (💎💎◇). */
export function treasureMeter(game: Game): HTMLElement {
  const fill = Math.min(3, game.data().progress.sessionChestFill ?? 0);
  const pill = document.createElement("div");
  pill.className = "schat-meter";
  pill.dataset.treasureFill = String(fill);
  pill.setAttribute("aria-label", `Schatmeter: ${fill} van 3 spelletjes`);
  pill.innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="schat-gem${i < fill ? " filled" : ""}" aria-hidden="true">💎</span>`).join("");
  return pill;
}

/** When the meter is full, spawn the tappable treasure chest. Returns it (or null). */
export function spawnTreasureChest(game: Game, root: HTMLElement, buddy?: Buddy): HTMLElement | null {
  if (!game.save.treasureFull()) return null;
  const chest = document.createElement("button");
  chest.type = "button";
  chest.className = "schat-chest";
  chest.dataset.treasureChest = "true";
  chest.setAttribute("aria-label", "Open de schatkist");
  chest.innerHTML = `<span aria-hidden="true">🧰</span><small>Schatkist!</small>`;
  chest.addEventListener("click", () => {
    if (!game.save.claimTreasure()) return;
    game.save.award({ stars: 5, blocks: 5 });
    game.audio.play("win");
    game.haptics.play("win");
    game.voice.speak("Hoera!", { interrupt: true, pitch: 1.25 });
    game.flashMessage("Schatkist! +5 ⭐", "good");
    buddy?.setMood("wow", 1600);
    buddy?.say("Een schat!");
    const burst = document.createElement("div");
    burst.className = "results-burst schat-burst";
    burst.setAttribute("aria-hidden", "true");
    burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
    root.appendChild(burst);
    window.setTimeout(() => burst.remove(), 1400);
    chest.classList.add("opened");
    chest.disabled = true;
    window.setTimeout(() => {
      chest.remove();
      // Refresh the meter pill(s) so the reset is visible immediately.
      root.querySelectorAll<HTMLElement>(".schat-meter").forEach((pill) => {
        pill.dataset.treasureFill = "0";
        pill.querySelectorAll(".schat-gem").forEach((gem) => gem.classList.remove("filled"));
      });
    }, 900);
  });
  root.appendChild(chest);
  return chest;
}

/**
 * The Buddy level-up moment: when total stars cross a BUDDY_LEVELS threshold,
 * celebrate it once — a full-screen card where the evolved Buddy shows off its
 * new accessory and title. Called from the calm screens (map + hub) so it never
 * interrupts gameplay. Returns the overlay (or null when nothing new).
 */
export function maybeBuddyLevelUp(game: Game, root: HTMLElement): HTMLElement | null {
  const progress = game.data().progress;
  const level = buddyLevel(progress.stars);
  if (level.level <= (progress.buddyLevelSeen ?? 1)) return null;
  game.save.markBuddyLevelSeen(level.level);

  const overlay = document.createElement("div");
  overlay.className = "buddy-levelup";
  overlay.dataset.buddyLevelup = String(level.level);
  const card = document.createElement("div");
  card.className = "buddy-levelup-card";
  card.innerHTML = `<strong>Buddy groeit!</strong><em>${level.title}</em><small>tik om verder te gaan</small>`;
  const hero = createBuddy(skinById(progress.cosmetics.activeSkin), progress.stars);
  hero.el.classList.add("buddy-levelup-hero");
  hero.setMood("wow");
  card.prepend(hero.el);
  const burst = document.createElement("div");
  burst.className = "results-burst buddy-levelup-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
  overlay.append(card, burst);
  overlay.addEventListener("click", () => overlay.remove());

  game.audio.play("win");
  game.haptics.play("win");
  game.voice.speak(`Buddy groeit! ${level.title}!`, { interrupt: true, pitch: 1.2 });
  root.appendChild(overlay);
  return overlay;
}
