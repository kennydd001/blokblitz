import {
  FRIENDS,
  JOURNEY,
  JOURNEY_HEIGHT,
  JOURNEY_WIDTH,
  frontierIndex,
  journeyNodeAction,
  journeyNodeTitle,
  journeyProgressLabel,
  regionBands,
  type JourneyNode
} from "../data/journey";
import type { Game } from "../game/Game";
import { skinById } from "../runner/skins";
import { createBuddy, type Buddy } from "./buddy";
import { BaseScene } from "./SceneUtils";

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
    this.game.audio.startMusic("hub");
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
      const slot = document.createElement("div");
      slot.className = `reis-friend${has ? " has" : ""}`;
      slot.dataset.friend = friend.id;
      slot.setAttribute("aria-label", has ? friend.name : "nog te redden");
      slot.textContent = has ? friend.emoji : "❓";
      meadow.appendChild(slot);
    });

    this.root.append(top, quest, track, scroll, meadow);

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
    const bands = regionBands()
      .map((band) => `<rect x="0" y="${band.topY}" width="${JOURNEY_WIDTH}" height="${band.bottomY - band.topY}" fill="${band.color}"/>`)
      .join("");
    // Smooth climbing road through the node coordinates.
    let path = `M ${JOURNEY[0].x} ${JOURNEY[0].y}`;
    for (let i = 1; i < JOURNEY.length; i += 1) {
      const a = JOURNEY[i - 1];
      const b = JOURNEY[i];
      const midY = (a.y + b.y) / 2;
      path += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    }
    holder.innerHTML = `<svg viewBox="0 0 ${JOURNEY_WIDTH} ${JOURNEY_HEIGHT}" width="${JOURNEY_WIDTH}" height="${JOURNEY_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g class="reis-bands">${bands}</g>
      <path d="${path}" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" opacity="0.55"/>
      <path d="${path}" fill="none" stroke="#10131c" stroke-width="30" stroke-linecap="round" opacity="0.18"/>
      <path d="${path}" fill="none" stroke="#fff7df" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 22"/>
    </svg>`;
    return holder;
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
      this.bloom(completed[completed.length - 1]);
      this.game.journeySeenCompleted = completed.length;
      this.buddy?.setMood("happy", 1400);
      this.game.voice.speak(this.game.save.journeyComplete() ? "Helemaal thuis! Knap gedaan!" : "Goed zo! Verder met de reis!", {
        interrupt: true,
        pitch: 1.2
      });
    } else {
      this.game.voice.speak("Verder met de reis!", { interrupt: true });
    }
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
