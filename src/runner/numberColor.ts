// One stable colour per quantity 1..10. The whole point of the gate revamp:
// "which number is which gate" is answered by COLOUR first (every 7 is always
// the same purple-pink), then the giant numeral, then the getalbeeld. The child
// can lock onto "my colour" before they can parse dots at running speed.
//
// This lives in its own three-free module so the HUD (RunScene) can tint the
// target card without pulling the lazily-loaded Three.js chunk into the boot
// bundle; voxelNumber re-exports it for the 3D side.
const NUMBER_COLORS = [
  0xff3b30, // 1 red
  0xff8c1a, // 2 orange
  0xffd60a, // 3 yellow
  0x34c759, // 4 green
  0x0a84ff, // 5 blue
  0x7c5cff, // 6 purple
  0xff5fb8, // 7 pink
  0x00c8d6, // 8 cyan
  0x9be35a, // 9 lime
  0xf4b942 // 10 gold
];

/** The canonical colour for a quantity (1..10), used by the runner gates + HUD. */
export function numberColor(quantity: number): number {
  const q = Math.max(1, Math.min(10, Math.round(quantity)));
  return NUMBER_COLORS[(q - 1) % NUMBER_COLORS.length];
}
