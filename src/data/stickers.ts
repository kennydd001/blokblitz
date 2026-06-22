// Collectible stickers — a simple, motivating "verzamelboek" so the child keeps
// coming back. Each unlocks from a milestone in the shared progress, so we don't
// need extra tracking. Earned stickers show in colour on the hub; locked ones are
// greyed out, which is exactly the "I want them all" pull young kids love.

import type { GameProgress } from "../education/types";

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  earned: (progress: GameProgress) => boolean;
}

export const STICKERS: Sticker[] = [
  { id: "first-star", emoji: "🌟", name: "Eerste ster", earned: (p) => p.stars >= 1 },
  { id: "first-run", emoji: "🏃", name: "Eerste run", earned: (p) => p.runsCompleted >= 1 },
  { id: "ten-stars", emoji: "⭐", name: "Tien sterren", earned: (p) => p.stars >= 10 },
  { id: "busy", emoji: "🔢", name: "Vlijtig", earned: (p) => p.attempts.length >= 20 },
  { id: "world-coin", emoji: "🪙", name: "Muntgrot", earned: (p) => Boolean(p.worlds.muntgrot?.completed) },
  { id: "star-catcher", emoji: "✨", name: "Sterrenvanger", earned: (p) => p.stars >= 25 },
  { id: "runner", emoji: "🚀", name: "Hardloper", earned: (p) => p.runsCompleted >= 5 },
  { id: "builder", emoji: "🧱", name: "Bouwer", earned: (p) => p.numberBlocks >= 30 },
  { id: "world-web", emoji: "🕸️", name: "Webwoud", earned: (p) => Boolean(p.worlds.webwoud?.completed) },
  { id: "brainy", emoji: "🧠", name: "Getallenbaas", earned: (p) => p.attempts.length >= 60 },
  { id: "champion", emoji: "🏆", name: "Kampioen", earned: (p) => p.stars >= 60 },
  { id: "rainbow", emoji: "🌈", name: "Alle werelden", earned: (p) => Object.values(p.worlds).length > 0 && Object.values(p.worlds).every((w) => w.completed) }
];

export function earnedStickerIds(progress: GameProgress): string[] {
  return STICKERS.filter((sticker) => sticker.earned(progress)).map((sticker) => sticker.id);
}

export function stickerById(id: string): Sticker | undefined {
  return STICKERS.find((sticker) => sticker.id === id);
}
