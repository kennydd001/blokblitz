// The session treasure loop: every finished activity fills a 3-gem meter; a full
// meter spawns a treasure chest worth a big reward. Shared by the Sterrenreis
// map and the Speeltuin hub so the loop is visible wherever the child lands.

import type { Game } from "../game/Game";
import { skinById } from "../runner/skins";
import { buddyLevel, createBuddy, type Buddy } from "./buddy";

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
