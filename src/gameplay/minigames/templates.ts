import { MINIGAME_TYPES } from "../../education/types";

const minigameLabels: Record<(typeof MINIGAME_TYPES)[number], string> = {
  "flash-gates": "Flitspoorten",
  "dice-hunt": "Dobbeljacht",
  "bead-bridge": "Kralenbrug",
  "make-ten-shield": "Tien-schild",
  "split-chests": "Deelkisten",
  "web-anchors": "Webankers",
  "train-of-ten": "Tientrein",
  "enemy-wave-compare": "Golf kiezen",
  "build-the-number": "Bouwgetal",
  "one-more-one-less": "Een erbij/eraf",
  "double-track": "Dubbelspoor",
  "rescue-the-herd": "Kudde redden"
};

export const minigameTemplates = MINIGAME_TYPES.map((type) => ({
  type,
  label: minigameLabels[type]
}));
