// Shared celebration / done screen for every calm mode, so they all end the same
// friendly way: confetti, a 1-3 star rating, and "Nog eens" / "Speeltuin" buttons.

export interface DoneScreenOptions {
  emoji: string;
  heading: string;
  stars: number;
  sub: string;
  newStickers?: { emoji: string; name: string }[];
  onReplay: () => void;
  onHome: () => void;
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
  home.dataset.action = "Speeltuin";
  home.textContent = "Speeltuin";
  home.addEventListener("click", options.onHome);
  actions.append(again, home);
  card.appendChild(actions);

  wrap.append(burst, card);
  return wrap;
}

export function starsFromPerfect(perfect: number, total: number): number {
  if (perfect >= total) return 3;
  if (perfect >= Math.ceil(total * 0.6)) return 2;
  return 1;
}
