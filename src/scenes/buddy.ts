import type { HeroSkin } from "../runner/skins";
import { cssHex } from "../runner/worlds";

// A living little buddy that is WITH the child in every calm mode — the same hero
// they pick in the garage. It blinks and breathes on its own, looks at the puzzle,
// cheers when they're right, gently encourages when they're not, and dances at the
// end. This is what turns "answer the questions" into "play with my dino".

export type BuddyMood = "idle" | "think" | "happy" | "oops" | "wow" | "sleep";

export interface Buddy {
  el: HTMLElement;
  setMood(mood: BuddyMood, revertMs?: number): void;
  say(text: string): void;
  name: string;
}

// Buddy grows with the child: stars feed the dino, and at each threshold it
// visibly evolves (scarf -> cape -> crown -> star glow). Accessories stack, so
// a Sterrendino proudly wears everything it earned along the way.
export interface BuddyLevel {
  level: number;
  stars: number;
  title: string;
}

export const BUDDY_LEVELS: BuddyLevel[] = [
  { level: 1, stars: 0, title: "Kleine dino" },
  { level: 2, stars: 25, title: "Coole dino" },
  { level: 3, stars: 60, title: "Superdino" },
  { level: 4, stars: 120, title: "Koningsdino" },
  { level: 5, stars: 250, title: "Sterrendino" }
];

export function buddyLevel(stars: number): BuddyLevel {
  let current = BUDDY_LEVELS[0];
  for (const entry of BUDDY_LEVELS) {
    if (stars >= entry.stars) current = entry;
  }
  return current;
}

// Per-level accessory art layered into the buddy SVG (same chunky outlines).
function accessorySvg(level: number): string {
  let out = "";
  if (level >= 3) {
    out += `<path class="buddy-acc buddy-acc-cape" d="M36 46 q-16 26 -6 52 l14 -6 z M90 46 q16 26 6 52 l-14 -6 z" fill="#e4564b" stroke="#10131c" stroke-width="3"/>`;
  }
  return out;
}

// Accessories that sit ON TOP of the body (scarf, crown, orbiting stars).
function overlaySvg(level: number): string {
  let out = "";
  if (level >= 2) {
    out += `<path class="buddy-acc buddy-acc-scarf" d="M40 44 q23 12 46 0 l-4 10 q-19 9 -38 0 z" fill="#37c0f0" stroke="#10131c" stroke-width="3"/>`;
  }
  if (level >= 4) {
    out += `<g class="buddy-acc buddy-acc-crown" stroke="#10131c" stroke-width="2.5"><path d="M46 22 l5 -12 l7 8 l7 -11 l7 11 l7 -8 l5 12 z" fill="#f4b942"/><circle cx="51" cy="9" r="2.6" fill="#ff5fb8"/><circle cx="72" cy="6" r="2.6" fill="#37c0f0"/><circle cx="84" cy="9" r="2.6" fill="#7ddf7d"/></g>`;
  }
  if (level >= 5) {
    out += `<g class="buddy-acc buddy-acc-stars"><text class="buddy-orbit-star s1" x="12" y="52">⭐</text><text class="buddy-orbit-star s2" x="96" y="42">⭐</text><text class="buddy-orbit-star s3" x="18" y="98">✨</text></g>`;
  }
  return out;
}

export function createBuddy(skin: HeroSkin, stars = 0): Buddy {
  const level = buddyLevel(stars).level;
  const wrap = document.createElement("div");
  wrap.className = "buddy mood-idle";
  wrap.dataset.buddy = skin.id;
  wrap.dataset.buddyLevel = String(level);
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
        ${accessorySvg(level)}
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
        <g class="buddy-sleep-eyes" fill="none" stroke="#10131c" stroke-width="3" stroke-linecap="round"><path d="M43 61 q9 7 18 0"/><path d="M67 61 q9 7 18 0"/></g>
        <g class="buddy-sleep-z" fill="#fff7cf" stroke="#10131c" stroke-width="0.7" paint-order="stroke"><text x="91" y="42">z</text><text x="101" y="29">Z</text></g>
        <ellipse class="buddy-cheek" cx="44" cy="72" rx="5" ry="3.5" fill="#ff7eb6"/>
        <ellipse class="buddy-cheek" cx="84" cy="72" rx="5" ry="3.5" fill="#ff7eb6"/>
        <path class="buddy-mouth" d="M56 80 q8 9 16 0" fill="none" stroke="#10131c" stroke-width="3" stroke-linecap="round"/>
        ${overlaySvg(level)}
      </g>
    </svg>
  `;

  let revertTimer = 0;
  const bubble = wrap.querySelector<HTMLElement>("[data-buddy-bubble]");
  let bubbleTimer = 0;

  const setMood = (mood: BuddyMood, revertMs?: number): void => {
    wrap.classList.remove("mood-idle", "mood-think", "mood-happy", "mood-oops", "mood-wow", "mood-sleep");
    wrap.classList.add(`mood-${mood}`);
    if (revertTimer) window.clearTimeout(revertTimer);
    if (revertMs && mood !== "idle") {
      revertTimer = window.setTimeout(() => {
        wrap.classList.remove("mood-happy", "mood-oops", "mood-wow", "mood-think", "mood-sleep");
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
