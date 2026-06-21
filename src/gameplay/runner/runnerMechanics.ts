export const runnerMechanics = [
  "flash-gate",
  "subitize-boost",
  "make-ten-shield",
  "bead-bridge",
  "jump-platform",
  "split-chest",
  "enemy-wave",
  "one-more-less",
  "rescue-cage",
  "shortcut-route",
  "dino-streak"
] as const;

export type RunnerMechanic = (typeof runnerMechanics)[number];

export const runnerMechanicLabels: Record<RunnerMechanic, string> = {
  "flash-gate": "Flitspoort",
  "subitize-boost": "Blitzboost",
  "make-ten-shield": "Tien-schild",
  "bead-bridge": "Kralenbrug",
  "jump-platform": "Sprongblok",
  "split-chest": "Deelkist",
  "enemy-wave": "Grootste golf",
  "one-more-less": "Een erbij/eraf",
  "rescue-cage": "Reddingskooi",
  "shortcut-route": "Geheime route",
  "dino-streak": "Dino-redding"
};
