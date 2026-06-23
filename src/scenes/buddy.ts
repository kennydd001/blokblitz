import type { HeroSkin } from "../runner/skins";
import { cssHex } from "../runner/worlds";

// A living little buddy that is WITH the child in every calm mode — the same hero
// they pick in the garage. It blinks and breathes on its own, looks at the puzzle,
// cheers when they're right, gently encourages when they're not, and dances at the
// end. This is what turns "answer the questions" into "play with my dino".

export type BuddyMood = "idle" | "think" | "happy" | "oops" | "wow";

export interface Buddy {
  el: HTMLElement;
  setMood(mood: BuddyMood, revertMs?: number): void;
  say(text: string): void;
  name: string;
}

export function createBuddy(skin: HeroSkin): Buddy {
  const wrap = document.createElement("div");
  wrap.className = "buddy mood-idle";
  wrap.dataset.buddy = skin.id;
  wrap.style.setProperty("--b", cssHex(skin.colors.body));
  wrap.style.setProperty("--be", cssHex(skin.colors.belly));
  wrap.style.setProperty("--ac", cssHex(skin.colors.accent));
  wrap.setAttribute("aria-hidden", "true");

  wrap.innerHTML = `
    <div class="buddy-bubble" data-buddy-bubble></div>
    <svg class="buddy-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <g class="buddy-fx">
        <text class="buddy-emote heart" x="92" y="34">💖</text>
        <text class="buddy-emote star" x="20" y="32">⭐</text>
        <text class="buddy-emote spark" x="60" y="18">✨</text>
      </g>
      <g class="buddy-body">
        <path class="buddy-tail" d="M22 86 q-14 2 -16 16 q14 -2 18 -10 z" fill="var(--b)" stroke="#10131c" stroke-width="3"/>
        <g class="buddy-spikes" fill="var(--ac)" stroke="#10131c" stroke-width="2.5">
          <path d="M52 24 l8 -14 l8 14 z"/>
          <path d="M66 26 l7 -12 l7 12 z"/>
        </g>
        <rect class="buddy-torso" x="34" y="40" width="58" height="58" rx="22" fill="var(--b)" stroke="#10131c" stroke-width="3.5"/>
        <ellipse class="buddy-belly" cx="63" cy="74" rx="18" ry="20" fill="var(--be)"/>
        <g class="buddy-foot"><ellipse cx="48" cy="100" rx="11" ry="7" fill="var(--ac)" stroke="#10131c" stroke-width="3"/></g>
        <g class="buddy-foot"><ellipse cx="78" cy="100" rx="11" ry="7" fill="var(--ac)" stroke="#10131c" stroke-width="3"/></g>
        <g class="buddy-eye"><circle cx="52" cy="60" r="9" fill="#fff" stroke="#10131c" stroke-width="2.5"/><circle class="pupil" cx="54" cy="61" r="4.2" fill="#10131c"/></g>
        <g class="buddy-eye"><circle cx="76" cy="60" r="9" fill="#fff" stroke="#10131c" stroke-width="2.5"/><circle class="pupil" cx="78" cy="61" r="4.2" fill="#10131c"/></g>
        <ellipse class="buddy-cheek" cx="44" cy="72" rx="5" ry="3.5" fill="#ff7eb6"/>
        <ellipse class="buddy-cheek" cx="84" cy="72" rx="5" ry="3.5" fill="#ff7eb6"/>
        <path class="buddy-mouth" d="M56 80 q8 9 16 0" fill="none" stroke="#10131c" stroke-width="3" stroke-linecap="round"/>
      </g>
    </svg>
  `;

  let revertTimer = 0;
  const bubble = wrap.querySelector<HTMLElement>("[data-buddy-bubble]");
  let bubbleTimer = 0;

  const setMood = (mood: BuddyMood, revertMs?: number): void => {
    wrap.classList.remove("mood-idle", "mood-think", "mood-happy", "mood-oops", "mood-wow");
    wrap.classList.add(`mood-${mood}`);
    if (revertTimer) window.clearTimeout(revertTimer);
    if (revertMs && mood !== "idle") {
      revertTimer = window.setTimeout(() => {
        wrap.classList.remove("mood-happy", "mood-oops", "mood-wow", "mood-think");
        wrap.classList.add("mood-idle");
      }, revertMs);
    }
  };

  const say = (text: string): void => {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("show");
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => bubble.classList.remove("show"), 1700);
  };

  return { el: wrap, setMood, say, name: skin.name };
}
