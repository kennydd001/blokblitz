import type { Game } from "../game/Game";
import { HERO_SKINS, unlockedSkinIds, type HeroSkin } from "../runner/skins";
import { createBuddy } from "./buddy";

/** Unlock every look earned by the active child and return only the new ones. */
export function unlockEligibleSkins(game: Game): HeroSkin[] {
  const progress = game.data().progress;
  const unlocked = new Set(progress.cosmetics.unlockedSkins);
  const eligible = new Set(unlockedSkinIds(progress.stars));
  const fresh = HERO_SKINS.filter((skin) => eligible.has(skin.id) && !unlocked.has(skin.id));
  if (fresh.length > 0) game.save.syncUnlockedSkins(fresh.map((skin) => skin.id));
  return fresh;
}

interface SkinUnlockOptions {
  onSelect?: (skin: HeroSkin) => void;
  onDone?: () => void;
}

/**
 * A child-facing reveal with a real choice: use the new Buddy look now or keep
 * the current one. Names reuse the existing local Lily clips.
 */
export function showSkinUnlock(root: HTMLElement, game: Game, skins: HeroSkin[], options: SkinUnlockOptions = {}): HTMLElement | null {
  if (skins.length === 0) return null;
  const overlay = document.createElement("div");
  overlay.className = "skin-reveal";
  overlay.dataset.skinReveal = "true";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  let index = 0;

  const closeOrAdvance = (selected: boolean): void => {
    // A quick choice must also retire the narration for the card that just
    // disappeared, otherwise the next visible reward can lag behind its voice.
    game.voice.cancel();
    const skin = skins[index];
    if (selected) {
      game.save.setActiveSkin(skin.id);
      game.audio.play("success");
      game.haptics.play("success");
      game.flashMessage(`${skin.name} speelt mee!`, "good");
      options.onSelect?.(skin);
    }
    index += 1;
    if (index < skins.length) {
      render();
      return;
    }
    overlay.remove();
    options.onDone?.();
  };

  const render = (): void => {
    const skin = skins[index];
    overlay.dataset.skin = skin.id;
    overlay.replaceChildren();

    const card = document.createElement("div");
    card.className = "skin-reveal-card";
    const hero = createBuddy(skin, game.data().progress.stars);
    hero.el.classList.add("skin-reveal-hero");

    const eyebrow = document.createElement("strong");
    eyebrow.textContent = "Nieuwe held!";
    const name = document.createElement("em");
    name.id = "skin-reveal-title";
    name.textContent = skin.name;
    overlay.setAttribute("aria-labelledby", name.id);
    const blurb = document.createElement("p");
    blurb.id = "skin-reveal-description";
    blurb.textContent = skin.blurb;
    overlay.setAttribute("aria-describedby", blurb.id);

    const actions = document.createElement("div");
    actions.className = "skin-reveal-actions";
    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "btn play-now skin-reveal-choose";
    choose.dataset.skin = skin.id;
    choose.textContent = `Kies ${skin.name}`;
    choose.addEventListener("click", () => closeOrAdvance(true));
    const later = document.createElement("button");
    later.type = "button";
    later.className = "btn secondary skin-reveal-later";
    later.textContent = "Later";
    later.addEventListener("click", () => closeOrAdvance(false));
    actions.append(choose, later);

    if (skins.length > 1) {
      const count = document.createElement("small");
      count.textContent = `${index + 1}/${skins.length}`;
      card.append(hero.el, eyebrow, name, blurb, count, actions);
    } else card.append(hero.el, eyebrow, name, blurb, actions);
    overlay.appendChild(card);
    game.voice.speak(skin.name, { interrupt: false });
    choose.focus();
  };

  root.appendChild(overlay);
  render();
  return overlay;
}
