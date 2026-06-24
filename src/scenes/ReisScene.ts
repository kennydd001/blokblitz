import {
  FRIENDS,
  JOURNEY,
  JOURNEY_HEIGHT,
  JOURNEY_WIDTH,
  frontierIndex,
  journeyNodeAction,
  journeyNodeTitle,
  journeyProgressLabel,
  nodeIndexById,
  regionBands,
  type JourneyNode
} from "../data/journey";
import type { Game } from "../game/Game";
import { skinById } from "../runner/skins";
import { cssHex, getWorld, type PropStyle } from "../runner/worlds";
import { createBuddy, type Buddy } from "./buddy";
import { BaseScene } from "./SceneUtils";

// Mix a hex colour toward white (0 = unchanged, 1 = white) for the soft band tops.
function lightenHex(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const mix = (channel: number): number => Math.round(channel + (255 - channel) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// "De Sterrenreis" — one winding road that ties every activity into a single
// adventure. Exactly one node glows (the frontier); Buddy stands on it; the road
// behind is coloured and done, the road ahead is dim. Finishing an activity drops
// a stone, blooms the node into colour, slides the star up the sky, and lights the
// next node. No reading required: Buddy + spoken voice carry the story.
export class ReisScene extends BaseScene {
  private buddy?: Buddy;

  constructor(game: Game) {
    super(game, "reis");
  }

  mount(): void {
    super.mount();
    this.game.resetWorld("menu");
    const arrived = Boolean(this.game.lastJourneyNode);
    this.game.lastJourneyNode = undefined;
    this.render();
    if (arrived) this.celebrateArrival();
    else this.intro();
  }

  private journey() {
    return this.game.data().progress.journey;
  }

  private render(): void {
    this.root.replaceChildren();
    this.root.classList.add("reis-scene");
    const completedIds = this.journey().completed;
    const completed = new Set(completedIds);
    const frontier = frontierIndex(completedIds);
    const progress = Math.min(1, frontier / JOURNEY.length);
    const here = JOURNEY[Math.min(frontier, JOURNEY.length - 1)];
    // The map sounds like wherever Buddy currently stands.
    this.game.audio.startMusic(here.regionId);

    // Top bar: stars + a free-play backpack.
    const top = document.createElement("div");
    top.className = "reis-top";
    const stars = document.createElement("div");
    stars.className = "reis-stars";
    stars.innerHTML = `<span aria-hidden="true">⭐</span><strong>${this.game.data().progress.stars}</strong>`;
    const bag = this.button("🎒 Vrij spelen", () => this.game.showScene("hub"), "ghost");
    const progressPill = document.createElement("div");
    progressPill.className = "reis-progress-pill";
    progressPill.setAttribute("aria-label", "Sterrenreis voortgang");
    progressPill.innerHTML = `<span aria-hidden="true">🛤️</span><strong>${journeyProgressLabel(completedIds)}</strong>`;
    bag.classList.add("reis-bag");
    top.append(stars, progressPill, bag);

    const quest = this.buildQuest(here, frontier);

    // The rising-star sky track.
    const track = document.createElement("div");
    track.className = "reis-star-track";
    track.innerHTML = `<i class="reis-home" aria-hidden="true">🏠</i><i class="reis-star-token" aria-hidden="true" style="top:${Math.round((1 - progress) * 86)}%">⭐</i>`;

    // The scrollable map.
    const scroll = document.createElement("div");
    scroll.className = "reis-scroll";
    const map = document.createElement("div");
    map.className = "reis-map";
    map.style.height = `${JOURNEY_HEIGHT}px`;
    map.style.width = `${JOURNEY_WIDTH}px`;

    map.appendChild(this.buildBackdrop());

    JOURNEY.forEach((node, index) => {
      const state = completed.has(node.id) ? "done" : index === frontier ? "now" : "locked";
      map.appendChild(this.buildNode(node, index, state, frontier));
    });

    // Buddy stands on the frontier node (or the star when the journey is done).
    this.buddy = createBuddy(skinById(this.game.data().progress.cosmetics.activeSkin));
    this.buddy.el.classList.add("reis-buddy");
    this.buddy.el.style.left = `${(here.x / JOURNEY_WIDTH) * 100}%`;
    this.buddy.el.style.top = `${here.y - 78}px`;
    map.appendChild(this.buddy.el);

    scroll.appendChild(map);

    // Friends rescued so far + ghost slots for the rest.
    const meadow = document.createElement("div");
    meadow.className = "reis-meadow";
    FRIENDS.forEach((friend) => {
      const has = completed.has(friend.id);
      const slot = document.createElement(has ? "button" : "div") as HTMLElement;
      slot.className = `reis-friend${has ? " has" : ""}`;
      slot.dataset.friend = friend.id;
      slot.setAttribute("aria-label", has ? friend.name : "nog te redden");
      slot.textContent = has ? friend.emoji : "❓";
      if (has) {
        (slot as HTMLButtonElement).type = "button";
        slot.addEventListener("click", () => {
          slot.classList.remove("bounce");
          void slot.offsetWidth;
          slot.classList.add("bounce");
          this.game.audio.play("coin");
          this.game.voice.speak(`Hoi! Ik ben ${friend.name}!`, { interrupt: true });
        });
      }
      meadow.appendChild(slot);
    });

    this.root.append(top, quest, track, scroll, meadow);
    this.maybeRegionBanner(here);

    // Centre the frontier node so only current + next need to be on screen.
    const centerFrontier = (): void => {
      scroll.scrollTop = Math.max(0, here.y - scroll.clientHeight / 2);
    };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(centerFrontier);
    else {
      const timer = window.setTimeout(centerFrontier, 0);
      this.addCleanup(() => window.clearTimeout(timer));
    }
  }

  private buildBackdrop(): SVGSVGElement | HTMLElement {
    const holder = document.createElement("div");
    holder.className = "reis-backdrop";
    const bandList = regionBands();
    // Each region band is a soft vertical gradient (light at the top, world colour below).
    const defs =
      bandList
        .map(
          (band) =>
            `<linearGradient id="band-${band.regionId}" x1="0" y1="${band.topY}" x2="0" y2="${band.bottomY}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${lightenHex(band.color, 0.55)}"/><stop offset="1" stop-color="${band.color}"/></linearGradient>`
        )
        .join("") +
      `<radialGradient id="reis-sun"><stop offset="0" stop-color="#fff7c0" stop-opacity="0.95"/><stop offset="1" stop-color="#fff7c0" stop-opacity="0"/></radialGradient>`;
    const bands = bandList
      .map((band) => `<rect x="0" y="${band.topY}" width="${JOURNEY_WIDTH}" height="${band.bottomY - band.topY}" fill="url(#band-${band.regionId})"/>`)
      .join("");

    // Twinkling stars up in the night (the top of the road, near home).
    let stars = "";
    for (let i = 0; i < 18; i += 1) {
      const sx = (20 + ((Math.sin(i * 12.9) + 1) / 2) * (JOURNEY_WIDTH - 40)).toFixed(0);
      const sy = (24 + ((Math.sin(i * 7.3 + 1) + 1) / 2) * 760).toFixed(0);
      const r = (1.3 + ((Math.sin(i * 3.1) + 1) / 2) * 1.9).toFixed(1);
      stars += `<circle cx="${sx}" cy="${sy}" r="${r}" fill="#ffffff" opacity="0.85"/>`;
    }
    // A warm sun glow low down (the start of the journey, in daylight).
    const sun = `<circle cx="${JOURNEY_WIDTH - 56}" cy="${JOURNEY_HEIGHT - 130}" r="130" fill="url(#reis-sun)"/><circle cx="${JOURNEY_WIDTH - 56}" cy="${JOURNEY_HEIGHT - 130}" r="32" fill="#fff2a8"/>`;

    // Smooth climbing road through the node coordinates.
    let path = `M ${JOURNEY[0].x} ${JOURNEY[0].y}`;
    for (let i = 1; i < JOURNEY.length; i += 1) {
      const a = JOURNEY[i - 1];
      const b = JOURNEY[i];
      const midY = (a.y + b.y) / 2;
      path += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    }
    holder.innerHTML = `<svg viewBox="0 0 ${JOURNEY_WIDTH} ${JOURNEY_HEIGHT}" width="${JOURNEY_WIDTH}" height="${JOURNEY_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${defs}</defs>
      <g class="reis-bands">${bands}</g>
      ${sun}
      <g class="reis-starfield">${stars}</g>
      <g class="reis-decor">${this.decorations()}</g>
      <path d="${path}" fill="none" stroke="#10131c" stroke-width="32" stroke-linecap="round" opacity="0.16"/>
      <path d="${path}" fill="none" stroke="#fff3d8" stroke-width="27" stroke-linecap="round"/>
      <path d="${path}" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" opacity="0.5"/>
      <path d="${path}" fill="none" stroke="#f4b942" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 24"/>
    </svg>`;
    return holder;
  }

  // A few blocky props down each colour band's edges so every region looks distinct.
  private decorations(): string {
    return JOURNEY.map((node, i) => {
      const world = getWorld(node.regionId);
      const color = world.palette.props[i % world.palette.props.length];
      const x = i % 2 === 0 ? 34 : JOURNEY_WIDTH - 34;
      return this.prop(world.palette.propStyle, cssHex(color), x, node.y);
    }).join("");
  }

  private prop(style: PropStyle, color: string, x: number, y: number): string {
    const t = `transform="translate(${x} ${y})"`;
    if (style === "crystal") return `<g ${t}><polygon points="0,-15 8,0 0,13 -8,0" fill="${color}" stroke="#10131c" stroke-width="2"/></g>`;
    if (style === "ice") return `<g ${t}><polygon points="0,-17 6,4 -6,4" fill="#eaffff" stroke="#10131c" stroke-width="2"/></g>`;
    if (style === "mushroom") return `<g ${t}><rect x="-2" y="-2" width="4" height="11" fill="#f2ead2" stroke="#10131c" stroke-width="1.5"/><ellipse cx="0" cy="-3" rx="11" ry="7" fill="${color}" stroke="#10131c" stroke-width="2"/></g>`;
    if (style === "cactus") return `<g ${t}><rect x="-4" y="-14" width="8" height="28" rx="4" fill="${color}" stroke="#10131c" stroke-width="2"/></g>`;
    if (style === "star") return `<g ${t}><circle cx="0" cy="0" r="9" fill="${color}" opacity="0.3"/><circle cx="0" cy="0" r="5" fill="${color}"/></g>`;
    return `<g ${t}><rect x="-3" y="0" width="6" height="13" fill="#8a5a3c" stroke="#10131c" stroke-width="1.5"/><polygon points="0,-17 12,2 -12,2" fill="${color}" stroke="#10131c" stroke-width="2"/></g>`;
  }

  private buildNode(node: JourneyNode, index: number, state: string, frontier: number): HTMLElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `reis-node ${node.kind} ${state}`;
    button.dataset.node = node.id;
    button.dataset.kind = node.kind;
    button.style.left = `${(node.x / JOURNEY_WIDTH) * 100}%`;
    button.style.top = `${node.y}px`;
    button.setAttribute("aria-label", state === "locked" ? "nog op slot" : node.kind);
    button.innerHTML = `
      ${state === "now" ? '<span class="reis-beacon" aria-hidden="true"></span>' : ""}
      <span class="reis-node-face" aria-hidden="true">${state === "locked" ? "🔒" : node.emoji}</span>
      ${state === "done" ? '<span class="reis-check" aria-hidden="true">✓</span>' : ""}
    `;
    if (state === "now") {
      const title = document.createElement("span");
      title.className = "reis-node-title";
      title.textContent = journeyNodeTitle(node);
      button.appendChild(title);
    }
    button.addEventListener("click", () => this.tap(node, index, frontier));
    return button;
  }

  private buildQuest(node: JourneyNode, frontier: number): HTMLElement {
    const isComplete = frontier >= JOURNEY.length;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `reis-quest ${node.kind}`;
    card.dataset.questNode = node.id;
    card.setAttribute("aria-label", `Volgende stap: ${isComplete ? "Ster thuis" : journeyNodeTitle(node)}`);
    card.innerHTML = `
      <span class="reis-quest-emoji" aria-hidden="true">${isComplete ? "🏠" : node.emoji}</span>
      <span class="reis-quest-copy">
        <small>${isComplete ? "Klaar" : "Volgende stap"}</small>
        <strong>${isComplete ? "Ster thuis" : journeyNodeTitle(node)}</strong>
        <em>${isComplete ? "Alle vriendjes zijn mee." : journeyNodeAction(node)}</em>
      </span>
      <span class="reis-quest-go" aria-hidden="true">▶</span>
    `;
    card.addEventListener("click", () => this.tap(node, Math.min(frontier, JOURNEY.length - 1), frontier));
    return card;
  }

  private tap(node: JourneyNode, index: number, frontier: number): void {
    if (index > frontier) {
      // Locked-but-no-wall: a gentle wiggle and a nudge from Buddy.
      const el = this.root.querySelector<HTMLElement>(`.reis-node[data-node="${node.id}"]`);
      el?.classList.remove("shake");
      void el?.offsetWidth;
      el?.classList.add("shake");
      this.buddy?.setMood("think", 900);
      this.buddy?.say("Eerst deze!");
      this.game.voice.speak("Eerst deze!", { interrupt: true });
      return;
    }
    if (node.kind === "friend") return this.rescueFriend(node);
    if (node.kind === "star") return this.finale(node);
    // A stop or a gate: remember which node launched it, then play the existing activity.
    this.game.lastJourneyNode = node.id;
    this.game.save.startNewSession();
    if (node.kind === "gate") {
      this.game.requestFullscreenPlay();
      this.game.showScene("run", { worldId: node.worldId });
    } else {
      this.game.showScene(node.scene as string);
    }
  }

  private rescueFriend(node: JourneyNode): void {
    this.game.save.advanceJourney(node.id);
    this.game.audio.play("rescue");
    this.game.haptics.play("rescue");
    this.render();
    this.bloom(node.id);
    this.buddy?.setMood("wow", 1600);
    this.buddy?.say(`${node.friendName ?? "Vriendje"}!`);
    this.game.voice.speak(`Hoera! ${node.friendName ?? "Een vriendje"} is gered en gaat mee!`, { interrupt: true });
  }

  private finale(node: JourneyNode): void {
    this.game.save.advanceJourney(node.id);
    this.game.audio.play("win");
    this.game.haptics.play("win");
    this.render();
    this.buddy?.setMood("wow");
    this.buddy?.say("Thuis!");
    this.game.voice.speak("Hoera! We zijn thuis! De ster schijnt weer!", { interrupt: true, pitch: 1.25 });
    const burst = document.createElement("div");
    burst.className = "results-burst reis-finale";
    burst.setAttribute("aria-hidden", "true");
    burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
    this.root.appendChild(burst);
    this.addCleanup(() => burst.remove());
  }

  private celebrateArrival(): void {
    const completed = this.journey().completed;
    if (completed.length > this.game.journeySeenCompleted) {
      const justDone = completed[completed.length - 1];
      this.bloom(justDone);
      this.game.journeySeenCompleted = completed.length;
      // Buddy walks along the road from the stone it just dropped to the next one.
      const fromIndex = nodeIndexById(justDone);
      const toIndex = Math.min(frontierIndex(completed), JOURNEY.length - 1);
      if (fromIndex >= 0) this.walkBuddy(JOURNEY[fromIndex], JOURNEY[toIndex]);
      this.buddy?.setMood("happy", 1400);
      this.game.voice.speak(this.game.save.journeyComplete() ? "Helemaal thuis! Knap gedaan!" : "Goed zo! Verder met de reis!", {
        interrupt: true,
        pitch: 1.2
      });
    } else {
      this.game.voice.speak("Verder met de reis!", { interrupt: true });
    }
  }

  // Slide Buddy from one node to the next so the road feels travelled, not teleported.
  private walkBuddy(from: JourneyNode, to: JourneyNode): void {
    const buddy = this.buddy;
    if (!buddy) return;
    const el = buddy.el;
    el.classList.remove("walking");
    el.style.left = `${(from.x / JOURNEY_WIDTH) * 100}%`;
    el.style.top = `${from.y - 78}px`;
    void el.offsetWidth;
    el.classList.add("walking");
    const step = (): void => {
      el.style.left = `${(to.x / JOURNEY_WIDTH) * 100}%`;
      el.style.top = `${to.y - 78}px`;
    };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(step);
    else step();
  }

  // A brief "welcome" the first time Buddy enters each region (visual + spoken + music already switched).
  private maybeRegionBanner(here: JourneyNode): void {
    if (here.regionId === this.game.journeyLastRegion) return;
    this.game.journeyLastRegion = here.regionId;
    const world = getWorld(here.regionId);
    const banner = document.createElement("div");
    banner.className = "reis-region-banner";
    banner.setAttribute("aria-hidden", "true");
    banner.innerHTML = `<span aria-hidden="true">${world.emoji}</span> Welkom in ${world.name}!`;
    this.root.appendChild(banner);
    const timer = window.setTimeout(() => banner.remove(), 2400);
    this.addCleanup(() => window.clearTimeout(timer));
    if (this.journey().completed.length > 0) this.game.voice.speak(`Welkom in ${world.name}!`, { interrupt: false });
  }

  private intro(): void {
    this.game.journeySeenCompleted = this.journey().completed.length;
    const line = this.journey().completed.length === 0 ? "Oh nee! Mijn sterretje! Help je hem naar huis?" : "Verder met de reis! Waar gaan we heen?";
    this.buddy?.setMood("happy", 1500);
    this.game.voice.speak(line, { interrupt: true });
  }

  private bloom(nodeId: string): void {
    const el = this.root.querySelector<HTMLElement>(`.reis-node[data-node="${nodeId}"]`);
    el?.classList.add("bloom");
  }
}
