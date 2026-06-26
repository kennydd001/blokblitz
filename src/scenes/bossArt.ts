// Hand-built SVG monsters for the region bosses — menacing but cute, in the same
// chunky outlined style as the buddy dino, so the boss fights have real character
// art instead of a system emoji. One distinct creature per region, themed in that
// world's colours. Pure string SVG, no assets.

interface BossArt {
  body: string;
  light: string;
  accent: string;
  eye: string;
}

const ART: Record<string, BossArt> = {
  grasland: { body: "#8b93a3", light: "#c3cad5", accent: "#5b6373", eye: "#ff5a5a" },
  muntgrot: { body: "#7b5bd6", light: "#b9a3f0", accent: "#2f2152", eye: "#ffe14d" },
  ijsbaan: { body: "#5aa9e6", light: "#cdecff", accent: "#eaf7ff", eye: "#0a3e87" },
  webwoud: { body: "#43273b", light: "#6b3a55", accent: "#e54646", eye: "#ff5fb8" },
  bouwdorp: { body: "#9aa3ad", light: "#cfd6dd", accent: "#f4b942", eye: "#ff5a5a" },
  sterrenrace: { body: "#3b2a6b", light: "#6c5cb8", accent: "#ffd33c", eye: "#ff6ad5" }
};

const INK = `stroke="#10131c" stroke-width="3.2" stroke-linejoin="round"`;
const INK2 = `stroke="#10131c" stroke-width="2.4"`;

// Angry brows + glowing eyes, shared by most bosses.
function eyes(art: BossArt, cy = 64): string {
  return `
    <g stroke="#10131c" stroke-width="4.5" stroke-linecap="round">
      <line x1="40" y1="${cy - 12}" x2="55" y2="${cy - 6}"/>
      <line x1="80" y1="${cy - 12}" x2="65" y2="${cy - 6}"/>
    </g>
    <circle cx="50" cy="${cy}" r="9" fill="#fff" ${INK2}/>
    <circle cx="52" cy="${cy + 1}" r="4.6" fill="${art.eye}"/>
    <circle cx="50.4" cy="${cy - 0.6}" r="1.5" fill="#fff"/>
    <circle cx="74" cy="${cy}" r="9" fill="#fff" ${INK2}/>
    <circle cx="76" cy="${cy + 1}" r="4.6" fill="${art.eye}"/>
    <circle cx="74.4" cy="${cy - 0.6}" r="1.5" fill="#fff"/>`;
}

const TEETH = `<path d="M47 80 h30 l-3.7 6 -3.8 -5 -3.8 5 -3.8 -5 -3.8 5 -3.8 -5 -3.7 6 z" fill="#fff" ${INK2}/>`;

function grauwgrijs(a: BossArt): string {
  return `
    <ellipse cx="60" cy="66" rx="39" ry="35" fill="${a.body}" ${INK}/>
    <path d="M28 84 q-3 12 4 14 q5 -3 4 -12 z M84 86 q4 11 11 10 q-1 -8 -7 -13 z" fill="${a.body}" ${INK2}/>
    <ellipse cx="60" cy="78" rx="20" ry="16" fill="${a.light}" opacity="0.8"/>
    ${eyes(a)}
    ${TEETH}`;
}

function schaduwvleer(a: BossArt): string {
  return `
    <path d="M22 40 q-12 -16 -4 -26 q14 8 18 24 z M98 40 q12 -16 4 -26 q-14 8 -18 24 z" fill="${a.accent}" ${INK2}/>
    <path d="M30 30 l8 -20 l10 22 z M90 30 l-8 -20 l-10 22 z" fill="${a.body}" ${INK}/>
    <ellipse cx="60" cy="68" rx="33" ry="32" fill="${a.body}" ${INK}/>
    <path d="M30 64 q14 -24 30 0 q16 -24 30 0 q-15 30 -30 12 q-15 18 -30 -12 z" fill="${a.accent}" opacity="0.45"/>
    ${eyes(a)}
    <path d="M50 84 q10 8 20 0 q-3 7 -10 7 q-7 0 -10 -7 z" fill="#10131c"/>
    <path d="M53 84 l2 7 M67 84 l-2 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
}

function vorstwolf(a: BossArt): string {
  return `
    <path d="M34 34 l-6 -22 l20 14 z M86 34 l6 -22 l-20 14 z" fill="${a.body}" ${INK}/>
    <path d="M36 32 l-3 -12 l11 9 z M84 32 l3 -12 l-11 9 z" fill="${a.accent}" ${INK2}/>
    <ellipse cx="60" cy="66" rx="36" ry="33" fill="${a.body}" ${INK}/>
    <path d="M60 70 q-22 2 -26 18 q26 8 26 -2 q0 10 26 2 q-4 -16 -26 -18 z" fill="${a.light}"/>
    <ellipse cx="60" cy="84" rx="13" ry="10" fill="${a.light}" ${INK2}/>
    <ellipse cx="60" cy="82" rx="4" ry="3" fill="#10131c"/>
    ${eyes(a, 60)}
    <path d="M50 90 q10 6 20 0" fill="none" ${INK2} stroke-linecap="round"/>
    <path d="M52 90 l-2 6 -3 -5 M68 90 l2 6 3 -5" fill="#fff" ${INK2}/>`;
}

function webbaas(a: BossArt): string {
  const legs = [-1, 1]
    .map((s) =>
      [0, 1, 2]
        .map((i) => {
          const x = 60 + s * (20 + i * 0);
          const y = 56 + i * 12;
          const ex = 60 + s * (44 - i * 2);
          const ey = 40 + i * 22;
          return `<path d="M${x} ${y} Q ${(x + ex) / 2} ${ey - 16} ${ex} ${ey}" fill="none" stroke="#10131c" stroke-width="4" stroke-linecap="round"/>`;
        })
        .join("")
    )
    .join("");
  return `
    ${legs}
    <ellipse cx="60" cy="70" rx="30" ry="28" fill="${a.body}" ${INK}/>
    <ellipse cx="60" cy="58" rx="20" ry="17" fill="${a.light}" ${INK2}/>
    <circle cx="51" cy="55" r="5" fill="#fff" ${INK2}/><circle cx="52" cy="56" r="2.4" fill="${a.eye}"/>
    <circle cx="69" cy="55" r="5" fill="#fff" ${INK2}/><circle cx="68" cy="56" r="2.4" fill="${a.eye}"/>
    <circle cx="45" cy="62" r="3" fill="${a.eye}"/><circle cx="75" cy="62" r="3" fill="${a.eye}"/>
    <path d="M54 64 q6 5 12 0" fill="none" ${INK2} stroke-linecap="round"/>`;
}

function sloopbot(a: BossArt): string {
  return `
    <line x1="60" y1="30" x2="60" y2="14" stroke="#10131c" stroke-width="3"/>
    <circle cx="60" cy="11" r="5" fill="${a.accent}" ${INK2}/>
    <rect x="30" y="34" width="60" height="58" rx="10" fill="${a.body}" ${INK}/>
    <rect x="38" y="44" width="44" height="24" rx="6" fill="#10131c"/>
    <rect x="44" y="50" width="13" height="13" rx="3" fill="${a.eye}"/>
    <rect x="63" y="50" width="13" height="13" rx="3" fill="${a.eye}"/>
    <rect x="40" y="76" width="40" height="10" rx="3" fill="${a.accent}" ${INK2}/>
    <g stroke="#10131c" stroke-width="2">${[48, 56, 64, 72].map((x) => `<line x1="${x}" y1="76" x2="${x}" y2="86"/>`).join("")}</g>
    <circle cx="35" cy="39" r="2.5" fill="${a.accent}"/><circle cx="85" cy="39" r="2.5" fill="${a.accent}"/>`;
}

function sterrenrover(a: BossArt): string {
  return `
    <path d="M34 36 l-4 -20 l14 12 z M86 36 l4 -20 l-14 12 z M60 30 l-7 -22 l14 0 z" fill="${a.accent}" ${INK2}/>
    <ellipse cx="60" cy="66" rx="37" ry="34" fill="${a.body}" ${INK}/>
    <circle cx="34" cy="52" r="2.4" fill="${a.accent}"/><circle cx="86" cy="54" r="2" fill="${a.accent}"/><circle cx="78" cy="40" r="1.8" fill="#fff"/>
    ${eyes(a)}
    <path d="M46 80 q14 12 28 0 q-4 9 -14 9 q-10 0 -14 -9 z" fill="#10131c"/>
    <path d="M50 81 h20 l-2.5 5 -2.5 -4 -2.5 4 -2.5 -4 -2.5 4 -2.5 -4 -2.5 5 z" fill="#fff"/>`;
}

const BUILDERS: Record<string, (a: BossArt) => string> = {
  grasland: grauwgrijs,
  muntgrot: schaduwvleer,
  ijsbaan: vorstwolf,
  webwoud: webbaas,
  bouwdorp: sloopbot,
  sterrenrace: sterrenrover
};

/** An SVG monster for a region's boss (falls back to the grey gloop). */
export function buildBossArt(regionId: string): string {
  const art = ART[regionId] ?? ART.grasland;
  const draw = BUILDERS[regionId] ?? grauwgrijs;
  return `<svg class="boss-art" data-boss="${regionId}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img">${draw(art)}</svg>`;
}
