// Unlockable hero looks. A 5-year-old collects stars across runs and unlocks new
// voxel heroes. Colors feed straight into the RunnerView hero builder.

export interface HeroSkin {
  id: string;
  name: string;
  /** Star total needed before this look can be chosen. 0 = available from the start. */
  unlockStars: number;
  colors: {
    body: number;
    belly: number;
    accent: number; // spikes / scarf / boots
    trail: number; // speed streaks + collected sparkle
  };
  /** Short kid-facing brag line shown when it unlocks. */
  blurb: string;
}

export const HERO_SKINS: HeroSkin[] = [
  {
    id: "blitz",
    name: "Blitz",
    unlockStars: 0,
    colors: { body: 0x35c45a, belly: 0xfef3c7, accent: 0xfacc15, trail: 0xfff27a },
    blurb: "De snelste groene blokdino."
  },
  {
    id: "aqua",
    name: "Aqua",
    unlockStars: 12,
    colors: { body: 0x35a7f0, belly: 0xe0f7ff, accent: 0x0f5fae, trail: 0x9be3ff },
    blurb: "Razendsnel als een waterstraal."
  },
  {
    id: "web",
    name: "Web",
    unlockStars: 30,
    colors: { body: 0xe43c4a, belly: 0x1d2740, accent: 0x2c6cf0, trail: 0xff8aa0 },
    blurb: "Slingert door de lucht!"
  },
  {
    id: "ember",
    name: "Ember",
    unlockStars: 55,
    colors: { body: 0xff7a2f, belly: 0xfff0d6, accent: 0xb42318, trail: 0xffd166 },
    blurb: "Heet als een raket."
  },
  {
    id: "shadow",
    name: "Schaduw",
    unlockStars: 85,
    colors: { body: 0x6f59d9, belly: 0xd9d0ff, accent: 0x2a2150, trail: 0xc4b5ff },
    blurb: "Stiekem snel in het donker."
  },
  {
    id: "gold",
    name: "Goud",
    unlockStars: 130,
    colors: { body: 0xf4b942, belly: 0xfff7df, accent: 0xb4760a, trail: 0xffe9a8 },
    blurb: "De gouden kampioen!"
  }
];

export function skinById(id: string | undefined): HeroSkin {
  return HERO_SKINS.find((skin) => skin.id === id) ?? HERO_SKINS[0];
}

export function unlockedSkinIds(totalStars: number): string[] {
  return HERO_SKINS.filter((skin) => totalStars >= skin.unlockStars).map((skin) => skin.id);
}

/** Skins that became available between two star totals (for unlock toasts). */
export function newlyUnlockedSkins(beforeStars: number, afterStars: number): HeroSkin[] {
  return HERO_SKINS.filter((skin) => skin.unlockStars > beforeStars && skin.unlockStars <= afterStars);
}
