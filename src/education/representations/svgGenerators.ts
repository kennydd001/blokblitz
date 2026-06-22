import {
  alternateParts,
  canonicalDotPositions,
  canonicalParts,
  clampQuantity,
  diceParts,
  dicePips,
  dominoParts,
  fiveFrameCells,
  tenFrameCells
} from "../quantityLayouts";
import type { Representation } from "../types";
import type { RenderOptions } from "./types";

// Vivid, high-contrast palette so a 4-7 year old can isolate the quantity at a
// glance — stark ink for dots/pips and bright primaries for carriers/frames.
const colors = {
  ink: "#10131c",
  softInk: "#3a4456",
  card: "#fffdf5",
  edge: "#10131c",
  gold: "#ffcc33",
  red: "#ff3b30",
  white: "#ffffff",
  teal: "#00bcd4",
  blue: "#0a84ff",
  green: "#34c759",
  purple: "#7c5cff",
  orange: "#ff8c1a",
  pink: "#ff7eb6"
};

function svgFrame(width: number, height: number, body: string, options: RenderOptions = {}): string {
  const selected = options.selected ? " selected" : "";
  const compact = options.compact ? " compact" : "";
  return `<svg class="quantity-svg${selected}${compact}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(
    options.label ?? "quantity"
  )}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function card(width: number, height: number, fill = colors.card): string {
  return `<rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="8" fill="${fill}" stroke="${
    colors.edge
  }" stroke-width="3"/>`;
}

function dot(x: number, y: number, r = 8, fill = colors.ink): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
}

function smallLabel(text: string, x: number, y: number, fill = colors.ink): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="${fill}">${text}</text>`;
}

function plusLabel(text: string, x: number, y: number): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="${colors.softInk}">${text}</text>`;
}

export function renderDotCard(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const points = canonicalDotPositions(q);
  const body = [
    card(144, 100),
    `<path d="M18 16h108" stroke="#fde68a" stroke-width="5" stroke-linecap="round"/>`,
    ...points.map((p, index) => dot(p.x, p.y, index < 5 ? 9 : 8, index < 5 ? colors.ink : colors.teal))
  ].join("");
  return svgFrame(144, 100, body, { ...options, label: options.label ?? `${q} dot card` });
}

function renderSingleDie(part: number, xOffset: number, scale = 1): string {
  const pips = dicePips(Math.max(1, part));
  const transform = `translate(${xOffset} 0) scale(${scale})`;
  const dots = pips.map((p) => dot(p.x, p.y, 6, colors.ink)).join("");
  return `<g transform="${transform}"><rect x="14" y="12" width="112" height="76" rx="12" fill="#f8fafc" stroke="${
    colors.edge
  }" stroke-width="3"/>${part === 0 ? "" : dots}</g>`;
}

export function renderDicePattern(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const parts = diceParts(q);
  const body =
    parts.length === 1
      ? `${card(144, 100, "#e0f2fe")}${renderSingleDie(parts[0], 0)}`
      : `${card(176, 100, "#e0f2fe")}${renderSingleDie(parts[0], -2, 0.72)}${renderSingleDie(parts[1], 76, 0.72)}${plusLabel(
          "+",
          88,
          55
        )}`;
  return svgFrame(parts.length === 1 ? 144 : 176, 100, body, {
    ...options,
    label: options.label ?? `${q} dice pattern`
  });
}

function renderDominoHalf(part: number, x: number): string {
  return `<g transform="translate(${x} 0)"><rect x="0" y="16" width="74" height="68" rx="8" fill="#f8fafc" stroke="${
    colors.edge
  }" stroke-width="3"/>${dicePips(Math.max(1, part))
    .slice(0, part)
    .map((p) => dot((p.x - 32) * 0.72 + 18, (p.y - 20) * 0.72 + 18, 5, colors.ink))
    .join("")}</g>`;
}

export function renderDominoPattern(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const [left, right] = dominoParts(q);
  const body = [
    card(172, 100, "#ecfccb"),
    `<rect x="16" y="14" width="140" height="72" rx="10" fill="#f8fafc" stroke="${colors.edge}" stroke-width="3"/>`,
    `<path d="M86 18v64" stroke="${colors.edge}" stroke-width="3"/>`,
    renderDominoHalf(left, 17),
    renderDominoHalf(right, 86),
    smallLabel(`${left}+${right}`, 86, 94, colors.softInk)
  ].join("");
  return svgFrame(172, 100, body, { ...options, label: options.label ?? `${q} domino pattern` });
}

export function renderFingerPattern(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const raised = Array.from({ length: q }, (_, index) => index);
  const fingers = Array.from({ length: 10 }, (_, index) => {
    const hand = index < 5 ? 0 : 1;
    const local = index % 5;
    const x = 20 + hand * 78 + local * 12;
    const active = raised.includes(index);
    const height = active ? 42 : 20;
    const y = active ? 24 : 46;
    const fill = active ? (index < 5 ? colors.green : colors.teal) : "#cbd5e1";
    return `<rect x="${x}" y="${y}" width="9" height="${height}" rx="5" fill="${fill}" stroke="${colors.edge}" stroke-width="2"/>`;
  }).join("");
  const palms = `<rect x="18" y="61" width="62" height="28" rx="12" fill="#fed7aa" stroke="${colors.edge}" stroke-width="2"/><rect x="96" y="61" width="62" height="28" rx="12" fill="#fed7aa" stroke="${colors.edge}" stroke-width="2"/>`;
  return svgFrame(176, 100, `${card(176, 100, "#fef3c7")}${fingers}${palms}`, {
    ...options,
    label: options.label ?? `${q} finger pattern`
  });
}

export function renderFiveFrame(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const rows = q <= 5 ? 1 : 2;
  const cells = rows === 1 ? fiveFrameCells(48) : [...fiveFrameCells(32), ...fiveFrameCells(68)];
  const body = [
    card(164, 100, "#f0fdfa"),
    ...cells.map((p, index) => {
      const fill = index < q ? (index < 5 ? colors.teal : colors.green) : "transparent";
      return `<rect x="${p.x - 13}" y="${p.y - 13}" width="26" height="26" rx="5" fill="${fill}" stroke="${
        colors.edge
      }" stroke-width="2"/>`;
    }),
    rows === 2 ? smallLabel("5 + " + (q - 5), 82, 94, colors.softInk) : ""
  ].join("");
  return svgFrame(164, 100, body, { ...options, label: options.label ?? `${q} five frame` });
}

export function renderTenFrame(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const body = [
    card(164, 100, "#eef2ff"),
    ...tenFrameCells().map((p, index) => {
      const fill = index < q ? (index < 5 ? colors.blue : colors.purple) : "transparent";
      return `<rect x="${p.x - 13}" y="${p.y - 13}" width="26" height="26" rx="5" fill="${fill}" stroke="${
        colors.edge
      }" stroke-width="2"/>`;
    }),
    smallLabel(q <= 5 ? `${q}` : `5 + ${q - 5}`, 82, 94, colors.softInk)
  ].join("");
  return svgFrame(164, 100, body, { ...options, label: options.label ?? `${q} ten frame` });
}

export function renderBeadString(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const beads = Array.from({ length: 10 }, (_, index) => {
    const filled = index < q;
    const fill = index < 5 ? colors.red : colors.white;
    const stroke = filled ? colors.edge : "#94a3b8";
    const opacity = filled ? 1 : 0.32;
    return `<circle cx="${24 + index * 14}" cy="48" r="8" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="${opacity}"/>`;
  }).join("");
  const body = [
    card(168, 100, "#fff7ed"),
    `<path d="M16 48h136" stroke="${colors.edge}" stroke-width="4" stroke-linecap="round"/>`,
    beads,
    smallLabel(q <= 5 ? `${q}` : `5 + ${q - 5}`, 84, 84, colors.softInk)
  ].join("");
  return svgFrame(168, 100, body, { ...options, label: options.label ?? `${q} bead string` });
}

export function renderBlockStack(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const parts = q === 8 ? alternateParts(q) : canonicalParts(q);
  const blocks: string[] = [card(168, 116, "#f5f3ff")];
  parts.forEach((part, column) => {
    for (let i = 0; i < part; i += 1) {
      const x = 38 + column * 52;
      const y = 86 - i * 15;
      const fill = column === 0 ? colors.purple : colors.gold;
      blocks.push(`<rect x="${x}" y="${y}" width="34" height="14" rx="3" fill="${fill}" stroke="${colors.edge}" stroke-width="2"/>`);
    }
  });
  blocks.push(smallLabel(parts.join("+"), 84, 108, colors.softInk));
  return svgFrame(168, 116, blocks.join(""), { ...options, label: options.label ?? `${q} block stack` });
}

export function renderEggNest(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const points = canonicalDotPositions(q);
  const eggs = points
    .map((p, index) => {
      const fill = index < 5 ? "#fef9c3" : "#dcfce7";
      return `<ellipse cx="${p.x}" cy="${p.y}" rx="9" ry="12" fill="${fill}" stroke="${colors.edge}" stroke-width="2"/>`;
    })
    .join("");
  const body = `${card(144, 100, "#ffedd5")}<ellipse cx="72" cy="68" rx="58" ry="22" fill="#a16207" opacity="0.35"/>${eggs}`;
  return svgFrame(144, 100, body, { ...options, label: options.label ?? `${q} egg nest` });
}

export function renderPawPrintGroup(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const points = canonicalDotPositions(q);
  const paws = points
    .map((p, index) => {
      const fill = index < 5 ? colors.orange : colors.pink;
      return `<g transform="translate(${p.x} ${p.y})"><circle cx="0" cy="4" r="7" fill="${fill}" stroke="${colors.edge}" stroke-width="2"/><circle cx="-7" cy="-5" r="3.5" fill="${fill}"/><circle cx="0" cy="-8" r="3.5" fill="${fill}"/><circle cx="7" cy="-5" r="3.5" fill="${fill}"/></g>`;
    })
    .join("");
  return svgFrame(144, 100, `${card(144, 100, "#fdf2f8")}${paws}`, {
    ...options,
    label: options.label ?? `${q} paw print group`
  });
}

export function renderNumeral(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const body = `${card(128, 100, "#f8fafc")}<text x="64" y="69" text-anchor="middle" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="${colors.ink}">${q}</text>`;
  return svgFrame(128, 100, body, { ...options, label: options.label ?? `numeral ${q}` });
}

export function renderMixed(quantity: number, options: RenderOptions = {}): string {
  const q = clampQuantity(quantity);
  const ten = renderTenFrame(q, { compact: true, label: `ten frame ${q}` })
    .replace("<svg", '<svg x="76" y="8" width="112" height="68"')
    .replace("</svg>", "</svg>");
  const numeral = `<text x="42" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-size="50" font-weight="900" fill="${colors.ink}">${q}</text>`;
  const parts = q <= 5 ? `${q}` : `5+${q - 5}`;
  const body = `${card(196, 100, "#ecfeff")}${numeral}${ten}${smallLabel(parts, 98, 93, colors.softInk)}`;
  return svgFrame(196, 100, body, { ...options, label: options.label ?? `mixed representation ${q}` });
}

export function renderRepresentationSvg(
  representation: Representation,
  quantity: number,
  options: RenderOptions = {}
): string {
  switch (representation) {
    case "dots":
      return renderDotCard(quantity, options);
    case "dice":
      return renderDicePattern(quantity, options);
    case "domino":
      return renderDominoPattern(quantity, options);
    case "fingers":
      return renderFingerPattern(quantity, options);
    case "fiveframe":
      return renderFiveFrame(quantity, options);
    case "tenframe":
      return renderTenFrame(quantity, options);
    case "beads":
      return renderBeadString(quantity, options);
    case "blocks":
      return renderBlockStack(quantity, options);
    case "eggs":
      return renderEggNest(quantity, options);
    case "pawprints":
      return renderPawPrintGroup(quantity, options);
    case "numeral":
      return renderNumeral(quantity, options);
    case "mixed":
      return renderMixed(quantity, options);
  }
}

