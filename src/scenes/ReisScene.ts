import {
  FRIENDS,
  FRIEND_STORY,
  JOURNEY,
  JOURNEY_HEIGHT,
  JOURNEY_INTRO,
  JOURNEY_WIDTH,
  REGION_STORY,
  frontierIndex,
  journeyFinale,
  journeyNodeAction,
  journeyNodeTitle,
  journeyProgressLabel,
  nodeIndexById,
  regionBands,
  type JourneyNode
} from "../data/journey";
import type { Game } from "../game/Game";
import { buildBossArt } from "./bossArt";
import { skinById } from "../runner/skins";
import { cssHex, getWorld, type PropStyle } from "../runner/worlds";
import { createBuddy, type Buddy } from "./buddy";
import { maybeBuddyLevelUp, spawnTreasureChest, treasureMeter } from "./treasure";
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
    top.append(stars, treasureMeter(this.game), progressPill, bag);

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
    map.appendChild(this.buildClouds());

    JOURNEY.forEach((node, index) => {
      const state = completed.has(node.id) ? "done" : index === frontier ? "now" : "locked";
      map.appendChild(this.buildNode(node, index, state, frontier));
    });

    // Buddy stands on the frontier node (or the star when the journey is done).
    this.buddy = createBuddy(skinById(this.game.data().progress.cosmetics.activeSkin), this.game.data().progress.stars);
    this.buddy.el.classList.add("reis-buddy");
    this.buddy.el.style.left = `${(here.x / JOURNEY_WIDTH) * 100}%`;
    this.buddy.el.style.top = `${here.y - 78}px`;
    map.appendChild(this.buddy.el);

    // Rescued friends come along: a little parade trailing Buddy down the road.
    const parade = FRIENDS.filter((friend) => completed.has(friend.id));
    parade.forEach((friend, i) => {
      const trail = document.createElement("div");
      trail.className = "reis-parade";
      trail.dataset.friend = friend.id;
      trail.style.setProperty("--i", String(i));
      trail.style.left = `${((here.x + (i % 2 === 0 ? -1 : 1) * 24) / JOURNEY_WIDTH) * 100}%`;
      trail.style.top = `${here.y + 36 + (i + 1) * 40}px`;
      trail.textContent = friend.emoji;
      trail.setAttribute("aria-hidden", "true");
      map.appendChild(trail);
    });

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
    this.maybeDailyChest();
    spawnTreasureChest(this.game, this.root, this.buddy);
    maybeBuddyLevelUp(this.game, this.root);
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
      `<radialGradient id="reis-sun"><stop offset="0" stop-color="#fff7c0" stop-opacity="0.95"/><stop offset="1" stop-color="#fff7c0" stop-opacity="0"/></radialGradient>` +
      // Sleeping-world veil: solid grey that melts away near its bottom edge,
      // so the border with the healed world below reads as soft morning mist.
      `<linearGradient id="reis-veil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6478"/><stop offset="0.94" stop-color="#5a6478"/><stop offset="1" stop-color="#5a6478" stop-opacity="0"/></linearGradient>`;
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

    // World healing: regions ahead sleep under a grey veil that lifts as their
    // nodes are completed — the child literally SEES the colours come back.
    const completedIds = new Set(this.journey().completed);
    const veils = bandList
      .map((band) => {
        const nodes = JOURNEY.filter((node) => node.regionId === band.regionId);
        const done = nodes.filter((node) => completedIds.has(node.id)).length;
        const completion = nodes.length ? done / nodes.length : 0;
        const opacity = (0.48 * (1 - completion)).toFixed(2);
        return `<rect class="reis-band-veil" data-region="${band.regionId}" data-completion="${completion.toFixed(2)}" x="0" y="${band.topY}" width="${JOURNEY_WIDTH}" height="${band.bottomY - band.topY}" fill="url(#reis-veil)" opacity="${opacity}"/>`;
      })
      .join("");

    // Fully healed regions come ALIVE: little animated critters per world
    // (butterflies, sparkles, snow, fireflies...) — the reward for finishing
    // a region is a visibly living stretch of map. Deterministic positions.
    const life = bandList
      .map((band, bandIndex) => {
        const nodes = JOURNEY.filter((node) => node.regionId === band.regionId);
        const done = nodes.filter((node) => completedIds.has(node.id)).length;
        if (!nodes.length || done < nodes.length) return "";
        const world = getWorld(band.regionId);
        const height = band.bottomY - band.topY;
        const pieces: string[] = [];
        for (let i = 0; i < 7; i += 1) {
          const fx = 24 + ((Math.sin((i + 1) * 12.9 + band.topY * 0.13) + 1) / 2) * (JOURNEY_WIDTH - 48);
          const fy = band.topY + 46 + ((Math.sin((i + 1) * 7.3 + band.bottomY * 0.11) + 1) / 2) * (height - 92);
          pieces.push(this.lifePiece(world.palette.propStyle, fx.toFixed(0), fy.toFixed(0), ((i * 0.7) % 2.8).toFixed(1)));
        }
        // The rescued friend has moved back home: it wanders around the spot
        // where it was freed. (FRIENDS is region-ordered, like bandList.)
        const friend = FRIENDS[bandIndex];
        const friendNode = nodes.find((node) => node.kind === "friend");
        if (friend && friendNode) {
          const fx = friendNode.x > JOURNEY_WIDTH / 2 ? friendNode.x - 96 : friendNode.x + 56;
          pieces.push(
            `<g transform="translate(${fx} ${friendNode.y + 4})"><g class="reis-life-piece life-wander"><text font-size="22" text-anchor="middle" dominant-baseline="central">${friend.emoji}</text></g></g>`
          );
        }
        return `<g class="reis-life" data-region="${band.regionId}">${pieces.join("")}</g>`;
      })
      .join("");

    // Smooth climbing road through the node coordinates.
    let path = `M ${JOURNEY[0].x} ${JOURNEY[0].y}`;
    for (let i = 1; i < JOURNEY.length; i += 1) {
      const a = JOURNEY[i - 1];
      const b = JOURNEY[i];
      const midY = (a.y + b.y) / 2;
      path += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    }

    // The golden trail: the stretch of road Buddy has already travelled.
    const frontier = frontierIndex(this.journey().completed);
    const progressPct = Math.max(0, Math.min(100, (frontier / (JOURNEY.length - 1)) * 100));
    const trail =
      progressPct > 0
        ? `<path class="reis-road-trail-glow" d="${path}" fill="none" stroke="#ffd75e" stroke-width="22" stroke-linecap="round" opacity="0.3" pathLength="100" stroke-dasharray="${progressPct.toFixed(1)} 100"/>` +
          `<path class="reis-road-trail" data-progress="${Math.round(progressPct)}" d="${path}" fill="none" stroke="#ffc61a" stroke-width="13" stroke-linecap="round" pathLength="100" stroke-dasharray="${progressPct.toFixed(1)} 100"/>`
        : "";

    // Region gates: a welcoming arch over the road at each world border, with
    // the next world's name on the beam. Band borders fall exactly on segment
    // midpoints, where the bezier's x is the average of the neighbouring nodes.
    // Gates ahead of Buddy sleep in grey; passing the border wakes them up.
    const frontierRegion = JOURNEY[Math.min(frontier, JOURNEY.length - 1)].regionId;
    const reachedBand = bandList.findIndex((band) => band.regionId === frontierRegion);
    const gates = bandList
      .slice(1)
      .map((band, idx) => {
        const y = band.bottomY;
        const below = [...JOURNEY].reverse().find((node) => node.y >= y);
        const aboveIndex = below ? JOURNEY.indexOf(below) + 1 : -1;
        const above = aboveIndex >= 0 && aboveIndex < JOURNEY.length ? JOURNEY[aboveIndex] : undefined;
        if (!below || !above) return "";
        // Anchor the arch a little BEFORE the border (on the previous region's
        // stretch) so it never collides with the node circles on either side.
        // Solve the road bezier for the exact point at that y, so the gate
        // always stands ON the road even in curvy segments.
        const gateY = y + 52;
        const midY = (below.y + above.y) / 2;
        const cubic = (p0: number, p1: number, p2: number, p3: number, t: number) => {
          const u = 1 - t;
          return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
        };
        let lo = 0;
        let hi = 1;
        for (let k = 0; k < 24; k += 1) {
          const t = (lo + hi) / 2;
          if (cubic(below.y, midY, midY, above.y, t) > gateY) lo = t;
          else hi = t;
        }
        const tGate = (lo + hi) / 2;
        const x = cubic(below.x, below.x, above.x, above.x, tGate).toFixed(0);
        const world = getWorld(band.regionId);
        const pillar = lightenHex(band.color, -0.25);
        const beam = lightenHex(band.color, 0.4);
        const awake = idx + 1 <= reachedBand;
        // Buddy standing on this gate's doorstep (the region's first node)?
        // Then the "volgende stap" label pill hangs exactly where the name
        // plate sits — drop the plate for now; the welcome banner names the
        // world, and the plate returns as soon as Buddy walks on.
        const doorstep = JOURNEY[Math.min(frontier, JOURNEY.length - 1)] === above;
        const plate = doorstep
          ? ""
          : `<rect x="-54" y="-46" width="108" height="26" rx="12" fill="${beam}" stroke="#10131c" stroke-width="2.5"/>
          <text x="0" y="-27.5" text-anchor="middle" font-size="13" font-weight="800" fill="#10131c">${world.emoji} ${world.name}</text>`;
        return `<g class="reis-region-gate${awake ? " awake" : ""}" data-region="${band.regionId}" transform="translate(${x} ${gateY})">
          <rect x="-46" y="-50" width="12" height="52" rx="4" fill="${pillar}" stroke="#10131c" stroke-width="2.5"/>
          <rect x="34" y="-50" width="12" height="52" rx="4" fill="${pillar}" stroke="#10131c" stroke-width="2.5"/>
          <circle cx="-40" cy="-52" r="7" fill="${beam}" stroke="#10131c" stroke-width="2.5"/>
          <circle cx="40" cy="-52" r="7" fill="${beam}" stroke="#10131c" stroke-width="2.5"/>
          <path d="M -40 -59 l 0 -13 l 14 5 l -14 5" fill="#f4b942" stroke="#10131c" stroke-width="2" stroke-linejoin="round"/>
          ${plate}
        </g>`;
      })
      .join("");

    holder.innerHTML = `<svg viewBox="0 0 ${JOURNEY_WIDTH} ${JOURNEY_HEIGHT}" width="${JOURNEY_WIDTH}" height="${JOURNEY_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${defs}</defs>
      <g class="reis-bands">${bands}</g>
      ${sun}
      <g class="reis-starfield">${stars}</g>
      <g class="reis-decor">${this.decorations()}</g>
      <g class="reis-veils">${veils}</g>
      <path d="${path}" fill="none" stroke="#10131c" stroke-width="32" stroke-linecap="round" opacity="0.16"/>
      <path d="${path}" fill="none" stroke="#fff3d8" stroke-width="27" stroke-linecap="round"/>
      <path d="${path}" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" opacity="0.5"/>
      ${trail}
      <path d="${path}" fill="none" stroke="#f4b942" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 24"/>
      <g class="reis-gates">${gates}</g>
      <g class="reis-life-layer">${life}</g>
    </svg>`;
    return holder;
  }

  // Soft drifting clouds over the map sky for a living boot screen.
  private buildClouds(): DocumentFragment {
    const frag = document.createDocumentFragment();
    const spots: Array<[number, number, number]> = [
      [12, 0.16, 96],
      [70, 0.26, 78],
      [26, 0.44, 120],
      [62, 0.58, 86],
      [16, 0.74, 104],
      [72, 0.86, 80]
    ];
    spots.forEach(([leftPct, topFrac, w], i) => {
      const cloud = document.createElement("div");
      cloud.className = "reis-cloud";
      cloud.setAttribute("aria-hidden", "true");
      cloud.style.left = `${leftPct}%`;
      cloud.style.top = `${Math.round(JOURNEY_HEIGHT * topFrac)}px`;
      cloud.style.width = `${w}px`;
      cloud.style.animationDelay = `${i * -3.7}s`;
      cloud.innerHTML = `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><g fill="#ffffff"><ellipse cx="34" cy="42" rx="22" ry="13"/><ellipse cx="58" cy="32" rx="28" ry="20"/><ellipse cx="84" cy="40" rx="24" ry="15"/></g></svg>`;
      frag.appendChild(cloud);
    });
    return frag;
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

  // One animated life particle for a healed region. Outer g = static position
  // (attribute transform); inner g = CSS keyframe animation, because a CSS
  // transform would otherwise override the positioning attribute.
  private lifePiece(style: PropStyle, x: string, y: string, delay: string): string {
    const wrap = (cls: string, inner: string): string =>
      `<g transform="translate(${x} ${y})"><g class="reis-life-piece ${cls}" style="animation-delay:-${delay}s">${inner}</g></g>`;
    if (style === "tree")
      return wrap(
        "life-flutter",
        `<ellipse cx="-4" cy="0" rx="4.5" ry="3" fill="#ff8fb5" stroke="#10131c" stroke-width="1.4" transform="rotate(-22)"/><ellipse cx="4" cy="0" rx="4.5" ry="3" fill="#ffb3cd" stroke="#10131c" stroke-width="1.4" transform="rotate(22)"/><rect x="-1" y="-3.4" width="2" height="7" rx="1" fill="#10131c"/>`
      );
    if (style === "crystal")
      return wrap("life-rise", `<polygon points="0,-5 4,0 0,5 -4,0" fill="#ffd75e" stroke="#b8860b" stroke-width="1"/>`);
    if (style === "ice")
      return wrap(
        "life-fall",
        `<circle cx="0" cy="0" r="3" fill="#ffffff" opacity="0.95"/><circle cx="0" cy="0" r="5.5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.5"/>`
      );
    if (style === "mushroom") return wrap("life-glow", `<circle cx="0" cy="0" r="3.4" fill="#c9f76f"/>`);
    if (style === "star")
      return wrap("life-twinkle", `<path d="M 0 -6 L 1.7 -1.7 L 6 0 L 1.7 1.7 L 0 6 L -1.7 1.7 L -6 0 L -1.7 -1.7 Z" fill="#fff2a8"/>`);
    // cactus (bouwdorp): warm little work-sparks drifting up from the village.
    return wrap("life-rise", `<rect x="-3" y="-3" width="6" height="6" rx="1.5" fill="#ffa94d" stroke="#10131c" stroke-width="1.2"/>`);
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
      <span class="reis-node-face" aria-hidden="true">${state === "locked" ? "🔒" : node.kind === "boss" ? buildBossArt(node.regionId) : node.emoji}</span>
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
      <span class="reis-quest-emoji" aria-hidden="true">${isComplete ? "🏠" : node.kind === "boss" ? buildBossArt(node.regionId) : node.emoji}</span>
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
    const story = (node.friendId && FRIEND_STORY[node.friendId]) || "";
    this.game.voice.speak(`Hoera! ${node.friendName ?? "Een vriendje"} is gered en gaat mee! ${story}`, { interrupt: true });
  }

  private finale(node: JourneyNode): void {
    this.game.save.advanceJourney(node.id);
    this.game.audio.play("win");
    this.game.haptics.play("win");
    this.render();
    this.buddy?.setMood("wow");
    const done = new Set(this.journey().completed);
    const rescued = FRIENDS.filter((friend) => done.has(friend.id));
    this.game.voice.speak(journeyFinale(rescued.length), { interrupt: true, pitch: 1.25 });
    this.showFinaleCinematic(rescued);
  }

  // The crown of the whole journey: a full-screen night-sky show — the star
  // rises home, fireworks pop and every rescued friend hops in a parade.
  // The star node stays tappable afterwards, so the ending can be re-watched.
  private showFinaleCinematic(rescued: Array<{ id: string; name: string; emoji: string }>): void {
    const overlay = document.createElement("div");
    overlay.className = "finale-overlay";
    const skyStars = Array.from({ length: 18 }, (_, i) => {
      const left = (6 + ((Math.sin((i + 1) * 12.9) + 1) / 2) * 88).toFixed(0);
      const top = (4 + ((Math.sin((i + 1) * 7.7) + 1) / 2) * 52).toFixed(0);
      return `<i style="left:${left}%;top:${top}%;animation-delay:-${((i * 0.35) % 1.8).toFixed(2)}s"></i>`;
    }).join("");
    const sparks = Array.from({ length: 10 }, (_, i) => {
      const left = (10 + ((Math.sin((i + 1) * 5.3) + 1) / 2) * 80).toFixed(0);
      const top = (8 + ((Math.sin((i + 1) * 9.1) + 1) / 2) * 40).toFixed(0);
      return `<span class="finale-spark" style="left:${left}%;top:${top}%;animation-delay:${(0.9 + i * 0.28).toFixed(2)}s" aria-hidden="true">🎆</span>`;
    }).join("");
    const friends = rescued
      .map((friend, i) => `<span class="finale-friend" style="animation-delay:-${(i * 0.2).toFixed(1)}s" title="${friend.name}">${friend.emoji}</span>`)
      .join("");
    overlay.innerHTML = `
      <div class="finale-sky" aria-hidden="true">${skyStars}</div>
      <span class="finale-star" aria-hidden="true">⭐</span>
      ${sparks}
      <h2 class="finale-title">De ster is thuis!</h2>
      <p class="finale-line">${journeyFinale(rescued.length)}</p>
      <div class="finale-parade" aria-hidden="true">${friends}</div>
      <button type="button" class="finale-done">Hoera!</button>
    `;
    overlay.querySelector<HTMLButtonElement>(".finale-done")!.addEventListener("click", () => {
      overlay.remove();
      this.buddy?.setMood("happy", 1500);
      this.buddy?.say("Thuis!");
    });
    this.root.appendChild(overlay);
    this.addCleanup(() => overlay.remove());
    // Two extra chimes timed with the fireworks.
    const chime = window.setTimeout(() => this.game.audio.play("rescue"), 1200);
    const chime2 = window.setTimeout(() => this.game.audio.play("boost"), 2100);
    this.addCleanup(() => {
      window.clearTimeout(chime);
      window.clearTimeout(chime2);
    });
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
      const from = fromIndex >= 0 ? JOURNEY[fromIndex] : undefined;
      const to = JOURNEY[toIndex];
      if (from) this.walkBuddy(from, to);
      this.buddy?.setMood("happy", 1400);
      // Did that step finish a whole region? Sweep its veil away LIVE — the
      // emotional payoff of the healing loop is watching the colours flood in.
      const healed = from && JOURNEY.filter((node) => node.regionId === from.regionId).every((node) => completed.includes(node.id));
      if (healed && from) this.sweepVeil(from.regionId);
      // Crossing a world border: the gate Buddy walks through pops awake.
      if (from && from.regionId !== to.regionId) this.celebrateGatePass(to.regionId);
      const line = this.game.save.journeyComplete()
        ? "Helemaal thuis! Knap gedaan!"
        : healed && from
          ? `Kijk! De kleuren zijn terug in ${getWorld(from.regionId).name}!`
          : "Goed zo! Verder met de reis!";
      this.game.voice.speak(line, { interrupt: true, pitch: 1.2 });
    } else {
      this.game.voice.speak("Verder met de reis!", { interrupt: true });
    }
  }

  // Animate a just-healed region's veil from grey to clear (the render itself
  // already draws it at its final opacity, so re-lift it and let it fall).
  private sweepVeil(regionId: string): void {
    const veil = this.root.querySelector<SVGRectElement>(`.reis-band-veil[data-region="${regionId}"]`);
    if (!veil) return;
    veil.setAttribute("opacity", "0.44");
    const drop = (): void => veil.setAttribute("opacity", "0.00");
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => window.requestAnimationFrame(drop));
    } else {
      drop();
    }
    this.game.audio.play("win");
  }

  // A quick golden pop on the gate Buddy just walked through.
  private celebrateGatePass(regionId: string): void {
    const gate = this.root.querySelector<SVGGElement>(`.reis-region-gate[data-region="${regionId}"]`);
    if (!gate) return;
    const timer = window.setTimeout(() => {
      gate.classList.add("passing");
      this.game.audio.play("boost");
    }, 750);
    this.addCleanup(() => window.clearTimeout(timer));
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
  // The daily gift: a wiggling chest on the map, once per day. Opening it pops
  // a star burst + reward — a tiny ritual that makes "even kijken" worth it.
  private maybeDailyChest(): void {
    const dayKey = new Date().toISOString().slice(0, 10);
    if (!this.game.save.dailyChestAvailable(dayKey)) return;
    const chest = document.createElement("button");
    chest.type = "button";
    chest.className = "reis-chest";
    chest.dataset.dailyChest = "true";
    chest.setAttribute("aria-label", "Open je dagelijkse cadeautje");
    chest.innerHTML = `<span aria-hidden="true">🎁</span>`;
    chest.addEventListener("click", () => {
      if (!this.game.save.claimDailyChest(dayKey)) return;
      this.game.save.award({ stars: 3, blocks: 3 });
      this.game.audio.play("win");
      this.game.haptics.play("win");
      this.game.voice.speak("Hoera! Drie sterren erbij!", { interrupt: true, pitch: 1.2 });
      this.buddy?.setMood("wow", 1600);
      this.buddy?.say("Een cadeautje!");
      const burst = document.createElement("div");
      burst.className = "results-burst reis-chest-burst";
      burst.setAttribute("aria-hidden", "true");
      burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
      this.root.appendChild(burst);
      this.addCleanup(() => burst.remove());
      chest.classList.add("opened");
      chest.disabled = true;
      const timer = window.setTimeout(() => chest.remove(), 900);
      this.addCleanup(() => window.clearTimeout(timer));
    });
    this.root.appendChild(chest);
  }

  private maybeRegionBanner(here: JourneyNode): void {
    if (here.regionId === this.game.journeyLastRegion) return;
    this.game.journeyLastRegion = here.regionId;
    const world = getWorld(here.regionId);
    const story = REGION_STORY[here.regionId] ?? "";
    const banner = document.createElement("div");
    banner.className = "reis-region-banner";
    banner.setAttribute("aria-hidden", "true");
    banner.innerHTML = `<span class="reis-region-title"><span aria-hidden="true">${world.emoji}</span> Welkom in ${world.name}!</span>${story ? `<span class="reis-region-story">${story}</span>` : ""}`;
    this.root.appendChild(banner);
    const timer = window.setTimeout(() => banner.remove(), 3600);
    this.addCleanup(() => window.clearTimeout(timer));
    if (this.journey().completed.length > 0) this.game.voice.speak(`Welkom in ${world.name}! ${story}`, { interrupt: false });
  }

  private intro(): void {
    this.game.journeySeenCompleted = this.journey().completed.length;
    this.buddy?.setMood("happy", 1500);
    // A brand-new journey opens with the story; returning players just get nudged.
    if (this.journey().completed.length === 0) {
      this.showStoryCard();
      return;
    }
    this.game.voice.speak("Verder met de reis! Waar gaan we heen?", { interrupt: true });
  }

  // The opening story beat: a tappable card that sets up the whole adventure.
  private showStoryCard(): void {
    const overlay = document.createElement("div");
    overlay.className = "reis-story-overlay";
    const card = document.createElement("div");
    card.className = "reis-story-card";
    card.innerHTML =
      `<div class="reis-story-star" aria-hidden="true">⭐</div>` +
      `<h2>${JOURNEY_INTRO.title}</h2>` +
      JOURNEY_INTRO.lines.map((line) => `<p>${line}</p>`).join("");
    const start = document.createElement("button");
    start.type = "button";
    start.className = "btn primary reis-story-start";
    start.textContent = JOURNEY_INTRO.start;
    start.addEventListener("click", () => {
      overlay.remove();
      this.buddy?.setMood("wow", 1400);
      this.buddy?.say("Daar gaan we!");
      this.game.voice.speak("Daar gaan we! Volg de weg.", { interrupt: true });
    });
    card.appendChild(start);
    overlay.appendChild(card);
    this.root.appendChild(overlay);
    this.addCleanup(() => overlay.remove());
    // Read the story aloud for a pre-reader.
    this.game.voice.speak(JOURNEY_INTRO.lines.join(" "), { interrupt: true });
  }

  private bloom(nodeId: string): void {
    const el = this.root.querySelector<HTMLElement>(`.reis-node[data-node="${nodeId}"]`);
    el?.classList.add("bloom");
  }
}
